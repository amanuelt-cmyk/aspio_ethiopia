package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/aspio-se/aspio-backend/internal/config"
	"github.com/aspio-se/aspio-backend/internal/database"
	"github.com/aspio-se/aspio-backend/internal/delivery"
	"github.com/aspio-se/aspio-backend/internal/httpapi"
	"github.com/aspio-se/aspio-backend/internal/migrations"
	"github.com/aspio-se/aspio-backend/internal/store"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	cfg, err := config.Load()
	if err != nil {
		logger.Error("load configuration", "error", err)
		os.Exit(1)
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	pool, err := database.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("open database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()
	if cfg.AutoMigrate {
		if err := migrations.Up(ctx, pool); err != nil {
			logger.Error("run migrations", "error", err)
			os.Exit(1)
		}
	}
	data := store.New(pool)
	worker := &delivery.Worker{Store: data, Mailer: delivery.NewResend(cfg.ResendAPIKey, cfg.LeadFrom, cfg.LeadRecipient), CRM: delivery.NewCRMWebhook(cfg.CRMWebhookURL, cfg.CRMWebhookToken), Logger: logger}
	go worker.Run(ctx)
	server := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           httpapi.New(cfg, data, logger),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       5 * time.Minute,
		WriteTimeout:      5 * time.Minute,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}
	serverErrors := make(chan error, 1)
	go func() {
		logger.Info("Aspio API started", "config", cfg.String())
		serverErrors <- server.ListenAndServe()
	}()
	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			logger.Error("HTTP server stopped", "error", err)
			os.Exit(1)
		}
	case <-ctx.Done():
		logger.Info("shutdown requested")
	}
	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", "error", err)
		_ = server.Close()
	}
	logger.Info("Aspio API stopped")
}

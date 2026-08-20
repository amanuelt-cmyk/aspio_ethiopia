package config

import (
	"errors"
	"fmt"
	"net/mail"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Environment       string
	HTTPAddr          string
	DatabaseURL       string
	AllowedOrigins    []string
	AutoMigrate       bool
	SessionTTL        time.Duration
	ShutdownTimeout   time.Duration
	ResendAPIKey      string
	LeadRecipient     string
	LeadFrom          string
	CRMWebhookURL     string
	CRMWebhookToken   string
	IPHashSecret      string
	TrustProxyHeaders bool
	UploadDir         string
}

func Load() (Config, error) {
	cfg := Config{
		Environment:       strings.ToLower(env("APP_ENV", "development")),
		HTTPAddr:          env("HTTP_ADDR", ":8080"),
		DatabaseURL:       strings.TrimSpace(os.Getenv("DATABASE_URL")),
		AllowedOrigins:    csv(env("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")),
		AutoMigrate:       envBool("AUTO_MIGRATE", false),
		SessionTTL:        envDuration("SESSION_TTL", 24*time.Hour),
		ShutdownTimeout:   envDuration("SHUTDOWN_TIMEOUT", 10*time.Second),
		ResendAPIKey:      strings.TrimSpace(os.Getenv("RESEND_API_KEY")),
		LeadRecipient:     env("LEAD_RECIPIENT_EMAIL", "amanuel.t@aspio.se"),
		LeadFrom:          env("LEAD_FROM_EMAIL", "Aspio Leads <onboarding@resend.dev>"),
		CRMWebhookURL:     strings.TrimSpace(os.Getenv("CRM_WEBHOOK_URL")),
		CRMWebhookToken:   strings.TrimSpace(os.Getenv("CRM_WEBHOOK_TOKEN")),
		IPHashSecret:      env("IP_HASH_SECRET", "development-only-ip-hash-key"),
		TrustProxyHeaders: envBool("TRUST_PROXY_HEADERS", false),
		UploadDir:         env("UPLOAD_DIR", "./data/uploads"),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}
	if cfg.Environment != "development" && cfg.Environment != "test" && cfg.Environment != "production" {
		return Config{}, errors.New("APP_ENV must be development, test, or production")
	}
	if cfg.Environment == "production" {
		databaseURL, err := url.Parse(cfg.DatabaseURL)
		if err != nil || (databaseURL.Scheme != "postgres" && databaseURL.Scheme != "postgresql") || databaseURL.Host == "" {
			return Config{}, errors.New("production DATABASE_URL must be a complete postgres URL")
		}
		sslMode := strings.ToLower(databaseURL.Query().Get("sslmode"))
		if sslMode != "require" && sslMode != "verify-ca" && sslMode != "verify-full" {
			return Config{}, errors.New("production DATABASE_URL must require TLS with sslmode=require, verify-ca, or verify-full")
		}
	}
	if len(cfg.AllowedOrigins) == 0 {
		return Config{}, errors.New("CORS_ALLOWED_ORIGINS must contain at least one origin")
	}
	if cfg.SessionTTL < time.Hour {
		return Config{}, errors.New("SESSION_TTL must be at least 1h")
	}
	if cfg.SessionTTL > 30*24*time.Hour {
		return Config{}, errors.New("SESSION_TTL cannot exceed 30 days")
	}
	if cfg.ShutdownTimeout < time.Second || cfg.ShutdownTimeout > time.Minute {
		return Config{}, errors.New("SHUTDOWN_TIMEOUT must be between 1s and 1m")
	}
	if address, err := mail.ParseAddress(cfg.LeadRecipient); err != nil || !strings.EqualFold(address.Address, cfg.LeadRecipient) {
		return Config{}, errors.New("LEAD_RECIPIENT_EMAIL must be one email address")
	}
	if _, err := mail.ParseAddress(cfg.LeadFrom); err != nil {
		return Config{}, errors.New("LEAD_FROM_EMAIL must be a valid email address")
	}
	if cfg.Environment == "production" && len(cfg.IPHashSecret) < 32 {
		return Config{}, errors.New("IP_HASH_SECRET must contain at least 32 characters in production")
	}
	for _, origin := range cfg.AllowedOrigins {
		if err := validatePublicURL(origin, cfg.Environment == "production", false); err != nil {
			return Config{}, fmt.Errorf("invalid CORS_ALLOWED_ORIGINS entry %q: %w", origin, err)
		}
	}
	if cfg.CRMWebhookURL != "" {
		if err := validatePublicURL(cfg.CRMWebhookURL, cfg.Environment == "production", true); err != nil {
			return Config{}, fmt.Errorf("invalid CRM_WEBHOOK_URL: %w", err)
		}
	}
	cleanUploadDir := filepath.Clean(cfg.UploadDir)
	if cleanUploadDir == "." || cleanUploadDir == string(filepath.Separator) {
		return Config{}, errors.New("UPLOAD_DIR must be a dedicated directory")
	}
	return cfg, nil
}

func validatePublicURL(value string, requireHTTPS, allowPath bool) error {
	parsed, err := url.Parse(value)
	if err != nil || parsed.Host == "" || parsed.User != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return errors.New("use a complete http(s) URL without credentials")
	}
	if requireHTTPS && parsed.Scheme != "https" {
		return errors.New("production URLs must use HTTPS")
	}
	if !allowPath && ((parsed.Path != "" && parsed.Path != "/") || parsed.RawQuery != "" || parsed.Fragment != "") {
		return errors.New("origins cannot include a path, query, or fragment")
	}
	return nil
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func csv(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if item := strings.TrimSpace(part); item != "" {
			result = append(result, strings.TrimRight(item, "/"))
		}
	}
	return result
}

func envBool(key string, fallback bool) bool {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func envDuration(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func (c Config) String() string {
	return fmt.Sprintf("environment=%s addr=%s origins=%d", c.Environment, c.HTTPAddr, len(c.AllowedOrigins))
}

package delivery

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"time"

	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/domain"
	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/store"
)

type Worker struct {
	Store        *store.Store
	Mailer       *Resend
	CRM          *CRMWebhook
	Logger       *slog.Logger
	PollInterval time.Duration
	MaxAttempts  int
}

func (w *Worker) Run(ctx context.Context) {
	if w.PollInterval == 0 {
		w.PollInterval = 2 * time.Second
	}
	if w.MaxAttempts == 0 {
		w.MaxAttempts = 8
	}
	ticker := time.NewTicker(w.PollInterval)
	defer ticker.Stop()
	w.drain(ctx)
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			w.drain(ctx)
		}
	}
}

func (w *Worker) drain(ctx context.Context) {
	for i := 0; i < 20; i++ {
		job, err := w.Store.ClaimDeliveryJob(ctx)
		if errors.Is(err, store.ErrNotFound) {
			return
		}
		if err != nil {
			w.Logger.Error("claim delivery job", "error", err)
			return
		}
		var lead domain.Lead
		if err := json.Unmarshal(job.Payload, &lead); err != nil {
			_ = w.Store.FailDeliveryJob(ctx, job, err, 1)
			continue
		}
		requestCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
		var providerID string
		switch job.Kind {
		case "lead.email":
			providerID, err = w.Mailer.SendLead(requestCtx, lead)
		case "lead.crm":
			providerID, err = w.CRM.SendLead(requestCtx, lead)
		default:
			err = errors.New("unsupported delivery job kind")
		}
		cancel()
		if err != nil {
			w.Logger.Warn("delivery attempt failed", "job_id", job.ID, "kind", job.Kind, "attempt", job.Attempts+1, "error", err)
			if storeErr := w.Store.FailDeliveryJob(ctx, job, err, w.MaxAttempts); storeErr != nil {
				w.Logger.Error("record delivery failure", "job_id", job.ID, "error", storeErr)
			}
			continue
		}
		if err := w.Store.CompleteDeliveryJob(ctx, job, providerID); err != nil {
			w.Logger.Error("complete delivery job", "job_id", job.ID, "error", err)
		}
	}
}

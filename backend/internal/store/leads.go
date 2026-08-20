package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/domain"
)

const leadColumns = `id::text,kind,source,locale,name,email,phone,business_name,message,status,email_status,created_at,updated_at`

func scanLead(row interface{ Scan(...any) error }) (domain.Lead, error) {
	var item domain.Lead
	err := row.Scan(&item.ID, &item.Kind, &item.Source, &item.Locale, &item.Name, &item.Email, &item.Phone, &item.BusinessName, &item.Message, &item.Status, &item.EmailStatus, &item.CreatedAt, &item.UpdatedAt)
	return item, translateError(err)
}

func (s *Store) CreateLead(ctx context.Context, item domain.Lead, ipHash, userAgent string, queueCRM bool) (domain.Lead, error) {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return domain.Lead{}, err
	}
	defer tx.Rollback(ctx)
	item, err = scanLead(tx.QueryRow(ctx, `INSERT INTO leads(kind,source,locale,name,email,phone,business_name,message,ip_hash,user_agent)
		VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING `+leadColumns, item.Kind, item.Source, item.Locale, item.Name, item.Email, item.Phone, item.BusinessName, item.Message, ipHash, userAgent))
	if err != nil {
		return domain.Lead{}, err
	}
	payload, err := json.Marshal(item)
	if err != nil {
		return domain.Lead{}, err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO delivery_jobs(kind,aggregate_id,payload) VALUES('lead.email',$1,$2)`, item.ID, payload); err != nil {
		return domain.Lead{}, err
	}
	if queueCRM {
		if _, err = tx.Exec(ctx, `INSERT INTO delivery_jobs(kind,aggregate_id,payload) VALUES('lead.crm',$1,$2)`, item.ID, payload); err != nil {
			return domain.Lead{}, err
		}
	}
	if err = tx.Commit(ctx); err != nil {
		return domain.Lead{}, err
	}
	return item, nil
}

type LeadFilter struct {
	Page, PageSize int
	Status, Query  string
}

func (s *Store) ListLeads(ctx context.Context, filter LeadFilter) (domain.Page[domain.Lead], error) {
	args := []any{}
	where := "true"
	if filter.Status != "" {
		args = append(args, filter.Status)
		where += fmt.Sprintf(" AND status=$%d", len(args))
	}
	if filter.Query != "" {
		args = append(args, "%"+filter.Query+"%")
		where += fmt.Sprintf(" AND (name ILIKE $%d OR email ILIKE $%d OR phone ILIKE $%d OR business_name ILIKE $%d)", len(args), len(args), len(args), len(args))
	}
	args = append(args, filter.PageSize, (filter.Page-1)*filter.PageSize)
	query := fmt.Sprintf(`SELECT %s,count(*) OVER() FROM leads WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, leadColumns, where, len(args)-1, len(args))
	rows, err := s.Pool.Query(ctx, query, args...)
	if err != nil {
		return domain.Page[domain.Lead]{}, err
	}
	defer rows.Close()
	result := domain.Page[domain.Lead]{Items: []domain.Lead{}, Page: filter.Page, PageSize: filter.PageSize}
	for rows.Next() {
		var item domain.Lead
		if err := rows.Scan(&item.ID, &item.Kind, &item.Source, &item.Locale, &item.Name, &item.Email, &item.Phone, &item.BusinessName, &item.Message, &item.Status, &item.EmailStatus, &item.CreatedAt, &item.UpdatedAt, &result.Total); err != nil {
			return domain.Page[domain.Lead]{}, err
		}
		result.Items = append(result.Items, item)
	}
	return result, rows.Err()
}

func (s *Store) UpdateLeadStatus(ctx context.Context, id, status string) (domain.Lead, error) {
	return scanLead(s.Pool.QueryRow(ctx, `UPDATE leads SET status=$2,updated_at=now() WHERE id=$1 RETURNING `+leadColumns, id, status))
}

func (s *Store) ClaimDeliveryJob(ctx context.Context) (domain.DeliveryJob, error) {
	var job domain.DeliveryJob
	err := s.Pool.QueryRow(ctx, `WITH candidate AS (
		SELECT id FROM delivery_jobs WHERE (status='pending' AND available_at<=now()) OR (status='processing' AND locked_at<now()-interval '10 minutes')
		ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1)
		UPDATE delivery_jobs j SET status='processing',locked_at=now(),updated_at=now() FROM candidate c WHERE j.id=c.id
		RETURNING j.id,j.kind,j.aggregate_id::text,j.payload,j.attempts`).Scan(&job.ID, &job.Kind, &job.AggregateID, &job.Payload, &job.Attempts)
	return job, translateError(err)
}

func (s *Store) CompleteDeliveryJob(ctx context.Context, job domain.DeliveryJob, providerID string) error {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, `UPDATE delivery_jobs SET status='sent',provider_id=$2,locked_at=NULL,updated_at=now() WHERE id=$1`, job.ID, providerID); err != nil {
		return err
	}
	if job.Kind == "lead.email" {
		if _, err = tx.Exec(ctx, `UPDATE leads SET email_status='sent',updated_at=now() WHERE id=$1`, job.AggregateID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (s *Store) FailDeliveryJob(ctx context.Context, job domain.DeliveryJob, deliveryErr error, maxAttempts int) error {
	attempts := job.Attempts + 1
	status := "pending"
	if attempts >= maxAttempts {
		status = "dead"
	}
	backoff := time.Duration(1<<min(attempts, 10)) * time.Minute
	message := deliveryErr.Error()
	if len(message) > 1000 {
		message = message[:1000]
	}
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, `UPDATE delivery_jobs SET status=$2,attempts=$3,available_at=$4,locked_at=NULL,last_error=$5,updated_at=now() WHERE id=$1`, job.ID, status, attempts, time.Now().Add(backoff), message); err != nil {
		return err
	}
	if status == "dead" && job.Kind == "lead.email" {
		if _, err = tx.Exec(ctx, `UPDATE leads SET email_status='failed',updated_at=now() WHERE id=$1`, job.AggregateID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

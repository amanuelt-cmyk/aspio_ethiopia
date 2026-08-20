package store

import (
	"context"

	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/domain"
)

const mediaColumns = `id::text,salon_id::text,kind,url,mime_type,original_name,alt_text,size_bytes,sort_order,created_at`

func scanSalonMedia(row interface{ Scan(...any) error }) (domain.SalonMedia, error) {
	var item domain.SalonMedia
	err := row.Scan(&item.ID, &item.SalonID, &item.Kind, &item.URL, &item.MIMEType, &item.OriginalName, &item.AltText, &item.SizeBytes, &item.SortOrder, &item.CreatedAt)
	return item, translateError(err)
}

func (s *Store) ListSalonMedia(ctx context.Context, salonID string) ([]domain.SalonMedia, error) {
	rows, err := s.Pool.Query(ctx, `SELECT `+mediaColumns+` FROM salon_media WHERE salon_id=$1 ORDER BY sort_order,created_at,id`, salonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.SalonMedia{}
	for rows.Next() {
		item, err := scanSalonMedia(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) CreateSalonMedia(ctx context.Context, item domain.SalonMedia) (domain.SalonMedia, error) {
	return scanSalonMedia(s.Pool.QueryRow(ctx, `INSERT INTO salon_media (salon_id,kind,url,mime_type,original_name,alt_text,size_bytes,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING `+mediaColumns, item.SalonID, item.Kind, item.URL, item.MIMEType, item.OriginalName, item.AltText, item.SizeBytes, item.SortOrder))
}

func (s *Store) DeleteSalonMedia(ctx context.Context, salonID, mediaID string) (domain.SalonMedia, error) {
	return scanSalonMedia(s.Pool.QueryRow(ctx, `DELETE FROM salon_media WHERE id=$1 AND salon_id=$2 RETURNING `+mediaColumns, mediaID, salonID))
}

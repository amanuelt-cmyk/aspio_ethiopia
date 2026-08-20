package store

import (
	"context"

	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/domain"
)

const galleryColumns = `id::text,kind,status,url,mime_type,original_name,title_am,title_en,caption_am,caption_en,size_bytes,sort_order,COALESCE(created_by::text,''),created_at,updated_at`

func scanGalleryMedia(row interface{ Scan(...any) error }) (domain.GalleryMedia, error) {
	var item domain.GalleryMedia
	err := row.Scan(&item.ID, &item.Kind, &item.Status, &item.URL, &item.MIMEType, &item.OriginalName, &item.TitleAM, &item.TitleEN, &item.CaptionAM, &item.CaptionEN, &item.SizeBytes, &item.SortOrder, &item.CreatedBy, &item.CreatedAt, &item.UpdatedAt)
	return item, translateError(err)
}

func (s *Store) ListGalleryMedia(ctx context.Context, kind string) ([]domain.GalleryMedia, error) {
	rows, err := s.Pool.Query(ctx, `SELECT `+galleryColumns+` FROM gallery_media WHERE ($1='' OR kind=$1) ORDER BY kind,sort_order,created_at DESC,id`, kind)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.GalleryMedia{}
	for rows.Next() {
		item, scanErr := scanGalleryMedia(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) ListPublicGalleryMedia(ctx context.Context, kind, locale string) ([]domain.PublicGalleryMedia, error) {
	rows, err := s.Pool.Query(ctx, `SELECT id::text,kind,url,mime_type,original_name,
		CASE WHEN $2='am' THEN title_am ELSE title_en END,
		CASE WHEN $2='am' THEN caption_am ELSE caption_en END,
		size_bytes,sort_order,created_at
		FROM gallery_media WHERE status='published' AND ($1='' OR kind=$1)
		ORDER BY kind,sort_order,created_at DESC,id`, kind, locale)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.PublicGalleryMedia{}
	for rows.Next() {
		var item domain.PublicGalleryMedia
		if err := rows.Scan(&item.ID, &item.Kind, &item.URL, &item.MIMEType, &item.OriginalName, &item.Title, &item.Caption, &item.SizeBytes, &item.SortOrder, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) CreateGalleryMedia(ctx context.Context, item domain.GalleryMedia) (domain.GalleryMedia, error) {
	return scanGalleryMedia(s.Pool.QueryRow(ctx, `INSERT INTO gallery_media
		(kind,status,url,mime_type,original_name,title_am,title_en,caption_am,caption_en,size_bytes,sort_order,created_by)
		VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NULLIF($12,'')::uuid) RETURNING `+galleryColumns,
		item.Kind, item.Status, item.URL, item.MIMEType, item.OriginalName, item.TitleAM, item.TitleEN, item.CaptionAM, item.CaptionEN, item.SizeBytes, item.SortOrder, item.CreatedBy))
}

func (s *Store) UpdateGalleryMedia(ctx context.Context, id string, item domain.GalleryMedia) (domain.GalleryMedia, error) {
	return scanGalleryMedia(s.Pool.QueryRow(ctx, `UPDATE gallery_media SET status=$2,title_am=$3,title_en=$4,caption_am=$5,caption_en=$6,sort_order=$7,updated_at=now() WHERE id=$1 RETURNING `+galleryColumns,
		id, item.Status, item.TitleAM, item.TitleEN, item.CaptionAM, item.CaptionEN, item.SortOrder))
}

func (s *Store) DeleteGalleryMedia(ctx context.Context, id string) (domain.GalleryMedia, error) {
	return scanGalleryMedia(s.Pool.QueryRow(ctx, `DELETE FROM gallery_media WHERE id=$1 RETURNING `+galleryColumns, id))
}

const featuredColumns = `id::text,salon_id::text,badge_am,badge_en,description_am,description_en,sort_order,active,COALESCE(created_by::text,''),created_at,updated_at`

func scanFeaturedPlace(row interface{ Scan(...any) error }) (domain.FeaturedPlace, error) {
	var item domain.FeaturedPlace
	err := row.Scan(&item.ID, &item.SalonID, &item.BadgeAM, &item.BadgeEN, &item.DescriptionAM, &item.DescriptionEN, &item.SortOrder, &item.Active, &item.CreatedBy, &item.CreatedAt, &item.UpdatedAt)
	return item, translateError(err)
}

func (s *Store) ListFeaturedPlaces(ctx context.Context) ([]domain.FeaturedPlace, error) {
	rows, err := s.Pool.Query(ctx, `SELECT `+featuredColumns+` FROM featured_places ORDER BY active DESC,sort_order,created_at,id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.FeaturedPlace{}
	for rows.Next() {
		item, scanErr := scanFeaturedPlace(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) CreateFeaturedPlace(ctx context.Context, item domain.FeaturedPlace) (domain.FeaturedPlace, error) {
	return scanFeaturedPlace(s.Pool.QueryRow(ctx, `INSERT INTO featured_places(salon_id,badge_am,badge_en,description_am,description_en,sort_order,active,created_by)
		VALUES($1,$2,$3,$4,$5,$6,$7,NULLIF($8,'')::uuid) RETURNING `+featuredColumns,
		item.SalonID, item.BadgeAM, item.BadgeEN, item.DescriptionAM, item.DescriptionEN, item.SortOrder, item.Active, item.CreatedBy))
}

func (s *Store) UpdateFeaturedPlace(ctx context.Context, id string, item domain.FeaturedPlace) (domain.FeaturedPlace, error) {
	return scanFeaturedPlace(s.Pool.QueryRow(ctx, `UPDATE featured_places SET salon_id=$2,badge_am=$3,badge_en=$4,description_am=$5,description_en=$6,sort_order=$7,active=$8,updated_at=now() WHERE id=$1 RETURNING `+featuredColumns,
		id, item.SalonID, item.BadgeAM, item.BadgeEN, item.DescriptionAM, item.DescriptionEN, item.SortOrder, item.Active))
}

func (s *Store) DeleteFeaturedPlace(ctx context.Context, id string) error {
	result, err := s.Pool.Exec(ctx, `DELETE FROM featured_places WHERE id=$1`, id)
	if err == nil && result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return err
}

func (s *Store) ListPublicFeaturedPlaces(ctx context.Context, locale string) ([]domain.PublicFeaturedPlace, error) {
	rows, err := s.Pool.Query(ctx, `SELECT f.id::text,s.id::text,s.slug,
		CASE WHEN $1='am' THEN s.name_am ELSE s.name_en END,s.category,
		CASE WHEN $1='am' THEN s.area_am ELSE s.area_en END,
		COALESCE((SELECT sm.url FROM salon_media sm WHERE sm.salon_id=s.id AND sm.kind='image' ORDER BY sm.sort_order,sm.created_at LIMIT 1),s.image_url),
		s.price_from_etb,s.rating::float8,CASE WHEN $1='am' THEN s.tag_am ELSE s.tag_en END,
		CASE WHEN $1='am' THEN f.badge_am ELSE f.badge_en END,
		CASE WHEN $1='am' THEN f.description_am ELSE f.description_en END,f.sort_order
		FROM featured_places f JOIN salons s ON s.id=f.salon_id
		WHERE f.active=true AND s.status='published' AND s.published_at<=now() AND s.deleted_at IS NULL
		ORDER BY f.sort_order,f.created_at,f.id`, locale)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.PublicFeaturedPlace{}
	for rows.Next() {
		var item domain.PublicFeaturedPlace
		if err := rows.Scan(&item.ID, &item.SalonID, &item.Slug, &item.Name, &item.Category, &item.Area, &item.ImageURL, &item.PriceFromETB, &item.Rating, &item.Tag, &item.Badge, &item.Description, &item.SortOrder); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

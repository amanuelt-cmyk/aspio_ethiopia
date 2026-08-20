package store

import (
	"context"
	"fmt"
	"strings"

	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/domain"
)

const salonColumns = `id::text, slug, status, category, name_am, name_en, description_am, description_en,
	area_am, area_en, address, google_maps_url, latitude::float8, longitude::float8, phone, email, website_url, booking_url,
	image_url, price_from_etb, rating::float8, review_count, tag_am, tag_en, opening_hours, amenities,
	sort_order, published_at, created_at, updated_at`

func scanSalon(row interface{ Scan(...any) error }) (domain.Salon, error) {
	var item domain.Salon
	err := row.Scan(
		&item.ID, &item.Slug, &item.Status, &item.Category, &item.NameAM, &item.NameEN,
		&item.DescriptionAM, &item.DescriptionEN, &item.AreaAM, &item.AreaEN, &item.Address, &item.GoogleMapsURL,
		&item.Latitude, &item.Longitude, &item.Phone, &item.Email, &item.WebsiteURL, &item.BookingURL,
		&item.ImageURL, &item.PriceFromETB, &item.Rating, &item.ReviewCount, &item.TagAM, &item.TagEN,
		&item.OpeningHours, &item.Amenities, &item.SortOrder, &item.PublishedAt, &item.CreatedAt, &item.UpdatedAt,
	)
	return item, translateError(err)
}

func salonValues(item domain.Salon) []any {
	return []any{
		item.Slug, item.Status, item.Category, item.NameAM, item.NameEN, item.DescriptionAM, item.DescriptionEN,
		item.AreaAM, item.AreaEN, item.Address, item.GoogleMapsURL, item.Latitude, item.Longitude, item.Phone, item.Email,
		item.WebsiteURL, item.BookingURL, item.ImageURL, item.PriceFromETB, item.Rating, item.ReviewCount,
		item.TagAM, item.TagEN, item.OpeningHours, item.Amenities, item.SortOrder,
	}
}

func (s *Store) CreateSalon(ctx context.Context, item domain.Salon) (domain.Salon, error) {
	query := `INSERT INTO salons (
		slug,status,category,name_am,name_en,description_am,description_en,area_am,area_en,address,
		google_maps_url,latitude,longitude,phone,email,website_url,booking_url,image_url,price_from_etb,rating,review_count,
		tag_am,tag_en,opening_hours,amenities,sort_order,published_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,
		CASE WHEN $2='published' THEN COALESCE($27,now()) ELSE $27 END)
		RETURNING ` + salonColumns
	args := append(salonValues(item), item.PublishedAt)
	return scanSalon(s.Pool.QueryRow(ctx, query, args...))
}

func (s *Store) UpdateSalon(ctx context.Context, id string, item domain.Salon) (domain.Salon, error) {
	query := `UPDATE salons SET
		slug=$1,status=$2,category=$3,name_am=$4,name_en=$5,description_am=$6,description_en=$7,
		area_am=$8,area_en=$9,address=$10,google_maps_url=$11,latitude=$12,longitude=$13,phone=$14,email=$15,
		website_url=$16,booking_url=$17,image_url=$18,price_from_etb=$19,rating=$20,review_count=$21,
		tag_am=$22,tag_en=$23,opening_hours=$24,amenities=$25,sort_order=$26,
		published_at=CASE WHEN $2='published' THEN COALESCE(published_at,now()) ELSE published_at END,
		updated_at=now()
		WHERE id=$27 AND deleted_at IS NULL RETURNING ` + salonColumns
	args := append(salonValues(item), id)
	return scanSalon(s.Pool.QueryRow(ctx, query, args...))
}

func (s *Store) GetSalon(ctx context.Context, id string) (domain.Salon, error) {
	return scanSalon(s.Pool.QueryRow(ctx, `SELECT `+salonColumns+` FROM salons WHERE id=$1 AND deleted_at IS NULL`, id))
}

func (s *Store) DeleteSalon(ctx context.Context, id string) error {
	result, err := s.Pool.Exec(ctx, `UPDATE salons SET deleted_at=now(), updated_at=now() WHERE id=$1 AND deleted_at IS NULL`, id)
	if err == nil && result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return err
}

type SalonFilter struct {
	Page, PageSize int
	Locale         string
	Query          string
	Category       string
	Area           string
	Status         string
}

func (s *Store) ListPublicSalons(ctx context.Context, filter SalonFilter) (domain.Page[domain.PublicSalon], error) {
	args := []any{filter.Locale}
	where := []string{"status='published'", "published_at<=now()", "deleted_at IS NULL"}
	if filter.Category != "" {
		args = append(args, filter.Category)
		where = append(where, fmt.Sprintf("category=$%d", len(args)))
	}
	if filter.Area != "" {
		args = append(args, "%"+filter.Area+"%")
		where = append(where, fmt.Sprintf("(area_am ILIKE $%d OR area_en ILIKE $%d)", len(args), len(args)))
	}
	if filter.Query != "" {
		args = append(args, "%"+filter.Query+"%")
		where = append(where, fmt.Sprintf("(name_am ILIKE $%d OR name_en ILIKE $%d OR area_am ILIKE $%d OR area_en ILIKE $%d)", len(args), len(args), len(args), len(args)))
	}
	args = append(args, filter.PageSize, (filter.Page-1)*filter.PageSize)
	query := fmt.Sprintf(`SELECT id::text,slug,
		CASE WHEN $1='am' THEN name_am ELSE name_en END,
		CASE WHEN $1='am' THEN description_am ELSE description_en END,
		category, CASE WHEN $1='am' THEN area_am ELSE area_en END, address,
		latitude::float8,longitude::float8,phone,email,website_url,booking_url,
		COALESCE((SELECT sm.url FROM salon_media sm WHERE sm.salon_id=salons.id AND sm.kind='image' ORDER BY sm.sort_order,sm.created_at LIMIT 1),image_url),
		price_from_etb,rating::float8,review_count,CASE WHEN $1='am' THEN tag_am ELSE tag_en END,
		opening_hours,amenities,count(*) OVER()
		FROM salons WHERE %s ORDER BY sort_order ASC,published_at DESC,id
		LIMIT $%d OFFSET $%d`, strings.Join(where, " AND "), len(args)-1, len(args))

	rows, err := s.Pool.Query(ctx, query, args...)
	if err != nil {
		return domain.Page[domain.PublicSalon]{}, err
	}
	defer rows.Close()
	result := domain.Page[domain.PublicSalon]{Items: []domain.PublicSalon{}, Page: filter.Page, PageSize: filter.PageSize}
	for rows.Next() {
		var item domain.PublicSalon
		if err := rows.Scan(&item.ID, &item.Slug, &item.Name, &item.Description, &item.Category, &item.Area, &item.Address,
			&item.Latitude, &item.Longitude, &item.Phone, &item.Email, &item.WebsiteURL, &item.BookingURL, &item.ImageURL,
			&item.PriceFromETB, &item.Rating, &item.ReviewCount, &item.Tag, &item.OpeningHours, &item.Amenities, &result.Total); err != nil {
			return domain.Page[domain.PublicSalon]{}, err
		}
		result.Items = append(result.Items, item)
	}
	return result, rows.Err()
}

func (s *Store) GetPublicSalonBySlug(ctx context.Context, slug, locale string) (domain.PublicSalon, error) {
	var item domain.PublicSalon
	err := s.Pool.QueryRow(ctx, `SELECT id::text,slug,
		CASE WHEN $2='am' THEN name_am ELSE name_en END,
		CASE WHEN $2='am' THEN description_am ELSE description_en END,
		category,CASE WHEN $2='am' THEN area_am ELSE area_en END,address,latitude::float8,longitude::float8,
		phone,email,website_url,booking_url,
		COALESCE((SELECT sm.url FROM salon_media sm WHERE sm.salon_id=salons.id AND sm.kind='image' ORDER BY sm.sort_order,sm.created_at LIMIT 1),image_url),
		price_from_etb,rating::float8,review_count,
		CASE WHEN $2='am' THEN tag_am ELSE tag_en END,opening_hours,amenities
		FROM salons WHERE slug=$1 AND status='published' AND published_at<=now() AND deleted_at IS NULL`, slug, locale).Scan(
		&item.ID, &item.Slug, &item.Name, &item.Description, &item.Category, &item.Area, &item.Address,
		&item.Latitude, &item.Longitude, &item.Phone, &item.Email, &item.WebsiteURL, &item.BookingURL, &item.ImageURL,
		&item.PriceFromETB, &item.Rating, &item.ReviewCount, &item.Tag, &item.OpeningHours, &item.Amenities)
	if err != nil {
		return item, translateError(err)
	}
	item.Media, err = s.ListSalonMedia(ctx, item.ID)
	return item, err
}

func (s *Store) ListAdminSalons(ctx context.Context, filter SalonFilter) (domain.Page[domain.Salon], error) {
	args := []any{}
	where := []string{"deleted_at IS NULL"}
	if filter.Status != "" {
		args = append(args, filter.Status)
		where = append(where, fmt.Sprintf("status=$%d", len(args)))
	}
	if filter.Query != "" {
		args = append(args, "%"+filter.Query+"%")
		where = append(where, fmt.Sprintf("(name_am ILIKE $%d OR name_en ILIKE $%d OR slug ILIKE $%d)", len(args), len(args), len(args)))
	}
	args = append(args, filter.PageSize, (filter.Page-1)*filter.PageSize)
	query := fmt.Sprintf(`SELECT %s,count(*) OVER() FROM salons WHERE %s ORDER BY updated_at DESC LIMIT $%d OFFSET $%d`, salonColumns, strings.Join(where, " AND "), len(args)-1, len(args))
	rows, err := s.Pool.Query(ctx, query, args...)
	if err != nil {
		return domain.Page[domain.Salon]{}, err
	}
	defer rows.Close()
	result := domain.Page[domain.Salon]{Items: []domain.Salon{}, Page: filter.Page, PageSize: filter.PageSize}
	for rows.Next() {
		var item domain.Salon
		err := rows.Scan(&item.ID, &item.Slug, &item.Status, &item.Category, &item.NameAM, &item.NameEN, &item.DescriptionAM, &item.DescriptionEN,
			&item.AreaAM, &item.AreaEN, &item.Address, &item.GoogleMapsURL, &item.Latitude, &item.Longitude, &item.Phone, &item.Email, &item.WebsiteURL, &item.BookingURL,
			&item.ImageURL, &item.PriceFromETB, &item.Rating, &item.ReviewCount, &item.TagAM, &item.TagEN, &item.OpeningHours, &item.Amenities,
			&item.SortOrder, &item.PublishedAt, &item.CreatedAt, &item.UpdatedAt, &result.Total)
		if err != nil {
			return domain.Page[domain.Salon]{}, err
		}
		result.Items = append(result.Items, item)
	}
	return result, rows.Err()
}

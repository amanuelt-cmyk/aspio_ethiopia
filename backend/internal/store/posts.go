package store

import (
	"context"
	"fmt"
	"strings"

	"github.com/aspio-se/aspio-backend/internal/domain"
)

const postColumns = `id::text,slug,status,title_am,title_en,excerpt_am,excerpt_en,content_am,content_en,
	cover_image_url,author_name,tags,seo_title_am,seo_title_en,seo_description_am,seo_description_en,
	published_at,created_at,updated_at`

func scanPost(row interface{ Scan(...any) error }) (domain.BlogPost, error) {
	var item domain.BlogPost
	err := row.Scan(&item.ID, &item.Slug, &item.Status, &item.TitleAM, &item.TitleEN, &item.ExcerptAM, &item.ExcerptEN,
		&item.ContentAM, &item.ContentEN, &item.CoverImageURL, &item.AuthorName, &item.Tags, &item.SEOTitleAM, &item.SEOTitleEN,
		&item.SEODescriptionAM, &item.SEODescriptionEN, &item.PublishedAt, &item.CreatedAt, &item.UpdatedAt)
	return item, translateError(err)
}

func postValues(item domain.BlogPost) []any {
	return []any{item.Slug, item.Status, item.TitleAM, item.TitleEN, item.ExcerptAM, item.ExcerptEN, item.ContentAM, item.ContentEN,
		item.CoverImageURL, item.AuthorName, item.Tags, item.SEOTitleAM, item.SEOTitleEN, item.SEODescriptionAM, item.SEODescriptionEN}
}

func (s *Store) CreatePost(ctx context.Context, item domain.BlogPost) (domain.BlogPost, error) {
	query := `INSERT INTO blog_posts(slug,status,title_am,title_en,excerpt_am,excerpt_en,content_am,content_en,
		cover_image_url,author_name,tags,seo_title_am,seo_title_en,seo_description_am,seo_description_en,published_at)
		VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,CASE WHEN $2='published' THEN COALESCE($16,now()) ELSE $16 END)
		RETURNING ` + postColumns
	args := append(postValues(item), item.PublishedAt)
	return scanPost(s.Pool.QueryRow(ctx, query, args...))
}

func (s *Store) UpdatePost(ctx context.Context, id string, item domain.BlogPost) (domain.BlogPost, error) {
	query := `UPDATE blog_posts SET slug=$1,status=$2,title_am=$3,title_en=$4,excerpt_am=$5,excerpt_en=$6,
		content_am=$7,content_en=$8,cover_image_url=$9,author_name=$10,tags=$11,seo_title_am=$12,seo_title_en=$13,
		seo_description_am=$14,seo_description_en=$15,
		published_at=CASE WHEN $2='published' THEN COALESCE(published_at,now()) ELSE published_at END,updated_at=now()
		WHERE id=$16 AND deleted_at IS NULL RETURNING ` + postColumns
	args := append(postValues(item), id)
	return scanPost(s.Pool.QueryRow(ctx, query, args...))
}

func (s *Store) GetPost(ctx context.Context, id string) (domain.BlogPost, error) {
	return scanPost(s.Pool.QueryRow(ctx, `SELECT `+postColumns+` FROM blog_posts WHERE id=$1 AND deleted_at IS NULL`, id))
}

func (s *Store) DeletePost(ctx context.Context, id string) error {
	result, err := s.Pool.Exec(ctx, `UPDATE blog_posts SET deleted_at=now(),updated_at=now() WHERE id=$1 AND deleted_at IS NULL`, id)
	if err == nil && result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return err
}

type PostFilter struct {
	Page, PageSize             int
	Locale, Query, Tag, Status string
}

func (s *Store) ListPublicPosts(ctx context.Context, filter PostFilter, includeContent bool) (domain.Page[domain.PublicBlogPost], error) {
	args := []any{filter.Locale}
	where := []string{"status='published'", "published_at<=now()", "deleted_at IS NULL"}
	if filter.Query != "" {
		args = append(args, "%"+filter.Query+"%")
		where = append(where, fmt.Sprintf("(title_am ILIKE $%d OR title_en ILIKE $%d OR excerpt_am ILIKE $%d OR excerpt_en ILIKE $%d)", len(args), len(args), len(args), len(args)))
	}
	if filter.Tag != "" {
		args = append(args, filter.Tag)
		where = append(where, fmt.Sprintf("$%d=ANY(tags)", len(args)))
	}
	contentExpression := `''`
	if includeContent {
		contentExpression = `CASE WHEN $1='am' THEN content_am ELSE content_en END`
	}
	args = append(args, filter.PageSize, (filter.Page-1)*filter.PageSize)
	query := fmt.Sprintf(`SELECT id::text,slug,CASE WHEN $1='am' THEN title_am ELSE title_en END,
		CASE WHEN $1='am' THEN excerpt_am ELSE excerpt_en END,%s,cover_image_url,author_name,tags,
		CASE WHEN $1='am' THEN seo_title_am ELSE seo_title_en END,
		CASE WHEN $1='am' THEN seo_description_am ELSE seo_description_en END,published_at,count(*) OVER()
		FROM blog_posts WHERE %s ORDER BY published_at DESC,id LIMIT $%d OFFSET $%d`, contentExpression, strings.Join(where, " AND "), len(args)-1, len(args))
	rows, err := s.Pool.Query(ctx, query, args...)
	if err != nil {
		return domain.Page[domain.PublicBlogPost]{}, err
	}
	defer rows.Close()
	result := domain.Page[domain.PublicBlogPost]{Items: []domain.PublicBlogPost{}, Page: filter.Page, PageSize: filter.PageSize}
	for rows.Next() {
		var item domain.PublicBlogPost
		if err := rows.Scan(&item.ID, &item.Slug, &item.Title, &item.Excerpt, &item.Content, &item.CoverImageURL, &item.AuthorName, &item.Tags, &item.SEOTitle, &item.SEODescription, &item.PublishedAt, &result.Total); err != nil {
			return domain.Page[domain.PublicBlogPost]{}, err
		}
		result.Items = append(result.Items, item)
	}
	return result, rows.Err()
}

func (s *Store) GetPublicPostBySlug(ctx context.Context, slug, locale string) (domain.PublicBlogPost, error) {
	var item domain.PublicBlogPost
	err := s.Pool.QueryRow(ctx, `SELECT id::text,slug,CASE WHEN $2='am' THEN title_am ELSE title_en END,
		CASE WHEN $2='am' THEN excerpt_am ELSE excerpt_en END,CASE WHEN $2='am' THEN content_am ELSE content_en END,
		cover_image_url,author_name,tags,CASE WHEN $2='am' THEN seo_title_am ELSE seo_title_en END,
		CASE WHEN $2='am' THEN seo_description_am ELSE seo_description_en END,published_at
		FROM blog_posts WHERE slug=$1 AND status='published' AND published_at<=now() AND deleted_at IS NULL`, slug, locale).Scan(
		&item.ID, &item.Slug, &item.Title, &item.Excerpt, &item.Content, &item.CoverImageURL, &item.AuthorName, &item.Tags, &item.SEOTitle, &item.SEODescription, &item.PublishedAt)
	return item, translateError(err)
}

func (s *Store) ListAdminPosts(ctx context.Context, filter PostFilter) (domain.Page[domain.BlogPost], error) {
	args := []any{}
	where := []string{"deleted_at IS NULL"}
	if filter.Status != "" {
		args = append(args, filter.Status)
		where = append(where, fmt.Sprintf("status=$%d", len(args)))
	}
	if filter.Query != "" {
		args = append(args, "%"+filter.Query+"%")
		where = append(where, fmt.Sprintf("(title_am ILIKE $%d OR title_en ILIKE $%d OR slug ILIKE $%d)", len(args), len(args), len(args)))
	}
	args = append(args, filter.PageSize, (filter.Page-1)*filter.PageSize)
	query := fmt.Sprintf(`SELECT %s,count(*) OVER() FROM blog_posts WHERE %s ORDER BY updated_at DESC LIMIT $%d OFFSET $%d`, postColumns, strings.Join(where, " AND "), len(args)-1, len(args))
	rows, err := s.Pool.Query(ctx, query, args...)
	if err != nil {
		return domain.Page[domain.BlogPost]{}, err
	}
	defer rows.Close()
	result := domain.Page[domain.BlogPost]{Items: []domain.BlogPost{}, Page: filter.Page, PageSize: filter.PageSize}
	for rows.Next() {
		var item domain.BlogPost
		if err := rows.Scan(&item.ID, &item.Slug, &item.Status, &item.TitleAM, &item.TitleEN, &item.ExcerptAM, &item.ExcerptEN, &item.ContentAM, &item.ContentEN, &item.CoverImageURL, &item.AuthorName, &item.Tags, &item.SEOTitleAM, &item.SEOTitleEN, &item.SEODescriptionAM, &item.SEODescriptionEN, &item.PublishedAt, &item.CreatedAt, &item.UpdatedAt, &result.Total); err != nil {
			return domain.Page[domain.BlogPost]{}, err
		}
		result.Items = append(result.Items, item)
	}
	return result, rows.Err()
}

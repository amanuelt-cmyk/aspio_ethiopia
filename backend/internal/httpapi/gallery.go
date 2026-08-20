package httpapi

import (
	"errors"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/aspio-se/aspio-backend/internal/domain"
	mediastore "github.com/aspio-se/aspio-backend/internal/media"
	"github.com/go-chi/chi/v5"
)

func galleryKind(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "image" || value == "video" {
		return value
	}
	return ""
}

func normalizeGalleryCopy(item *domain.GalleryMedia) map[string]string {
	item.Status = strings.ToLower(clean(item.Status, 20))
	item.TitleAM = clean(item.TitleAM, 180)
	item.TitleEN = clean(item.TitleEN, 180)
	item.CaptionAM = strings.TrimSpace(item.CaptionAM)
	item.CaptionEN = strings.TrimSpace(item.CaptionEN)
	mirrorLocalized(&item.TitleAM, &item.TitleEN)
	mirrorLocalized(&item.CaptionAM, &item.CaptionEN)
	fields := map[string]string{}
	if item.Status != "draft" && item.Status != "published" {
		fields["status"] = "Choose draft or published."
	}
	if len(item.CaptionAM) > 1200 || len(item.CaptionEN) > 1200 {
		fields["caption"] = "Captions are limited to 1,200 characters."
	}
	if item.SortOrder < -1000 || item.SortOrder > 10000 {
		fields["sortOrder"] = "Use an order between -1000 and 10000."
	}
	return fields
}

func (s *Server) listPublicGalleryMedia(w http.ResponseWriter, r *http.Request) {
	kind := ""
	if requested := r.URL.Query().Get("kind"); requested != "" {
		kind = galleryKind(requested)
		if kind == "" {
			writeValidation(w, map[string]string{"kind": "Choose image or video."})
			return
		}
	}
	items, err := s.Store.ListPublicGalleryMedia(r.Context(), kind, normalizeLocale(r.URL.Query().Get("locale")))
	if err != nil {
		s.Logger.Error("list public gallery", "error", err)
		writeStoreError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (s *Server) listAdminGalleryMedia(w http.ResponseWriter, r *http.Request) {
	kind := ""
	if requested := r.URL.Query().Get("kind"); requested != "" {
		kind = galleryKind(requested)
		if kind == "" {
			writeValidation(w, map[string]string{"kind": "Choose image or video."})
			return
		}
	}
	items, err := s.Store.ListGalleryMedia(r.Context(), kind)
	if err != nil {
		s.Logger.Error("list admin gallery", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (s *Server) uploadGalleryMedia(w http.ResponseWriter, r *http.Request) {
	kind := galleryKind(chi.URLParam(r, "kind"))
	if kind == "" {
		writeError(w, http.StatusNotFound, "not_found", "Choose the image or video gallery.")
		return
	}
	current, _ := adminFromContext(r.Context())
	r.Body = http.MaxBytesReader(w, r.Body, mediastore.MaxRequestBytes)
	reader, err := r.MultipartReader()
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_upload", "Choose one file to upload.")
		return
	}
	item := domain.GalleryMedia{Kind: kind, Status: "published", CreatedBy: current.ID}
	var stored *mediastore.StoredFile
	for {
		part, nextErr := reader.NextPart()
		if errors.Is(nextErr, io.EOF) {
			break
		}
		if nextErr != nil {
			if stored != nil {
				_ = s.Media.DeleteURL(stored.URL)
			}
			writeError(w, http.StatusBadRequest, "invalid_upload", "The upload could not be read.")
			return
		}
		switch part.FormName() {
		case "file":
			if stored != nil {
				_ = part.Close()
				_ = s.Media.DeleteURL(stored.URL)
				writeError(w, http.StatusBadRequest, "invalid_upload", "Upload one file at a time.")
				return
			}
			file, saveErr := s.Media.Save(part, part.FileName())
			_ = part.Close()
			if saveErr != nil {
				status := http.StatusUnprocessableEntity
				if errors.Is(saveErr, mediastore.ErrTooLarge) {
					status = http.StatusRequestEntityTooLarge
				} else if errors.Is(saveErr, mediastore.ErrUnsupported) {
					status = http.StatusUnsupportedMediaType
				}
				writeError(w, status, "invalid_media", saveErr.Error())
				return
			}
			stored = &file
		case "titleAm", "titleEn", "captionAm", "captionEn", "status", "sortOrder":
			body, _ := io.ReadAll(io.LimitReader(part, 1300))
			value := strings.TrimSpace(string(body))
			_ = part.Close()
			switch part.FormName() {
			case "titleAm":
				item.TitleAM = value
			case "titleEn":
				item.TitleEN = value
			case "captionAm":
				item.CaptionAM = value
			case "captionEn":
				item.CaptionEN = value
			case "status":
				item.Status = value
			case "sortOrder":
				item.SortOrder, _ = strconv.Atoi(value)
			}
		default:
			_ = part.Close()
		}
	}
	if stored == nil {
		writeError(w, http.StatusBadRequest, "missing_file", "Choose a file to upload.")
		return
	}
	if stored.Kind != kind {
		_ = s.Media.DeleteURL(stored.URL)
		writeError(w, http.StatusUnsupportedMediaType, "wrong_gallery", "This file belongs in the other gallery menu.")
		return
	}
	item.URL, item.MIMEType, item.OriginalName, item.SizeBytes = stored.URL, stored.MIMEType, stored.OriginalName, stored.SizeBytes
	if item.TitleAM == "" && item.TitleEN == "" {
		item.TitleEN = strings.TrimSuffix(stored.OriginalName, filepath.Ext(stored.OriginalName))
	}
	if fields := normalizeGalleryCopy(&item); len(fields) > 0 {
		_ = s.Media.DeleteURL(stored.URL)
		writeValidation(w, fields)
		return
	}
	created, err := s.Store.CreateGalleryMedia(r.Context(), item)
	if err != nil {
		_ = s.Media.DeleteURL(stored.URL)
		s.Logger.Error("create gallery media", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (s *Server) updateGalleryMedia(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Status    string `json:"status"`
		TitleAM   string `json:"titleAm"`
		TitleEN   string `json:"titleEn"`
		CaptionAM string `json:"captionAm"`
		CaptionEN string `json:"captionEn"`
		SortOrder int    `json:"sortOrder"`
	}
	if !decodeJSON(w, r, &input, 32<<10) {
		return
	}
	item := domain.GalleryMedia{Status: input.Status, TitleAM: input.TitleAM, TitleEN: input.TitleEN, CaptionAM: input.CaptionAM, CaptionEN: input.CaptionEN, SortOrder: input.SortOrder}
	if fields := normalizeGalleryCopy(&item); len(fields) > 0 {
		writeValidation(w, fields)
		return
	}
	updated, err := s.Store.UpdateGalleryMedia(r.Context(), chi.URLParam(r, "id"), item)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) deleteGalleryMedia(w http.ResponseWriter, r *http.Request) {
	item, err := s.Store.DeleteGalleryMedia(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeStoreError(w, err)
		return
	}
	if err := s.Media.DeleteURL(item.URL); err != nil {
		s.Logger.Warn("delete gallery file", "error", err, "media_id", item.ID)
	}
	w.WriteHeader(http.StatusNoContent)
}

func normalizeFeatured(item *domain.FeaturedPlace) map[string]string {
	item.SalonID = clean(item.SalonID, 60)
	item.BadgeAM = clean(item.BadgeAM, 80)
	item.BadgeEN = clean(item.BadgeEN, 80)
	item.DescriptionAM = strings.TrimSpace(item.DescriptionAM)
	item.DescriptionEN = strings.TrimSpace(item.DescriptionEN)
	mirrorLocalized(&item.BadgeAM, &item.BadgeEN)
	mirrorLocalized(&item.DescriptionAM, &item.DescriptionEN)
	fields := map[string]string{}
	if item.SalonID == "" {
		fields["salonId"] = "Choose a salon or barbershop."
	}
	if len(item.DescriptionAM) > 1200 || len(item.DescriptionEN) > 1200 {
		fields["description"] = "Descriptions are limited to 1,200 characters."
	}
	if item.SortOrder < -1000 || item.SortOrder > 10000 {
		fields["sortOrder"] = "Use an order between -1000 and 10000."
	}
	return fields
}

func (s *Server) listPublicFeaturedPlaces(w http.ResponseWriter, r *http.Request) {
	items, err := s.Store.ListPublicFeaturedPlaces(r.Context(), normalizeLocale(r.URL.Query().Get("locale")))
	if err != nil {
		s.Logger.Error("list public featured places", "error", err)
		writeStoreError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (s *Server) listAdminFeaturedPlaces(w http.ResponseWriter, r *http.Request) {
	items, err := s.Store.ListFeaturedPlaces(r.Context())
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

type featuredInput struct {
	SalonID       string `json:"salonId"`
	BadgeAM       string `json:"badgeAm"`
	BadgeEN       string `json:"badgeEn"`
	DescriptionAM string `json:"descriptionAm"`
	DescriptionEN string `json:"descriptionEn"`
	SortOrder     int    `json:"sortOrder"`
	Active        *bool  `json:"active"`
}

func (s *Server) featuredFromInput(w http.ResponseWriter, r *http.Request, input featuredInput, creating bool) (domain.FeaturedPlace, bool) {
	active := true
	if input.Active != nil {
		active = *input.Active
	} else if !creating {
		writeValidation(w, map[string]string{"active": "Choose whether this feature is active."})
		return domain.FeaturedPlace{}, false
	}
	current, _ := adminFromContext(r.Context())
	item := domain.FeaturedPlace{SalonID: input.SalonID, BadgeAM: input.BadgeAM, BadgeEN: input.BadgeEN, DescriptionAM: input.DescriptionAM, DescriptionEN: input.DescriptionEN, SortOrder: input.SortOrder, Active: active, CreatedBy: current.ID}
	if fields := normalizeFeatured(&item); len(fields) > 0 {
		writeValidation(w, fields)
		return domain.FeaturedPlace{}, false
	}
	salon, err := s.Store.GetSalon(r.Context(), item.SalonID)
	if err != nil {
		writeStoreError(w, err)
		return domain.FeaturedPlace{}, false
	}
	if salon.Category != "salon" && salon.Category != "barbershop" {
		writeValidation(w, map[string]string{"salonId": "Featured places must be a salon or barbershop."})
		return domain.FeaturedPlace{}, false
	}
	return item, true
}

func (s *Server) createFeaturedPlace(w http.ResponseWriter, r *http.Request) {
	var input featuredInput
	if !decodeJSON(w, r, &input, 32<<10) {
		return
	}
	item, ok := s.featuredFromInput(w, r, input, true)
	if !ok {
		return
	}
	created, err := s.Store.CreateFeaturedPlace(r.Context(), item)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (s *Server) updateFeaturedPlace(w http.ResponseWriter, r *http.Request) {
	var input featuredInput
	if !decodeJSON(w, r, &input, 32<<10) {
		return
	}
	item, ok := s.featuredFromInput(w, r, input, false)
	if !ok {
		return
	}
	updated, err := s.Store.UpdateFeaturedPlace(r.Context(), chi.URLParam(r, "id"), item)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) deleteFeaturedPlace(w http.ResponseWriter, r *http.Request) {
	if err := s.Store.DeleteFeaturedPlace(r.Context(), chi.URLParam(r, "id")); err != nil {
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

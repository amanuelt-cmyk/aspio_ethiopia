package httpapi

import (
	"net/http"
	"time"

	"github.com/aspio-se/aspio-backend/internal/domain"
	"github.com/aspio-se/aspio-backend/internal/store"
	"github.com/go-chi/chi/v5"
)

func (s *Server) resolveGoogleMapsLocation(w http.ResponseWriter, r *http.Request) {
	var input struct {
		URL string `json:"url"`
	}
	if !decodeJSON(w, r, &input, 8<<10) {
		return
	}
	ctx, cancel := contextWithTimeout(r, 12*time.Second)
	defer cancel()
	result, err := s.Locations.Resolve(ctx, input.URL)
	if err != nil {
		writeValidation(w, map[string]string{"googleMapsUrl": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (s *Server) resolveSalonLocation(r *http.Request, item *domain.Salon) map[string]string {
	item.GoogleMapsURL = clean(item.GoogleMapsURL, 1000)
	if item.GoogleMapsURL == "" {
		return nil
	}
	ctx, cancel := contextWithTimeout(r, 12*time.Second)
	defer cancel()
	result, err := s.Locations.Resolve(ctx, item.GoogleMapsURL)
	if err != nil {
		return map[string]string{"googleMapsUrl": err.Error()}
	}
	item.GoogleMapsURL = result.URL
	item.Latitude = result.Latitude
	item.Longitude = result.Longitude
	return nil
}

func salonFilter(r *http.Request, admin bool, max int) store.SalonFilter {
	page, pageSize := pagination(r, max)
	filter := store.SalonFilter{Page: page, PageSize: pageSize, Locale: normalizeLocale(r.URL.Query().Get("locale")), Query: queryText(r, "q", 120), Category: queryText(r, "category", 30), Area: queryText(r, "area", 120)}
	if admin {
		filter.Status = queryText(r, "status", 20)
	}
	return filter
}

func (s *Server) listPublicSalons(w http.ResponseWriter, r *http.Request) {
	result, err := s.Store.ListPublicSalons(r.Context(), salonFilter(r, false, 100))
	if err != nil {
		s.Logger.Error("list public salons", "error", err)
		writeStoreError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
	writeJSON(w, http.StatusOK, result)
}
func (s *Server) getPublicSalon(w http.ResponseWriter, r *http.Request) {
	item, err := s.Store.GetPublicSalonBySlug(r.Context(), chi.URLParam(r, "slug"), normalizeLocale(r.URL.Query().Get("locale")))
	if err != nil {
		s.Logger.Error("get public salon", "error", err)
		writeStoreError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
	writeJSON(w, http.StatusOK, item)
}

func (s *Server) listMapSalons(w http.ResponseWriter, r *http.Request) {
	filter := salonFilter(r, false, 500)
	filter.Page = 1
	filter.PageSize = 500
	result, err := s.Store.ListPublicSalons(r.Context(), filter)
	if err != nil {
		s.Logger.Error("list map salons", "error", err)
		writeStoreError(w, err)
		return
	}
	type pin struct {
		ID        string  `json:"id"`
		Slug      string  `json:"slug"`
		Name      string  `json:"name"`
		Category  string  `json:"category"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		ImageURL  string  `json:"imageUrl,omitempty"`
	}
	pins := make([]pin, 0, len(result.Items))
	for _, item := range result.Items {
		pins = append(pins, pin{item.ID, item.Slug, item.Name, item.Category, item.Latitude, item.Longitude, item.ImageURL})
	}
	w.Header().Set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
	writeJSON(w, http.StatusOK, map[string]any{"items": pins, "total": result.Total})
}

func (s *Server) listAdminSalons(w http.ResponseWriter, r *http.Request) {
	result, err := s.Store.ListAdminSalons(r.Context(), salonFilter(r, true, 100))
	if err != nil {
		s.Logger.Error("list admin salons", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
func (s *Server) getAdminSalon(w http.ResponseWriter, r *http.Request) {
	item, err := s.Store.GetSalon(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		s.Logger.Error("get admin salon", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}
func (s *Server) createSalon(w http.ResponseWriter, r *http.Request) {
	var input domain.Salon
	if !decodeJSON(w, r, &input, 1<<20) {
		return
	}
	if input.Status == "" {
		input.Status = "draft"
	}
	if fields := s.resolveSalonLocation(r, &input); len(fields) > 0 {
		writeValidation(w, fields)
		return
	}
	if fields := validateSalon(&input); len(fields) > 0 {
		writeValidation(w, fields)
		return
	}
	item, err := s.Store.CreateSalon(r.Context(), input)
	if err != nil {
		s.Logger.Error("create salon", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}
func (s *Server) updateSalon(w http.ResponseWriter, r *http.Request) {
	var input domain.Salon
	if !decodeJSON(w, r, &input, 1<<20) {
		return
	}
	if fields := s.resolveSalonLocation(r, &input); len(fields) > 0 {
		writeValidation(w, fields)
		return
	}
	if fields := validateSalon(&input); len(fields) > 0 {
		writeValidation(w, fields)
		return
	}
	item, err := s.Store.UpdateSalon(r.Context(), chi.URLParam(r, "id"), input)
	if err != nil {
		s.Logger.Error("update salon", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}
func (s *Server) deleteSalon(w http.ResponseWriter, r *http.Request) {
	if err := s.Store.DeleteSalon(r.Context(), chi.URLParam(r, "id")); err != nil {
		s.Logger.Error("delete salon", "error", err)
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

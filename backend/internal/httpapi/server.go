package httpapi

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/aspio-se/aspio-backend/internal/config"
	"github.com/aspio-se/aspio-backend/internal/location"
	"github.com/aspio-se/aspio-backend/internal/media"
	"github.com/aspio-se/aspio-backend/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Server struct {
	Config    config.Config
	Store     *store.Store
	Logger    *slog.Logger
	Locations *location.Resolver
	Media     *media.LocalStorage
}

func New(cfg config.Config, data *store.Store, logger *slog.Logger) http.Handler {
	s := &Server{Config: cfg, Store: data, Logger: logger, Locations: location.NewResolver(), Media: media.NewLocalStorage(cfg.UploadDir)}
	router := chi.NewRouter()
	router.Use(middleware.RequestID, s.securityHeaders, s.cors, s.logRequests, middleware.Recoverer)
	router.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	router.Get("/readyz", s.ready)
	router.Get("/uploads/{name}", s.serveUpload)
	router.Route("/api/v1", func(r chi.Router) {
		r.Get("/salons", s.listPublicSalons)
		r.Get("/salons/{slug}", s.getPublicSalon)
		r.Get("/map/salons", s.listMapSalons)
		r.Get("/gallery", s.listPublicGalleryMedia)
		r.Get("/featured-places", s.listPublicFeaturedPlaces)
		r.Get("/blog/posts", s.listPublicPosts)
		r.Get("/blog/posts/{slug}", s.getPublicPost)
		r.With(newLimiter(10, time.Minute).middleware(cfg.TrustProxyHeaders, logger)).Post("/leads", s.createLead)
		r.Route("/admin", func(r chi.Router) {
			r.With(newLimiter(10, time.Minute).middleware(cfg.TrustProxyHeaders, logger)).Post("/auth/login", s.login)
			r.Group(func(r chi.Router) {
				r.Use(s.authenticate)
				r.Get("/auth/me", s.me)
				r.Post("/auth/logout", s.logout)
				r.Group(func(r chi.Router) {
					r.Use(s.requireSuperAdmin)
					r.Get("/users", s.listAdminUsers)
					r.Post("/users", s.createAdminUser)
					r.Put("/users/{id}", s.updateAdminUser)
					r.Post("/users/{id}/password", s.resetAdminUserPassword)
				})
				r.Put("/profile", s.updateProfile)
				r.Post("/profile/avatar", s.uploadProfileAvatar)
				r.Post("/locations/resolve", s.resolveGoogleMapsLocation)
				r.Get("/gallery", s.listAdminGalleryMedia)
				r.Post("/gallery/{kind}", s.uploadGalleryMedia)
				r.Put("/gallery/items/{id}", s.updateGalleryMedia)
				r.Delete("/gallery/items/{id}", s.deleteGalleryMedia)
				r.Get("/featured-places", s.listAdminFeaturedPlaces)
				r.Post("/featured-places", s.createFeaturedPlace)
				r.Put("/featured-places/{id}", s.updateFeaturedPlace)
				r.Delete("/featured-places/{id}", s.deleteFeaturedPlace)
				r.Get("/salons", s.listAdminSalons)
				r.Post("/salons", s.createSalon)
				r.Get("/salons/{id}", s.getAdminSalon)
				r.Put("/salons/{id}", s.updateSalon)
				r.Delete("/salons/{id}", s.deleteSalon)
				r.Get("/salons/{id}/media", s.listSalonMedia)
				r.Post("/salons/{id}/media", s.uploadSalonMedia)
				r.Delete("/salons/{id}/media/{mediaId}", s.deleteSalonMedia)
				r.Get("/blog/posts", s.listAdminPosts)
				r.Post("/blog/posts", s.createPost)
				r.Get("/blog/posts/{id}", s.getAdminPost)
				r.Put("/blog/posts/{id}", s.updatePost)
				r.Delete("/blog/posts/{id}", s.deletePost)
				r.Get("/leads", s.listLeads)
				r.Patch("/leads/{id}/status", s.updateLeadStatus)
			})
		})
	})
	return router
}

func (s *Server) ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := contextWithTimeout(r, 2*time.Second)
	defer cancel()
	if err := s.Store.Pool.Ping(ctx); err != nil {
		writeError(w, http.StatusServiceUnavailable, "not_ready", "Database is unavailable.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func contextWithTimeout(r *http.Request, duration time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(r.Context(), duration)
}

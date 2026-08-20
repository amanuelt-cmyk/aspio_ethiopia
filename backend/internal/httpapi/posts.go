package httpapi

import (
	"net/http"

	"github.com/aspio-se/aspio-backend/internal/domain"
	"github.com/aspio-se/aspio-backend/internal/store"
	"github.com/go-chi/chi/v5"
)

func postFilter(r *http.Request, admin bool) store.PostFilter {
	page, pageSize := pagination(r, 100)
	filter := store.PostFilter{Page: page, PageSize: pageSize, Locale: normalizeLocale(r.URL.Query().Get("locale")), Query: queryText(r, "q", 120), Tag: queryText(r, "tag", 40)}
	if admin {
		filter.Status = queryText(r, "status", 20)
	}
	return filter
}
func (s *Server) listPublicPosts(w http.ResponseWriter, r *http.Request) {
	result, err := s.Store.ListPublicPosts(r.Context(), postFilter(r, false), false)
	if err != nil {
		s.Logger.Error("list public posts", "error", err)
		writeStoreError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
	writeJSON(w, http.StatusOK, result)
}
func (s *Server) getPublicPost(w http.ResponseWriter, r *http.Request) {
	item, err := s.Store.GetPublicPostBySlug(r.Context(), chi.URLParam(r, "slug"), normalizeLocale(r.URL.Query().Get("locale")))
	if err != nil {
		s.Logger.Error("get public post", "error", err)
		writeStoreError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
	writeJSON(w, http.StatusOK, item)
}
func (s *Server) listAdminPosts(w http.ResponseWriter, r *http.Request) {
	result, err := s.Store.ListAdminPosts(r.Context(), postFilter(r, true))
	if err != nil {
		s.Logger.Error("list admin posts", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
func (s *Server) getAdminPost(w http.ResponseWriter, r *http.Request) {
	item, err := s.Store.GetPost(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		s.Logger.Error("get admin post", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}
func (s *Server) createPost(w http.ResponseWriter, r *http.Request) {
	var input domain.BlogPost
	if !decodeJSON(w, r, &input, 512<<10) {
		return
	}
	if input.Status == "" {
		input.Status = "draft"
	}
	if fields := validatePost(&input); len(fields) > 0 {
		writeValidation(w, fields)
		return
	}
	item, err := s.Store.CreatePost(r.Context(), input)
	if err != nil {
		s.Logger.Error("create post", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}
func (s *Server) updatePost(w http.ResponseWriter, r *http.Request) {
	var input domain.BlogPost
	if !decodeJSON(w, r, &input, 512<<10) {
		return
	}
	if fields := validatePost(&input); len(fields) > 0 {
		writeValidation(w, fields)
		return
	}
	item, err := s.Store.UpdatePost(r.Context(), chi.URLParam(r, "id"), input)
	if err != nil {
		s.Logger.Error("update post", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}
func (s *Server) deletePost(w http.ResponseWriter, r *http.Request) {
	if err := s.Store.DeletePost(r.Context(), chi.URLParam(r, "id")); err != nil {
		s.Logger.Error("delete post", "error", err)
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

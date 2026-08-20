package httpapi

import (
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/aspio-se/aspio-backend/internal/domain"
	mediastore "github.com/aspio-se/aspio-backend/internal/media"
	"github.com/go-chi/chi/v5"
)

func (s *Server) serveUpload(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	if name == "" || filepath.Base(name) != name {
		writeError(w, http.StatusNotFound, "not_found", "Media was not found.")
		return
	}
	target := filepath.Join(s.Media.Dir, name)
	info, err := os.Stat(target)
	if err != nil || !info.Mode().IsRegular() {
		writeError(w, http.StatusNotFound, "not_found", "Media was not found.")
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	http.ServeFile(w, r, target)
}

func (s *Server) listSalonMedia(w http.ResponseWriter, r *http.Request) {
	items, err := s.Store.ListSalonMedia(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		s.Logger.Error("list salon media", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (s *Server) uploadSalonMedia(w http.ResponseWriter, r *http.Request) {
	salonID := chi.URLParam(r, "id")
	if _, err := s.Store.GetSalon(r.Context(), salonID); err != nil {
		writeStoreError(w, err)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, mediastore.MaxRequestBytes)
	reader, err := r.MultipartReader()
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_upload", "Choose one image or video file.")
		return
	}

	var stored *mediastore.StoredFile
	altText := ""
	sortOrder := 0
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
		case "altText":
			body, _ := io.ReadAll(io.LimitReader(part, 300))
			altText = clean(string(body), 180)
			_ = part.Close()
		case "sortOrder":
			body, _ := io.ReadAll(io.LimitReader(part, 20))
			sortOrder, _ = strconv.Atoi(strings.TrimSpace(string(body)))
			_ = part.Close()
		default:
			_ = part.Close()
		}
	}
	if stored == nil {
		writeError(w, http.StatusBadRequest, "missing_file", "Choose an image or video to upload.")
		return
	}
	item, err := s.Store.CreateSalonMedia(r.Context(), domain.SalonMedia{SalonID: salonID, Kind: stored.Kind, URL: stored.URL, MIMEType: stored.MIMEType, OriginalName: stored.OriginalName, AltText: altText, SizeBytes: stored.SizeBytes, SortOrder: sortOrder})
	if err != nil {
		_ = s.Media.DeleteURL(stored.URL)
		s.Logger.Error("create salon media", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) deleteSalonMedia(w http.ResponseWriter, r *http.Request) {
	item, err := s.Store.DeleteSalonMedia(r.Context(), chi.URLParam(r, "id"), chi.URLParam(r, "mediaId"))
	if err != nil {
		writeStoreError(w, err)
		return
	}
	if err := s.Media.DeleteURL(item.URL); err != nil {
		s.Logger.Warn("delete salon media file", "error", err, "media_id", item.ID)
	}
	w.WriteHeader(http.StatusNoContent)
}

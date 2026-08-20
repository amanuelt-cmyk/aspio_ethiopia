package httpapi

import (
	"errors"
	"io"
	"net/http"
	"strings"

	mediastore "github.com/aspio-se/aspio-backend/internal/media"
)

func (s *Server) updateProfile(w http.ResponseWriter, r *http.Request) {
	current, ok := adminFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Sign in is required.")
		return
	}
	var input struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		JobTitle string `json:"jobTitle"`
	}
	if !decodeJSON(w, r, &input, 16<<10) {
		return
	}
	input.Name = clean(input.Name, 120)
	input.Email = clean(input.Email, 180)
	input.Phone = clean(input.Phone, 40)
	input.JobTitle = clean(input.JobTitle, 120)
	fields := map[string]string{}
	if input.Name == "" {
		fields["name"] = "Enter your name."
	}
	if input.Email == "" || !validEmail(input.Email) {
		fields["email"] = "Enter a valid email address."
	}
	if len(fields) > 0 {
		writeValidation(w, fields)
		return
	}
	updated, err := s.Store.UpdateAdminProfile(r.Context(), current.ID, input.Email, input.Name, input.Phone, input.JobTitle)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) uploadProfileAvatar(w http.ResponseWriter, r *http.Request) {
	current, ok := adminFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Sign in is required.")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 16<<20)
	reader, err := r.MultipartReader()
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_upload", "Choose a profile image.")
		return
	}
	var stored *mediastore.StoredFile
	for {
		part, nextErr := reader.NextPart()
		if errors.Is(nextErr, io.EOF) {
			break
		}
		if nextErr != nil {
			writeError(w, http.StatusBadRequest, "invalid_upload", "The profile image could not be read.")
			return
		}
		if part.FormName() != "file" || stored != nil {
			_ = part.Close()
			continue
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
			writeError(w, status, "invalid_avatar", saveErr.Error())
			return
		}
		stored = &file
	}
	if stored == nil {
		writeError(w, http.StatusBadRequest, "missing_file", "Choose a profile image.")
		return
	}
	if stored.Kind != "image" {
		_ = s.Media.DeleteURL(stored.URL)
		writeError(w, http.StatusUnsupportedMediaType, "invalid_avatar", "Profile pictures must be JPEG, PNG, WebP, or GIF images.")
		return
	}
	updated, err := s.Store.UpdateAdminAvatar(r.Context(), current.ID, stored.URL)
	if err != nil {
		_ = s.Media.DeleteURL(stored.URL)
		writeStoreError(w, err)
		return
	}
	if strings.HasPrefix(current.AvatarURL, "/uploads/") && current.AvatarURL != stored.URL {
		if err := s.Media.DeleteURL(current.AvatarURL); err != nil {
			s.Logger.Warn("delete replaced admin avatar", "error", err, "admin_id", current.ID)
		}
	}
	writeJSON(w, http.StatusOK, updated)
}

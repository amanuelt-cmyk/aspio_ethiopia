package httpapi

import (
	"net/http"
	"strings"
	"time"

	"github.com/aspio-se/aspio-backend/internal/security"
)

var invalidLoginHash = func() string {
	hash, _ := security.HashPassword("invalid-login-timing-placeholder")
	return hash
}()

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decodeJSON(w, r, &input, 16<<10) {
		return
	}
	input.Email = strings.ToLower(clean(input.Email, 180))
	if !validEmail(input.Email) || input.Email == "" || len(input.Password) < 12 {
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Email or password is incorrect.")
		return
	}
	user, err := s.Store.GetAdminByEmail(r.Context(), input.Email)
	hash := invalidLoginHash
	if err == nil {
		hash = user.PasswordHash
	}
	passwordMatches := security.VerifyPassword(hash, input.Password)
	if err != nil || !user.Active || !passwordMatches {
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Email or password is incorrect.")
		return
	}
	if err := s.Store.DeleteExpiredSessions(r.Context()); err != nil {
		s.Logger.Warn("delete expired admin sessions", "error", err)
	}
	token, tokenHash, err := security.NewSessionToken()
	if err != nil {
		s.Logger.Error("generate admin session", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create a session.")
		return
	}
	expiresAt := time.Now().Add(s.Config.SessionTTL)
	if err := s.Store.CreateSession(r.Context(), user.ID, tokenHash, expiresAt); err != nil {
		s.Logger.Error("store admin session", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "Could not create a session.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"token": token, "expiresAt": expiresAt, "user": user})
}
func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	if token := bearerToken(r); token != "" {
		if err := s.Store.DeleteSession(r.Context(), security.HashSessionToken(token)); err != nil {
			s.Logger.Error("delete admin session", "error", err)
		}
	}
	w.WriteHeader(http.StatusNoContent)
}
func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	user, _ := adminFromContext(r.Context())
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/aspio-se/aspio-backend/internal/domain"
	"github.com/aspio-se/aspio-backend/internal/security"
	"github.com/aspio-se/aspio-backend/internal/store"
	"github.com/go-chi/chi/v5"
)

type adminAccountInput struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	JobTitle string `json:"jobTitle"`
	Role     string `json:"role"`
	Active   *bool  `json:"active"`
}

type createAdminAccountInput struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	JobTitle string `json:"jobTitle"`
	Role     string `json:"role"`
	Password string `json:"password"`
}

func normalizeAdminAccount(input *adminAccountInput) map[string]string {
	input.Email = strings.ToLower(clean(input.Email, 180))
	input.Name = clean(input.Name, 120)
	input.Phone = clean(input.Phone, 40)
	input.JobTitle = clean(input.JobTitle, 120)
	input.Role = strings.ToLower(clean(input.Role, 30))
	fields := map[string]string{}
	if input.Name == "" {
		fields["name"] = "Enter the administrator's full name."
	}
	if input.Email == "" || !validEmail(input.Email) {
		fields["email"] = "Enter a valid email address."
	}
	if input.Phone != "" && !phonePattern.MatchString(input.Phone) {
		fields["phone"] = "Enter a valid phone number."
	}
	if !domain.ValidAdminRole(input.Role) {
		fields["role"] = "Choose admin or super admin."
	}
	if input.Active == nil {
		fields["active"] = "Choose whether the account is active."
	}
	return fields
}

func validateAdminPassword(password string) map[string]string {
	fields := map[string]string{}
	if len(password) < 12 {
		fields["password"] = "Use at least 12 characters."
	}
	if len(password) > 256 {
		fields["password"] = "Use no more than 256 characters."
	}
	return fields
}

func (s *Server) listAdminUsers(w http.ResponseWriter, r *http.Request) {
	items, err := s.Store.ListAdmins(r.Context())
	if err != nil {
		s.Logger.Error("list admin users", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (s *Server) createAdminUser(w http.ResponseWriter, r *http.Request) {
	var input createAdminAccountInput
	if !decodeJSON(w, r, &input, 32<<10) {
		return
	}
	active := true
	account := adminAccountInput{
		Email: input.Email, Name: input.Name, Phone: input.Phone,
		JobTitle: input.JobTitle, Role: input.Role, Active: &active,
	}
	fields := normalizeAdminAccount(&account)
	for key, value := range validateAdminPassword(input.Password) {
		fields[key] = value
	}
	if len(fields) > 0 {
		writeValidation(w, fields)
		return
	}
	hash, err := security.HashPassword(input.Password)
	if err != nil {
		s.Logger.Error("hash new admin password", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "The account could not be created.")
		return
	}
	created, err := s.Store.CreateAdmin(r.Context(), account.Email, account.Name, account.Phone, account.JobTitle, hash, account.Role)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (s *Server) updateAdminUser(w http.ResponseWriter, r *http.Request) {
	current, ok := adminFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Sign in is required.")
		return
	}
	var input adminAccountInput
	if !decodeJSON(w, r, &input, 32<<10) {
		return
	}
	if fields := normalizeAdminAccount(&input); len(fields) > 0 {
		writeValidation(w, fields)
		return
	}
	updated, err := s.Store.UpdateAdminAccount(r.Context(), current.ID, chi.URLParam(r, "id"), input.Email, input.Name, input.Phone, input.JobTitle, input.Role, *input.Active)
	if errors.Is(err, store.ErrCannotModifyOwnAccess) {
		writeError(w, http.StatusConflict, "own_access_protected", "You cannot demote or deactivate the account you are currently using.")
		return
	}
	if errors.Is(err, store.ErrLastSuperAdmin) {
		writeError(w, http.StatusConflict, "last_super_admin", "At least one active super admin must remain.")
		return
	}
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) resetAdminUserPassword(w http.ResponseWriter, r *http.Request) {
	current, ok := adminFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Sign in is required.")
		return
	}
	id := chi.URLParam(r, "id")
	if id == current.ID {
		writeError(w, http.StatusConflict, "own_password_protected", "Use your profile security settings to change your own password.")
		return
	}
	var input struct {
		Password string `json:"password"`
	}
	if !decodeJSON(w, r, &input, 16<<10) {
		return
	}
	if fields := validateAdminPassword(input.Password); len(fields) > 0 {
		writeValidation(w, fields)
		return
	}
	hash, err := security.HashPassword(input.Password)
	if err != nil {
		s.Logger.Error("hash reset admin password", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "The password could not be reset.")
		return
	}
	if err = s.Store.ResetAdminPassword(r.Context(), id, hash); err != nil {
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

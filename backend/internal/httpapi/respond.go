package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/aspio-se/aspio-backend/internal/store"
	"github.com/jackc/pgx/v5/pgconn"
)

type apiError struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if w.Header().Get("Cache-Control") == "" {
		w.Header().Set("Cache-Control", "no-store")
	}
	w.WriteHeader(status)
	if value != nil {
		_ = json.NewEncoder(w).Encode(value)
	}
}
func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]any{"error": apiError{Code: code, Message: message}})
}
func writeValidation(w http.ResponseWriter, fields map[string]string) {
	writeJSON(w, http.StatusUnprocessableEntity, map[string]any{"error": apiError{Code: "validation_error", Message: "Check the highlighted fields.", Fields: fields}})
}

func writeStoreError(w http.ResponseWriter, err error) {
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "The requested record was not found.")
		return
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		writeError(w, http.StatusConflict, "conflict", "A record with this unique value already exists.")
		return
	}
	writeError(w, http.StatusInternalServerError, "internal_error", "The server could not complete the request.")
}

func decodeJSON(w http.ResponseWriter, r *http.Request, target any, maxBytes int64) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		if strings.HasPrefix(err.Error(), "json: unknown field ") {
			writeError(w, http.StatusBadRequest, "unsupported_field", "This API build does not recognize one of the submitted fields. Rebuild and restart the Go backend.")
			return false
		}
		writeError(w, http.StatusBadRequest, "invalid_json", "Send one valid JSON object using documented fields.")
		return false
	}
	var extra any
	if decoder.Decode(&extra) == nil {
		writeError(w, http.StatusBadRequest, "invalid_json", "Only one JSON object is allowed.")
		return false
	}
	return true
}

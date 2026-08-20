package httpapi

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net"
	"net/http"
	"strings"

	"github.com/aspio-se/aspio-backend/internal/domain"
	"github.com/aspio-se/aspio-backend/internal/store"
	"github.com/go-chi/chi/v5"
)

type leadInput struct {
	Kind         string `json:"kind"`
	Source       string `json:"source"`
	Locale       string `json:"locale"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	BusinessName string `json:"businessName"`
	Message      string `json:"message"`
	Website      string `json:"website"`
}

func validateLead(input *leadInput) map[string]string {
	input.Kind = strings.ToLower(clean(input.Kind, 20))
	input.Source = strings.ToLower(clean(input.Source, 64))
	input.Locale = clean(input.Locale, 20)
	if input.Locale == "" {
		input.Locale = "am-ET"
	}
	input.Name = clean(input.Name, 100)
	input.Email = strings.ToLower(clean(input.Email, 180))
	input.Phone = clean(input.Phone, 40)
	input.BusinessName = clean(input.BusinessName, 140)
	input.Message = strings.TrimSpace(input.Message)
	fields := map[string]string{}
	if input.Kind != "demo" && input.Kind != "contact" {
		fields["kind"] = "Use demo or contact."
	}
	if !sourcePattern.MatchString(input.Source) {
		fields["source"] = "Enter a valid source identifier."
	}
	if input.Name == "" {
		fields["name"] = "Name is required."
	}
	if !validEmail(input.Email) || input.Email == "" {
		fields["email"] = "Enter a valid email address."
	}
	if !phonePattern.MatchString(input.Phone) {
		fields["phone"] = "Enter a valid phone number."
	}
	if input.Kind == "contact" && input.Message == "" {
		fields["message"] = "Message is required."
	}
	if len(input.Message) > 2500 {
		fields["message"] = "Maximum length is 2,500 characters."
	}
	return fields
}
func (s *Server) createLead(w http.ResponseWriter, r *http.Request) {
	var input leadInput
	if !decodeJSON(w, r, &input, 32<<10) {
		return
	}
	if clean(input.Website, 200) != "" {
		writeJSON(w, http.StatusAccepted, map[string]any{"ok": true})
		return
	}
	if fields := validateLead(&input); len(fields) > 0 {
		writeValidation(w, fields)
		return
	}
	host, _, _ := net.SplitHostPort(r.RemoteAddr)
	if host == "" {
		host = r.RemoteAddr
	}
	lead := domain.Lead{Kind: input.Kind, Source: input.Source, Locale: input.Locale, Name: input.Name, Email: input.Email, Phone: input.Phone, BusinessName: input.BusinessName, Message: input.Message}
	item, err := s.Store.CreateLead(r.Context(), lead, hashIP(host, s.Config.IPHashSecret), clean(r.UserAgent(), 500), s.Config.CRMWebhookURL != "")
	if err != nil {
		s.Logger.Error("create lead", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]any{"ok": true, "submissionId": item.ID, "status": "queued"})
}

func hashIP(address, secret string) string {
	digest := hmac.New(sha256.New, []byte(secret))
	_, _ = digest.Write([]byte(address))
	return hex.EncodeToString(digest.Sum(nil))
}
func (s *Server) listLeads(w http.ResponseWriter, r *http.Request) {
	page, pageSize := pagination(r, 100)
	result, err := s.Store.ListLeads(r.Context(), store.LeadFilter{Page: page, PageSize: pageSize, Status: queryText(r, "status", 20), Query: queryText(r, "q", 120)})
	if err != nil {
		s.Logger.Error("list leads", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
func (s *Server) updateLeadStatus(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Status string `json:"status"`
	}
	if !decodeJSON(w, r, &input, 4<<10) {
		return
	}
	input.Status = strings.ToLower(clean(input.Status, 20))
	allowed := map[string]bool{"new": true, "contacted": true, "qualified": true, "converted": true, "closed": true, "spam": true}
	if !allowed[input.Status] {
		writeValidation(w, map[string]string{"status": "Choose a supported lead status."})
		return
	}
	item, err := s.Store.UpdateLeadStatus(r.Context(), chi.URLParam(r, "id"), input.Status)
	if err != nil {
		s.Logger.Error("update lead status", "error", err)
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

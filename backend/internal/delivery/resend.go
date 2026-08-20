package delivery

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"net/http"
	"strings"
	"time"

	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/domain"
)

var ErrNotConfigured = errors.New("delivery provider is not configured")

type Resend struct {
	APIKey    string
	From      string
	Recipient string
	Client    *http.Client
}

func NewResend(apiKey, from, recipient string) *Resend {
	return &Resend{APIKey: apiKey, From: from, Recipient: recipient, Client: &http.Client{Timeout: 12 * time.Second}}
}

func (r *Resend) SendLead(ctx context.Context, lead domain.Lead) (string, error) {
	if !strings.HasPrefix(r.APIKey, "re_") || r.From == "" || r.Recipient == "" {
		return "", ErrNotConfigured
	}
	typeLabel := "Contact request"
	if lead.Kind == "demo" {
		typeLabel = "Demo registration"
	}
	subject := typeLabel + ": " + lead.Name
	if lead.BusinessName != "" {
		subject += " — " + lead.BusinessName
	}
	plain := strings.Join([]string{
		typeLabel, "Submission ID: " + lead.ID, "Name: " + lead.Name, "Email: " + lead.Email, "Phone: " + lead.Phone,
		"Business: " + lead.BusinessName, "Message: " + lead.Message, "Source: " + lead.Source, "Locale: " + lead.Locale,
		"Submitted: " + lead.CreatedAt.UTC().Format(time.RFC3339),
	}, "\n")
	row := func(label, value string) string {
		if value == "" {
			return ""
		}
		return `<tr><td style="padding:8px 12px;color:#746b79;vertical-align:top">` + html.EscapeString(label) + `</td><td style="padding:8px 12px;color:#271d2d;font-weight:700;white-space:pre-wrap">` + html.EscapeString(value) + `</td></tr>`
	}
	body, err := json.Marshal(map[string]any{
		"from": r.From, "to": []string{r.Recipient}, "reply_to": lead.Email, "subject": subject, "text": plain,
		"html": `<div style="background:#fbf9ff;padding:32px;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;background:#fff;border:1px solid #eadcf5;border-radius:18px;overflow:hidden"><div style="padding:24px 28px;background:#7900e8;color:#fff"><div style="font-size:12px;letter-spacing:.12em">ASPIO LEAD</div><h1>` + html.EscapeString(typeLabel) + `</h1></div><table style="width:100%;border-collapse:collapse">` + row("Name", lead.Name) + row("Email", lead.Email) + row("Phone", lead.Phone) + row("Business", lead.BusinessName) + row("Message", lead.Message) + row("Source", lead.Source) + row("Locale", lead.Locale) + row("Submission ID", lead.ID) + `</table></div></div>`,
		"tags": []map[string]string{{"name": "lead_kind", "value": lead.Kind}, {"name": "lead_source", "value": lead.Source}},
	})
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+r.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Idempotency-Key", "lead-"+lead.ID)
	req.Header.Set("User-Agent", "Aspio-Backend/1.0")
	response, err := r.Client.Do(req)
	if err != nil {
		return "", fmt.Errorf("resend request: %w", err)
	}
	defer response.Body.Close()
	var result struct {
		ID      string `json:"id"`
		Message string `json:"message"`
	}
	if err := json.NewDecoder(response.Body).Decode(&result); err != nil && response.StatusCode >= 300 {
		return "", fmt.Errorf("resend returned HTTP %d", response.StatusCode)
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 || result.ID == "" {
		return "", fmt.Errorf("resend returned HTTP %d: %s", response.StatusCode, result.Message)
	}
	return result.ID, nil
}

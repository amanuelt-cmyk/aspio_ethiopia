package delivery

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/aspio-se/aspio-backend/internal/domain"
)

type CRMWebhook struct {
	URL, Token string
	Client     *http.Client
}

func NewCRMWebhook(url, token string) *CRMWebhook {
	return &CRMWebhook{URL: url, Token: token, Client: &http.Client{Timeout: 12 * time.Second}}
}
func (c *CRMWebhook) SendLead(ctx context.Context, lead domain.Lead) (string, error) {
	if c.URL == "" {
		return "", ErrNotConfigured
	}
	body, err := json.Marshal(map[string]any{"schemaVersion": "1.0", "event": "lead.created", "lead": lead})
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.URL, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Aspio-Backend/1.0")
	if c.Token != "" {
		req.Header.Set("Authorization", "Bearer "+c.Token)
	}
	response, err := c.Client.Do(req)
	if err != nil {
		return "", fmt.Errorf("CRM request: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return "", fmt.Errorf("CRM returned HTTP %d", response.StatusCode)
	}
	return response.Header.Get("X-Request-ID"), nil
}

package config

import (
	"strings"
	"testing"
)

func validEnvironment(t *testing.T) {
	t.Helper()
	t.Setenv("APP_ENV", "test")
	t.Setenv("DATABASE_URL", "postgres://aspio:aspio@localhost:55432/aspio?sslmode=disable")
	t.Setenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
	t.Setenv("UPLOAD_DIR", "./testdata/uploads")
	t.Setenv("LEAD_RECIPIENT_EMAIL", "leads@example.com")
	t.Setenv("LEAD_FROM_EMAIL", "Aspio Leads <leads@example.com>")
	t.Setenv("IP_HASH_SECRET", "test-only-secret-with-at-least-32-characters")
}

func TestLoadAcceptsValidDevelopmentConfiguration(t *testing.T) {
	validEnvironment(t)
	configuration, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if configuration.Environment != "test" || len(configuration.AllowedOrigins) != 1 {
		t.Fatalf("unexpected configuration: %#v", configuration)
	}
}

func TestLoadUsesPlatformPortWhenHTTPAddressIsUnset(t *testing.T) {
	validEnvironment(t)
	t.Setenv("HTTP_ADDR", "")
	t.Setenv("PORT", "3210")
	configuration, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if configuration.HTTPAddr != ":3210" {
		t.Fatalf("HTTPAddr = %q, want :3210", configuration.HTTPAddr)
	}
}

func TestLoadPrefersExplicitHTTPAddress(t *testing.T) {
	validEnvironment(t)
	t.Setenv("HTTP_ADDR", ":9090")
	t.Setenv("PORT", "3210")
	configuration, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if configuration.HTTPAddr != ":9090" {
		t.Fatalf("HTTPAddr = %q, want :9090", configuration.HTTPAddr)
	}
}

func TestLoadRejectsUnknownEnvironment(t *testing.T) {
	validEnvironment(t)
	t.Setenv("APP_ENV", "prodution")
	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "APP_ENV") {
		t.Fatalf("Load() error = %v, want APP_ENV validation", err)
	}
}

func TestLoadRequiresHTTPSOriginsInProduction(t *testing.T) {
	validEnvironment(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "postgres://aspio:aspio@database.example.com/aspio?sslmode=require")
	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "HTTPS") {
		t.Fatalf("Load() error = %v, want HTTPS validation", err)
	}
}

func TestLoadRequiresDatabaseTLSInProduction(t *testing.T) {
	validEnvironment(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://ethiopia.example.com")
	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "require TLS") {
		t.Fatalf("Load() error = %v, want database TLS validation", err)
	}
}

func TestLoadRejectsOriginWithPath(t *testing.T) {
	validEnvironment(t)
	t.Setenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000/ethiopia")
	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "origins cannot include") {
		t.Fatalf("Load() error = %v, want origin validation", err)
	}
}

func TestLoadRejectsBroadUploadDirectory(t *testing.T) {
	validEnvironment(t)
	t.Setenv("UPLOAD_DIR", ".")
	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "dedicated directory") {
		t.Fatalf("Load() error = %v, want upload directory validation", err)
	}
}

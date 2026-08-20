package httpapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aspio-se/aspio-backend/internal/domain"
)

func TestNormalizeAdminAccount(t *testing.T) {
	active := true
	input := adminAccountInput{
		Email:  "  ADMIN@Example.COM ",
		Name:   "  Ada   Example ",
		Phone:  "+251 911 234 567",
		Role:   domain.AdminRoleAdmin,
		Active: &active,
	}
	if fields := normalizeAdminAccount(&input); len(fields) != 0 {
		t.Fatalf("expected valid account, got fields: %v", fields)
	}
	if input.Email != "admin@example.com" || input.Name != "Ada Example" {
		t.Fatalf("account was not normalized: %#v", input)
	}
}

func TestNormalizeAdminAccountRejectsInvalidRole(t *testing.T) {
	active := true
	input := adminAccountInput{Email: "admin@example.com", Name: "Ada", Role: "owner", Active: &active}
	if fields := normalizeAdminAccount(&input); fields["role"] == "" {
		t.Fatal("expected a role validation error")
	}
}

func TestValidateAdminPassword(t *testing.T) {
	if fields := validateAdminPassword("short"); fields["password"] == "" {
		t.Fatal("expected short password to be rejected")
	}
	if fields := validateAdminPassword("a-long-temporary-password"); len(fields) != 0 {
		t.Fatalf("expected password to be accepted, got: %v", fields)
	}
}

func TestRequireSuperAdmin(t *testing.T) {
	server := &Server{}
	nextCalled := false
	handler := server.requireSuperAdmin(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusNoContent)
	}))

	request := httptest.NewRequest(http.MethodGet, "/api/v1/admin/users", nil)
	request = request.WithContext(context.WithValue(request.Context(), adminContextKey, domain.AdminUser{Role: domain.AdminRoleAdmin}))
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusForbidden || nextCalled {
		t.Fatalf("normal admin must be denied: status=%d next=%v", response.Code, nextCalled)
	}

	nextCalled = false
	request = httptest.NewRequest(http.MethodGet, "/api/v1/admin/users", nil)
	request = request.WithContext(context.WithValue(request.Context(), adminContextKey, domain.AdminUser{Role: domain.AdminRoleSuperAdmin}))
	response = httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusNoContent || !nextCalled {
		t.Fatalf("super admin must be allowed: status=%d next=%v", response.Code, nextCalled)
	}
}

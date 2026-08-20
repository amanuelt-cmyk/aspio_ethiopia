package httpapi

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/aspio-se/aspio-backend/internal/domain"
	"github.com/aspio-se/aspio-backend/internal/security"
	"github.com/go-chi/chi/v5/middleware"
)

type contextKey string

const adminContextKey contextKey = "admin"

func adminFromContext(ctx context.Context) (domain.AdminUser, bool) {
	user, ok := ctx.Value(adminContextKey).(domain.AdminUser)
	return user, ok
}

func (s *Server) securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		w.Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'")
		w.Header().Set("X-Permitted-Cross-Domain-Policies", "none")
		if s.Config.Environment == "production" {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) cors(next http.Handler) http.Handler {
	allowed := map[string]bool{}
	for _, origin := range s.Config.AllowedOrigins {
		allowed[origin] = true
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := strings.TrimRight(r.Header.Get("Origin"), "/")
		if origin != "" && allowed[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
			w.Header().Set("Access-Control-Max-Age", "600")
		}
		if r.Method == http.MethodOptions {
			if origin == "" || !allowed[origin] {
				writeError(w, http.StatusForbidden, "origin_not_allowed", "This origin is not allowed.")
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		wrapper := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(wrapper, r)
		s.Logger.Info("http request", "request_id", middleware.GetReqID(r.Context()), "method", r.Method, "path", r.URL.Path, "status", wrapper.Status(), "bytes", wrapper.BytesWritten(), "duration_ms", time.Since(started).Milliseconds())
	})
}

func (s *Server) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		parts := strings.Fields(header)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			writeError(w, http.StatusUnauthorized, "unauthorized", "A valid admin session is required.")
			return
		}
		user, err := s.Store.GetAdminBySession(r.Context(), security.HashSessionToken(parts[1]))
		if err != nil {
			writeError(w, http.StatusUnauthorized, "unauthorized", "The admin session is invalid or expired.")
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), adminContextKey, user)))
	})
}

func (s *Server) requireSuperAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := adminFromContext(r.Context())
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized", "A valid admin session is required.")
			return
		}
		if user.Role != domain.AdminRoleSuperAdmin {
			writeError(w, http.StatusForbidden, "super_admin_required", "Super-admin access is required.")
			return
		}
		next.ServeHTTP(w, r)
	})
}

type rateEntry struct {
	Count int
	Reset time.Time
}
type limiter struct {
	mu          sync.Mutex
	entries     map[string]rateEntry
	limit       int
	maxEntries  int
	window      time.Duration
	nextCleanup time.Time
}

func newLimiter(limit int, window time.Duration) *limiter {
	return &limiter{entries: map[string]rateEntry{}, limit: limit, maxEntries: 10000, window: window}
}
func (l *limiter) middleware(trustProxy bool, logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			host, _, _ := net.SplitHostPort(r.RemoteAddr)
			if host == "" {
				host = r.RemoteAddr
			}
			if trustProxy {
				if forwarded := strings.TrimSpace(r.Header.Get("CF-Connecting-IP")); net.ParseIP(forwarded) != nil {
					host = forwarded
				}
			}
			now := time.Now()
			l.mu.Lock()
			if l.nextCleanup.IsZero() || now.After(l.nextCleanup) {
				for key, value := range l.entries {
					if now.After(value.Reset) {
						delete(l.entries, key)
					}
				}
				l.nextCleanup = now.Add(l.window)
			}
			entry, exists := l.entries[host]
			if !exists && len(l.entries) >= l.maxEntries {
				l.mu.Unlock()
				logger.Warn("rate limit capacity reached")
				w.Header().Set("Retry-After", "60")
				writeError(w, http.StatusTooManyRequests, "rate_limited", "Too many requests. Please wait and try again.")
				return
			}
			if now.After(entry.Reset) {
				entry = rateEntry{Reset: now.Add(l.window)}
			}
			entry.Count++
			l.entries[host] = entry
			allowed := entry.Count <= l.limit
			l.mu.Unlock()
			if !allowed {
				logger.Warn("rate limit exceeded", "ip", host)
				w.Header().Set("Retry-After", "60")
				writeError(w, http.StatusTooManyRequests, "rate_limited", "Too many requests. Please wait and try again.")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

package httpapi

import (
	"net/http"
	"strconv"
	"strings"
)

func pagination(r *http.Request, maxPageSize int) (int, int) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("pageSize"))
	if pageSize < 1 {
		pageSize = 24
	}
	if pageSize > maxPageSize {
		pageSize = maxPageSize
	}
	return page, pageSize
}
func queryText(r *http.Request, key string, max int) string {
	return clean(r.URL.Query().Get(key), max)
}
func bearerToken(r *http.Request) string {
	parts := strings.Fields(r.Header.Get("Authorization"))
	if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
		return parts[1]
	}
	return ""
}

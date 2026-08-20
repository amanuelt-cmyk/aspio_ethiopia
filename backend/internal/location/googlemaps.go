package location

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var (
	errUnsupportedLink = errors.New("paste a valid Google Maps location link")
	coordinatePatterns = []*regexp.Regexp{
		regexp.MustCompile(`@(-?[0-9]{1,2}(?:\.[0-9]+)?),(-?[0-9]{1,3}(?:\.[0-9]+)?)`),
		regexp.MustCompile(`!3d(-?[0-9]{1,2}(?:\.[0-9]+)?)!4d(-?[0-9]{1,3}(?:\.[0-9]+)?)`),
		regexp.MustCompile(`(?:q|query|ll|center)=(-?[0-9]{1,2}(?:\.[0-9]+)?)(?:%2C|,)(-?[0-9]{1,3}(?:\.[0-9]+)?)`),
	}
)

type Result struct {
	URL       string  `json:"url"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type Resolver struct{ client *http.Client }

func NewResolver() *Resolver {
	return &Resolver{client: &http.Client{Timeout: 10 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}}
}

func (r *Resolver) Resolve(ctx context.Context, raw string) (Result, error) {
	current, err := normalizeGoogleURL(raw)
	if err != nil {
		return Result{}, err
	}
	if latitude, longitude, ok := extractCoordinates(current.String()); ok {
		return checkedResult(current.String(), latitude, longitude)
	}

	for redirect := 0; redirect < 6; redirect++ {
		request, err := http.NewRequestWithContext(ctx, http.MethodGet, current.String(), nil)
		if err != nil {
			return Result{}, errUnsupportedLink
		}
		request.Header.Set("User-Agent", "Aspio-Location-Resolver/1.0")
		request.Header.Set("Accept", "text/html,application/xhtml+xml")
		request.Header.Set("Range", "bytes=0-524287")
		response, err := r.client.Do(request)
		if err != nil {
			return Result{}, fmt.Errorf("could not open that Google Maps link")
		}

		locationHeader := response.Header.Get("Location")
		if response.StatusCode >= 300 && response.StatusCode < 400 && locationHeader != "" {
			_ = response.Body.Close()
			next, err := current.Parse(locationHeader)
			if err != nil || !isAllowedGoogleHost(next) {
				return Result{}, errUnsupportedLink
			}
			current = next
			if latitude, longitude, ok := extractCoordinates(current.String()); ok {
				return checkedResult(current.String(), latitude, longitude)
			}
			continue
		}

		body, readErr := io.ReadAll(io.LimitReader(response.Body, 512<<10))
		_ = response.Body.Close()
		if readErr != nil {
			return Result{}, fmt.Errorf("could not read that Google Maps link")
		}
		if latitude, longitude, ok := extractCoordinates(current.String() + " " + string(body)); ok {
			return checkedResult(current.String(), latitude, longitude)
		}
		break
	}
	return Result{}, errors.New("the Google Maps link does not contain a precise location; open the place in Google Maps and use Share > Copy link")
}

func normalizeGoogleURL(raw string) (*url.URL, error) {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || parsed.Scheme != "https" || parsed.User != nil || !isAllowedGoogleHost(parsed) {
		return nil, errUnsupportedLink
	}
	parsed.Fragment = ""
	return parsed, nil
}

func isAllowedGoogleHost(parsed *url.URL) bool {
	host := strings.ToLower(parsed.Hostname())
	return host == "google.com" || strings.HasSuffix(host, ".google.com") || host == "goo.gl" || strings.HasSuffix(host, ".goo.gl")
}

func extractCoordinates(value string) (float64, float64, bool) {
	decoded, _ := url.QueryUnescape(value)
	for _, candidate := range []string{value, decoded, strings.ReplaceAll(value, `\u0026`, "&")} {
		for _, pattern := range coordinatePatterns {
			match := pattern.FindStringSubmatch(candidate)
			if len(match) != 3 {
				continue
			}
			latitude, latErr := strconv.ParseFloat(match[1], 64)
			longitude, lngErr := strconv.ParseFloat(match[2], 64)
			if latErr == nil && lngErr == nil {
				return latitude, longitude, true
			}
		}
	}
	return 0, 0, false
}

func checkedResult(source string, latitude, longitude float64) (Result, error) {
	if latitude < 8.5 || latitude > 9.6 || longitude < 38.3 || longitude > 39.2 {
		return Result{}, errors.New("that location is outside the Addis Ababa service area")
	}
	return Result{URL: source, Latitude: latitude, Longitude: longitude}, nil
}

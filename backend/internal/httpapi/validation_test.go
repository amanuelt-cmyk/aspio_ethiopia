package httpapi

import (
	"encoding/json"
	"testing"
	"unicode/utf8"

	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/domain"
)

func TestCleanTruncatesUnicodeWithoutCorruptingIt(t *testing.T) {
	got := clean("  አ  በ  በ  ", 3)
	if got != "አ በ" {
		t.Fatalf("clean() = %q, want %q", got, "አ በ")
	}
	if !utf8.ValidString(got) {
		t.Fatal("clean() returned invalid UTF-8")
	}
}

func TestValidateSalon(t *testing.T) {
	item := domain.Salon{
		Slug: "bole-test", Status: "published", Category: "salon",
		NameAM: "የሙከራ ሳሎን", NameEN: "Test Salon", AreaAM: "ቦሌ", AreaEN: "Bole",
		Latitude: 8.98, Longitude: 38.79, ImageURL: "/assets/hair-salon.png",
		OpeningHours: json.RawMessage(`{"monday":["09:00","18:00"]}`), Amenities: json.RawMessage(`["wifi"]`),
	}
	if fields := validateSalon(&item); len(fields) != 0 {
		t.Fatalf("valid salon was rejected: %#v", fields)
	}
}

func TestValidateSalonRejectsInvalidCoordinatesAndSlug(t *testing.T) {
	item := domain.Salon{Slug: "Bad Slug", Status: "published", Category: "salon", NameAM: "ሳሎን", NameEN: "Salon", AreaAM: "ቦሌ", AreaEN: "Bole", Latitude: 40, Longitude: -70}
	fields := validateSalon(&item)
	if fields["slug"] == "" || fields["coordinates"] == "" {
		t.Fatalf("expected slug and coordinate errors: %#v", fields)
	}
}

func TestValidateSalonMirrorsOneLanguage(t *testing.T) {
	item := domain.Salon{Slug: "english-only", Status: "draft", Category: "salon", NameEN: "English Salon", AreaEN: "Bole", Latitude: 9.01, Longitude: 38.76}
	if fields := validateSalon(&item); len(fields) != 0 {
		t.Fatalf("one-language salon was rejected: %#v", fields)
	}
	if item.NameAM != item.NameEN || item.AreaAM != item.AreaEN {
		t.Fatalf("missing localized fields were not mirrored: %#v", item)
	}
}

func TestValidatePostMirrorsOneLanguage(t *testing.T) {
	item := domain.BlogPost{Slug: "english-only", Status: "published", TitleEN: "English story", ContentEN: "Story content"}
	if fields := validatePost(&item); len(fields) != 0 {
		t.Fatalf("one-language post was rejected: %#v", fields)
	}
	if item.TitleAM != item.TitleEN || item.ContentAM != item.ContentEN {
		t.Fatalf("missing localized post fields were not mirrored: %#v", item)
	}
}

func TestValidateLeadDefaultsLocale(t *testing.T) {
	input := leadInput{Kind: "demo", Source: "ethiopia-registration", Name: "Test User", Email: "test@example.com", Phone: "+251 911 000 000"}
	if fields := validateLead(&input); len(fields) != 0 {
		t.Fatalf("valid lead was rejected: %#v", fields)
	}
	if input.Locale != "am-ET" {
		t.Fatalf("expected default locale, got %q", input.Locale)
	}
}

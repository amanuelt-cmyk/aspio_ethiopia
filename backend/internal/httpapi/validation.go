package httpapi

import (
	"encoding/json"
	"net/mail"
	"net/url"
	"regexp"
	"strings"

	"github.com/aspio-se/aspio-backend/internal/domain"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
var phonePattern = regexp.MustCompile(`^[+0-9][0-9 ().-]{6,39}$`)
var sourcePattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

func clean(value string, max int) string {
	value = strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
	runes := []rune(value)
	if len(runes) > max {
		return string(runes[:max])
	}
	return value
}
func validEmail(value string) bool {
	if value == "" {
		return true
	}
	address, err := mail.ParseAddress(value)
	return err == nil && strings.EqualFold(address.Address, value)
}
func validURL(value string) bool {
	if value == "" {
		return true
	}
	if strings.HasPrefix(value, "/") && !strings.HasPrefix(value, "//") {
		return true
	}
	parsed, err := url.ParseRequestURI(value)
	return err == nil && (parsed.Scheme == "http" || parsed.Scheme == "https") && parsed.Host != ""
}
func normalizeLocale(value string) string {
	if strings.HasPrefix(strings.ToLower(value), "am") {
		return "am"
	}
	return "en"
}

func mirrorLocalized(amharic, english *string) {
	if *amharic == "" {
		*amharic = *english
	}
	if *english == "" {
		*english = *amharic
	}
}

func validateSalon(item *domain.Salon) map[string]string {
	item.Slug = strings.ToLower(clean(item.Slug, 120))
	item.Status = strings.ToLower(clean(item.Status, 20))
	item.Category = strings.ToLower(clean(item.Category, 30))
	item.NameAM = clean(item.NameAM, 180)
	item.NameEN = clean(item.NameEN, 180)
	item.AreaAM = clean(item.AreaAM, 120)
	item.AreaEN = clean(item.AreaEN, 120)
	item.DescriptionAM = strings.TrimSpace(item.DescriptionAM)
	item.DescriptionEN = strings.TrimSpace(item.DescriptionEN)
	item.Address = clean(item.Address, 300)
	item.GoogleMapsURL = clean(item.GoogleMapsURL, 1000)
	item.Phone = clean(item.Phone, 40)
	item.Email = strings.ToLower(clean(item.Email, 180))
	item.WebsiteURL = clean(item.WebsiteURL, 500)
	item.BookingURL = clean(item.BookingURL, 500)
	item.ImageURL = clean(item.ImageURL, 500)
	item.TagAM = clean(item.TagAM, 80)
	item.TagEN = clean(item.TagEN, 80)
	mirrorLocalized(&item.NameAM, &item.NameEN)
	mirrorLocalized(&item.AreaAM, &item.AreaEN)
	mirrorLocalized(&item.DescriptionAM, &item.DescriptionEN)
	mirrorLocalized(&item.TagAM, &item.TagEN)
	fields := map[string]string{}
	if !slugPattern.MatchString(item.Slug) {
		fields["slug"] = "Use lowercase letters, numbers, and single hyphens."
	}
	if item.Status != "draft" && item.Status != "published" && item.Status != "archived" {
		fields["status"] = "Use draft, published, or archived."
	}
	categories := map[string]bool{"salon": true, "barbershop": true, "spa": true, "nails": true, "wellness": true, "other": true}
	if !categories[item.Category] {
		fields["category"] = "Choose a supported category."
	}
	if item.NameAM == "" && item.NameEN == "" {
		fields["nameEn"] = "Enter the salon name in English or Amharic."
		fields["nameAm"] = "Enter the salon name in English or Amharic."
	}
	if item.AreaAM == "" && item.AreaEN == "" {
		fields["areaEn"] = "Enter the area in English or Amharic."
		fields["areaAm"] = "Enter the area in English or Amharic."
	}
	if item.Latitude < 8.5 || item.Latitude > 9.6 || item.Longitude < 38.3 || item.Longitude > 39.2 {
		fields["coordinates"] = "Coordinates must be in the Addis Ababa region."
	}
	if item.Email != "" && !validEmail(item.Email) {
		fields["email"] = "Enter a valid email address."
	}
	for key, value := range map[string]string{"websiteUrl": item.WebsiteURL, "bookingUrl": item.BookingURL, "imageUrl": item.ImageURL} {
		if !validURL(value) {
			fields[key] = "Enter a complete http(s) URL."
		}
	}
	if len(item.DescriptionAM) > 10000 {
		fields["descriptionAm"] = "Maximum length is 10,000 characters."
	}
	if len(item.DescriptionEN) > 10000 {
		fields["descriptionEn"] = "Maximum length is 10,000 characters."
	}
	if len(item.OpeningHours) == 0 {
		item.OpeningHours = json.RawMessage(`{}`)
	}
	if len(item.Amenities) == 0 {
		item.Amenities = json.RawMessage(`[]`)
	}
	if !json.Valid(item.OpeningHours) {
		fields["openingHours"] = "Enter valid JSON."
	}
	if !json.Valid(item.Amenities) {
		fields["amenities"] = "Enter valid JSON."
	}
	if item.Rating != nil && (*item.Rating < 0 || *item.Rating > 5) {
		fields["rating"] = "Rating must be from 0 to 5."
	}
	if item.ReviewCount < 0 {
		fields["reviewCount"] = "Review count cannot be negative."
	}
	if item.PriceFromETB != nil && *item.PriceFromETB < 0 {
		fields["priceFromEtb"] = "Price cannot be negative."
	}
	return fields
}

func validatePost(item *domain.BlogPost) map[string]string {
	item.Slug = strings.ToLower(clean(item.Slug, 140))
	item.Status = strings.ToLower(clean(item.Status, 20))
	item.TitleAM = clean(item.TitleAM, 220)
	item.TitleEN = clean(item.TitleEN, 220)
	item.AuthorName = clean(item.AuthorName, 120)
	item.CoverImageURL = clean(item.CoverImageURL, 500)
	item.ExcerptAM = strings.TrimSpace(item.ExcerptAM)
	item.ExcerptEN = strings.TrimSpace(item.ExcerptEN)
	item.ContentAM = strings.TrimSpace(item.ContentAM)
	item.ContentEN = strings.TrimSpace(item.ContentEN)
	item.SEOTitleAM = clean(item.SEOTitleAM, 220)
	item.SEOTitleEN = clean(item.SEOTitleEN, 220)
	item.SEODescriptionAM = strings.TrimSpace(item.SEODescriptionAM)
	item.SEODescriptionEN = strings.TrimSpace(item.SEODescriptionEN)
	mirrorLocalized(&item.TitleAM, &item.TitleEN)
	mirrorLocalized(&item.ExcerptAM, &item.ExcerptEN)
	mirrorLocalized(&item.ContentAM, &item.ContentEN)
	mirrorLocalized(&item.SEOTitleAM, &item.SEOTitleEN)
	mirrorLocalized(&item.SEODescriptionAM, &item.SEODescriptionEN)
	if item.AuthorName == "" {
		item.AuthorName = "Aspio"
	}
	if item.Tags == nil {
		item.Tags = []string{}
	}
	fields := map[string]string{}
	if !slugPattern.MatchString(item.Slug) {
		fields["slug"] = "Use lowercase letters, numbers, and single hyphens."
	}
	if item.Status != "draft" && item.Status != "published" && item.Status != "archived" {
		fields["status"] = "Use draft, published, or archived."
	}
	if item.TitleAM == "" && item.TitleEN == "" {
		fields["titleEn"] = "Enter the title in English or Amharic."
		fields["titleAm"] = "Enter the title in English or Amharic."
	}
	if item.Status == "published" && item.ContentAM == "" && item.ContentEN == "" {
		fields["content"] = "Published posts need content in English or Amharic."
	}
	if !validURL(item.CoverImageURL) {
		fields["coverImageUrl"] = "Enter a complete http(s) URL."
	}
	if len(item.ContentAM) > 200000 || len(item.ContentEN) > 200000 {
		fields["content"] = "Each content field is limited to 200,000 characters."
	}
	if len(item.Tags) > 20 {
		fields["tags"] = "Use no more than 20 tags."
	}
	for index, tag := range item.Tags {
		item.Tags[index] = strings.ToLower(clean(tag, 40))
	}
	return fields
}

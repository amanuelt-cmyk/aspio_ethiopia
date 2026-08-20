package domain

import (
	"encoding/json"
	"time"
)

const (
	AdminRoleSuperAdmin = "super_admin"
	AdminRoleAdmin      = "admin"
)

func ValidAdminRole(role string) bool {
	return role == AdminRoleSuperAdmin || role == AdminRoleAdmin
}

type AdminUser struct {
	ID           string     `json:"id"`
	Email        string     `json:"email"`
	Name         string     `json:"name"`
	Phone        string     `json:"phone"`
	JobTitle     string     `json:"jobTitle"`
	AvatarURL    string     `json:"avatarUrl"`
	PasswordHash string     `json:"-"`
	Role         string     `json:"role"`
	Active       bool       `json:"active"`
	LastLoginAt  *time.Time `json:"lastLoginAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

type Salon struct {
	ID            string          `json:"id"`
	Slug          string          `json:"slug"`
	Status        string          `json:"status"`
	Category      string          `json:"category"`
	NameAM        string          `json:"nameAm"`
	NameEN        string          `json:"nameEn"`
	DescriptionAM string          `json:"descriptionAm"`
	DescriptionEN string          `json:"descriptionEn"`
	AreaAM        string          `json:"areaAm"`
	AreaEN        string          `json:"areaEn"`
	Address       string          `json:"address"`
	GoogleMapsURL string          `json:"googleMapsUrl"`
	Latitude      float64         `json:"latitude"`
	Longitude     float64         `json:"longitude"`
	Phone         string          `json:"phone"`
	Email         string          `json:"email"`
	WebsiteURL    string          `json:"websiteUrl"`
	BookingURL    string          `json:"bookingUrl"`
	ImageURL      string          `json:"imageUrl"`
	PriceFromETB  *int            `json:"priceFromEtb,omitempty"`
	Rating        *float64        `json:"rating,omitempty"`
	ReviewCount   int             `json:"reviewCount"`
	TagAM         string          `json:"tagAm"`
	TagEN         string          `json:"tagEn"`
	OpeningHours  json.RawMessage `json:"openingHours"`
	Amenities     json.RawMessage `json:"amenities"`
	SortOrder     int             `json:"sortOrder"`
	PublishedAt   *time.Time      `json:"publishedAt,omitempty"`
	CreatedAt     time.Time       `json:"createdAt"`
	UpdatedAt     time.Time       `json:"updatedAt"`
}

type PublicSalon struct {
	ID           string          `json:"id"`
	Slug         string          `json:"slug"`
	Name         string          `json:"name"`
	Description  string          `json:"description"`
	Category     string          `json:"category"`
	Area         string          `json:"area"`
	Address      string          `json:"address"`
	Latitude     float64         `json:"latitude"`
	Longitude    float64         `json:"longitude"`
	Phone        string          `json:"phone,omitempty"`
	Email        string          `json:"email,omitempty"`
	WebsiteURL   string          `json:"websiteUrl,omitempty"`
	BookingURL   string          `json:"bookingUrl,omitempty"`
	ImageURL     string          `json:"imageUrl,omitempty"`
	PriceFromETB *int            `json:"priceFromEtb,omitempty"`
	Rating       *float64        `json:"rating,omitempty"`
	ReviewCount  int             `json:"reviewCount"`
	Tag          string          `json:"tag,omitempty"`
	OpeningHours json.RawMessage `json:"openingHours"`
	Amenities    json.RawMessage `json:"amenities"`
	Media        []SalonMedia    `json:"media"`
}

type SalonMedia struct {
	ID           string    `json:"id"`
	SalonID      string    `json:"salonId,omitempty"`
	Kind         string    `json:"kind"`
	URL          string    `json:"url"`
	MIMEType     string    `json:"mimeType"`
	OriginalName string    `json:"originalName"`
	AltText      string    `json:"altText"`
	SizeBytes    int64     `json:"sizeBytes"`
	SortOrder    int       `json:"sortOrder"`
	CreatedAt    time.Time `json:"createdAt"`
}

type GalleryMedia struct {
	ID           string    `json:"id"`
	Kind         string    `json:"kind"`
	Status       string    `json:"status"`
	URL          string    `json:"url"`
	MIMEType     string    `json:"mimeType"`
	OriginalName string    `json:"originalName"`
	TitleAM      string    `json:"titleAm"`
	TitleEN      string    `json:"titleEn"`
	CaptionAM    string    `json:"captionAm"`
	CaptionEN    string    `json:"captionEn"`
	SizeBytes    int64     `json:"sizeBytes"`
	SortOrder    int       `json:"sortOrder"`
	CreatedBy    string    `json:"createdBy,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type PublicGalleryMedia struct {
	ID           string    `json:"id"`
	Kind         string    `json:"kind"`
	URL          string    `json:"url"`
	MIMEType     string    `json:"mimeType"`
	OriginalName string    `json:"originalName"`
	Title        string    `json:"title"`
	Caption      string    `json:"caption"`
	SizeBytes    int64     `json:"sizeBytes"`
	SortOrder    int       `json:"sortOrder"`
	CreatedAt    time.Time `json:"createdAt"`
}

type FeaturedPlace struct {
	ID            string    `json:"id"`
	SalonID       string    `json:"salonId"`
	BadgeAM       string    `json:"badgeAm"`
	BadgeEN       string    `json:"badgeEn"`
	DescriptionAM string    `json:"descriptionAm"`
	DescriptionEN string    `json:"descriptionEn"`
	SortOrder     int       `json:"sortOrder"`
	Active        bool      `json:"active"`
	CreatedBy     string    `json:"createdBy,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type PublicFeaturedPlace struct {
	ID           string   `json:"id"`
	SalonID      string   `json:"salonId"`
	Slug         string   `json:"slug"`
	Name         string   `json:"name"`
	Category     string   `json:"category"`
	Area         string   `json:"area"`
	ImageURL     string   `json:"imageUrl"`
	PriceFromETB *int     `json:"priceFromEtb,omitempty"`
	Rating       *float64 `json:"rating,omitempty"`
	Tag          string   `json:"tag"`
	Badge        string   `json:"badge"`
	Description  string   `json:"description"`
	SortOrder    int      `json:"sortOrder"`
}

type BlogPost struct {
	ID               string     `json:"id"`
	Slug             string     `json:"slug"`
	Status           string     `json:"status"`
	TitleAM          string     `json:"titleAm"`
	TitleEN          string     `json:"titleEn"`
	ExcerptAM        string     `json:"excerptAm"`
	ExcerptEN        string     `json:"excerptEn"`
	ContentAM        string     `json:"contentAm"`
	ContentEN        string     `json:"contentEn"`
	CoverImageURL    string     `json:"coverImageUrl"`
	AuthorName       string     `json:"authorName"`
	Tags             []string   `json:"tags"`
	SEOTitleAM       string     `json:"seoTitleAm"`
	SEOTitleEN       string     `json:"seoTitleEn"`
	SEODescriptionAM string     `json:"seoDescriptionAm"`
	SEODescriptionEN string     `json:"seoDescriptionEn"`
	PublishedAt      *time.Time `json:"publishedAt,omitempty"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type PublicBlogPost struct {
	ID             string     `json:"id"`
	Slug           string     `json:"slug"`
	Title          string     `json:"title"`
	Excerpt        string     `json:"excerpt"`
	Content        string     `json:"content,omitempty"`
	CoverImageURL  string     `json:"coverImageUrl,omitempty"`
	AuthorName     string     `json:"authorName"`
	Tags           []string   `json:"tags"`
	SEOTitle       string     `json:"seoTitle,omitempty"`
	SEODescription string     `json:"seoDescription,omitempty"`
	PublishedAt    *time.Time `json:"publishedAt,omitempty"`
}

type Lead struct {
	ID           string    `json:"id"`
	Kind         string    `json:"kind"`
	Source       string    `json:"source"`
	Locale       string    `json:"locale"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	BusinessName string    `json:"businessName,omitempty"`
	Message      string    `json:"message,omitempty"`
	Status       string    `json:"status"`
	EmailStatus  string    `json:"emailStatus"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type DeliveryJob struct {
	ID          int64
	Kind        string
	AggregateID string
	Payload     json.RawMessage
	Attempts    int
}

type Page[T any] struct {
	Items    []T `json:"items"`
	Page     int `json:"page"`
	PageSize int `json:"pageSize"`
	Total    int `json:"total"`
}

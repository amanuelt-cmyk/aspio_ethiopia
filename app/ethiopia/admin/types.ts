export type AdminRole = "super_admin" | "admin";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  jobTitle: string;
  avatarUrl: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublishStatus = "draft" | "published" | "archived";
export type SalonCategory = "salon" | "barbershop" | "spa" | "nails" | "wellness" | "other";
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "closed" | "spam";

export type Salon = {
  id: string;
  slug: string;
  status: PublishStatus;
  category: SalonCategory;
  nameAm: string;
  nameEn: string;
  descriptionAm: string;
  descriptionEn: string;
  areaAm: string;
  areaEn: string;
  address: string;
  googleMapsUrl: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  websiteUrl: string;
  bookingUrl: string;
  imageUrl: string;
  priceFromEtb?: number;
  rating?: number;
  reviewCount: number;
  tagAm: string;
  tagEn: string;
  openingHours: Record<string, unknown>;
  amenities: string[];
  sortOrder: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SalonMedia = {
  id: string;
  salonId: string;
  kind: "image" | "video";
  url: string;
  mimeType: string;
  originalName: string;
  altText: string;
  sizeBytes: number;
  sortOrder: number;
  createdAt: string;
};

export type GalleryMedia = {
  id: string;
  kind: "image" | "video";
  status: "draft" | "published";
  url: string;
  mimeType: string;
  originalName: string;
  titleAm: string;
  titleEn: string;
  captionAm: string;
  captionEn: string;
  sizeBytes: number;
  sortOrder: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type FeaturedPlace = {
  id: string;
  salonId: string;
  badgeAm: string;
  badgeEn: string;
  descriptionAm: string;
  descriptionEn: string;
  sortOrder: number;
  active: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type SalonDraft = Omit<Salon, "id" | "publishedAt" | "createdAt" | "updatedAt" | "latitude" | "longitude" | "priceFromEtb" | "rating" | "reviewCount" | "sortOrder" | "openingHours" | "amenities"> & {
  id?: string;
  latitude: string;
  longitude: string;
  priceFromEtb: string;
  rating: string;
  reviewCount: string;
  sortOrder: string;
  openingHours: string;
  amenities: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  status: PublishStatus;
  titleAm: string;
  titleEn: string;
  excerptAm: string;
  excerptEn: string;
  contentAm: string;
  contentEn: string;
  coverImageUrl: string;
  authorName: string;
  tags: string[];
  seoTitleAm: string;
  seoTitleEn: string;
  seoDescriptionAm: string;
  seoDescriptionEn: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PostDraft = Omit<BlogPost, "id" | "tags" | "publishedAt" | "createdAt" | "updatedAt"> & {
  id?: string;
  tags: string;
};

export type Lead = {
  id: string;
  kind: "demo" | "contact";
  source: string;
  locale: string;
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  message?: string;
  status: LeadStatus;
  emailStatus: "queued" | "sent" | "failed";
  createdAt: string;
  updatedAt: string;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type AdminView = "overview" | "salons" | "featured" | "images" | "videos" | "posts" | "leads" | "users" | "profile";

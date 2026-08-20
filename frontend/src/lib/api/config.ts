const configuredApiOrigin = process.env.NEXT_PUBLIC_ASPIO_API_URL?.trim().replace(/\/$/, "");

export const API_BASE_URL = configuredApiOrigin
  || (process.env.NODE_ENV === "development" ? "http://localhost:18080" : "");

export function apiUrl(path: string) {
  if (!API_BASE_URL) return "";
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function mediaUrl(value: string) {
  return value.startsWith("/uploads/") && API_BASE_URL ? `${API_BASE_URL}${value}` : value;
}

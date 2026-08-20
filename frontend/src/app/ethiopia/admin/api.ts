import type { AdminUser } from "./types";
import { apiUrl, API_BASE_URL } from "@/lib/api/config";

export class AdminApiError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string>;

  constructor(message: string, status: number, code?: string, fields?: Record<string, string>) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

type ErrorEnvelope = { error?: { code?: string; message?: string; fields?: Record<string, string> } };

export async function adminRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  if (!API_BASE_URL) throw new AdminApiError("The admin service is not ready yet. Please try again shortly.", 0, "not_configured");

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/v1${path}`), { ...options, headers, cache: "no-store" });
  } catch {
    throw new AdminApiError("We could not reach the admin service. Please try again shortly.", 0, "network_error");
  }

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null) as (T & ErrorEnvelope) | null;
  if (!response.ok) {
    throw new AdminApiError(body?.error?.message ?? `Request failed with status ${response.status}.`, response.status, body?.error?.code, body?.error?.fields);
  }
  return body as T;
}

export function adminUpload<T>(path: string, body: FormData, token: string, onProgress?: (progress: number) => void): Promise<T> {
  if (!API_BASE_URL) return Promise.reject(new AdminApiError("The admin service is not ready yet. Please try again shortly.", 0, "not_configured"));
  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", apiUrl(`/api/v1${path}`));
    request.setRequestHeader("Accept", "application/json");
    request.setRequestHeader("Authorization", `Bearer ${token}`);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    request.onerror = () => reject(new AdminApiError("The upload was interrupted. Please check your connection and try again.", 0, "network_error"));
    request.onload = () => {
      let response: (T & ErrorEnvelope) | null = null;
      try { response = request.responseText ? JSON.parse(request.responseText) as T & ErrorEnvelope : null; } catch { /* handled below */ }
      if (request.status >= 200 && request.status < 300 && response) {
        onProgress?.(100);
        resolve(response as T);
        return;
      }
      reject(new AdminApiError(response?.error?.message ?? `Upload failed with status ${request.status}.`, request.status, response?.error?.code, response?.error?.fields));
    };
    request.send(body);
  });
}

export async function login(email: string, password: string) {
  return adminRequest<{ token: string; expiresAt: string; user: AdminUser }>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

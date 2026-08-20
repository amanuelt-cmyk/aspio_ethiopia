"use client";

import { useEffect, useState } from "react";
import { apiUrl, API_BASE_URL, mediaUrl } from "@/lib/api/config";
import { demoImageForSalon, type Place } from "./data";

type BackendSalon = {
  id: string;
  slug: string;
  name: string;
  category: string;
  area: string;
  imageUrl?: string;
  priceFromEtb?: number;
  rating?: number;
  tag?: string;
  latitude: number;
  longitude: number;
};

type SalonPage = { items?: BackendSalon[] };

const categoryNames = {
  salon: "Hair salon",
  barbershop: "Barbershop",
  spa: "Spa & wellness",
  nails: "Nails & spa",
  wellness: "Wellness",
  other: "Beauty service",
} as const;

export function useBackendSalons(fallback: Place[]) {
  const [salons, setSalons] = useState<Place[]>(fallback);

  useEffect(() => {
    if (!API_BASE_URL) return;

    const controller = new AbortController();
    fetch(apiUrl("/api/v1/salons?locale=en&pageSize=100"), { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Salon API returned ${response.status}`);
        return response.json() as Promise<SalonPage>;
      })
      .then((result) => {
        if (!result.items?.length) return;
        setSalons(result.items.map((salon) => ({
          id: salon.id,
          slug: salon.slug,
          name: salon.name,
          type: categoryNames[salon.category as keyof typeof categoryNames] ?? categoryNames.other,
          area: `${salon.area} · Addis Ababa`,
          rating: salon.rating?.toFixed(1) ?? "—",
          price: salon.priceFromEtb == null ? "Ask for price" : `from ${salon.priceFromEtb} birr`,
          image: demoImageForSalon(
            salon.slug,
            salon.category,
            salon.imageUrl ? mediaUrl(salon.imageUrl) : undefined,
          ),
          tag: salon.tag || "On Aspio",
          latitude: salon.latitude,
          longitude: salon.longitude,
        })));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Using bundled salon data because the Aspio API is unavailable.");
      });

    return () => controller.abort();
  }, [fallback]);

  return salons;
}

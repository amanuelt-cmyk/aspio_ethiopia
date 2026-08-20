"use client";

import { useEffect, useState } from "react";
import { apiUrl, API_BASE_URL, mediaUrl } from "@/lib/api/config";
import { demoImageForSalon, type Place } from "./data";

type BackendFeaturedPlace = {
  id: string;
  salonId: string;
  slug: string;
  name: string;
  category: string;
  area: string;
  imageUrl?: string;
  priceFromEtb?: number;
  rating?: number;
  tag?: string;
  badge?: string;
  description?: string;
  sortOrder: number;
};

type FeaturedResponse = { items?: BackendFeaturedPlace[] };

const categoryNames = {
  salon: "Hair salon",
  barbershop: "Barbershop",
  other: "Beauty service",
} as const;

function assetURL(place: BackendFeaturedPlace) {
  const value = place.imageUrl ? mediaUrl(place.imageUrl) : undefined;
  return demoImageForSalon(place.slug, place.category, value);
}

export function useFeaturedPlaces(fallback: Place[]) {
  const [places, setPlaces] = useState<Place[]>(fallback);

  useEffect(() => {
    if (!API_BASE_URL) return;

    const controller = new AbortController();
    fetch(apiUrl("/api/v1/featured-places?locale=en"), { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Featured places API returned ${response.status}`);
        return response.json() as Promise<FeaturedResponse>;
      })
      .then((result) => {
        setPlaces((result.items ?? []).map((place) => ({
          id: place.salonId,
          slug: place.slug,
          name: place.name,
          type: categoryNames[place.category as "salon" | "barbershop"] ?? categoryNames.other,
          area: `${place.area} · Addis Ababa`,
          rating: place.rating?.toFixed(1) ?? "—",
          price: place.priceFromEtb == null ? "Ask for price" : `from ${place.priceFromEtb} birr`,
          image: assetURL(place),
          tag: place.badge || place.tag || "Aspio partner",
          description: place.description,
        })));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Using bundled featured places because the Aspio API is unavailable.");
      });

    return () => controller.abort();
  }, [fallback]);

  return places;
}

"use client";

import { useEffect, useState } from "react";
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
  am: { salon: "የውበት ሳሎን", barbershop: "የወንዶች ፀጉር ቤት", other: "የውበት አገልግሎት" },
  en: { salon: "Hair salon", barbershop: "Barbershop", other: "Beauty service" },
} as const;

function assetURL(place: BackendFeaturedPlace, baseURL: string) {
  const value = place.imageUrl?.startsWith("/uploads/") ? `${baseURL}${place.imageUrl}` : place.imageUrl;
  return demoImageForSalon(place.slug, place.category, value);
}

export function useFeaturedPlaces(language: "am" | "en", fallback: Place[]) {
  const [places, setPlaces] = useState<Place[]>(fallback);

  useEffect(() => {
    const baseURL = process.env.NEXT_PUBLIC_ASPIO_API_URL?.replace(/\/$/, "");
    if (!baseURL) return;

    const controller = new AbortController();
    fetch(`${baseURL}/api/v1/featured-places?locale=${language}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Featured places API returned ${response.status}`);
        return response.json() as Promise<FeaturedResponse>;
      })
      .then((result) => {
        setPlaces((result.items ?? []).map((place) => ({
          id: place.salonId,
          slug: place.slug,
          name: place.name,
          type: categoryNames[language][place.category as "salon" | "barbershop"] ?? categoryNames[language].other,
          area: language === "am" ? `${place.area} · አዲስ አበባ` : `${place.area} · Addis Ababa`,
          rating: place.rating?.toFixed(1) ?? "—",
          price: place.priceFromEtb == null
            ? (language === "am" ? "ዋጋ ይጠይቁ" : "Ask for price")
            : (language === "am" ? `ከ ${place.priceFromEtb} ብር` : `from ${place.priceFromEtb} birr`),
          image: assetURL(place, baseURL),
          tag: place.badge || place.tag || (language === "am" ? "የአስፒዮ አጋር" : "Aspio partner"),
          description: place.description,
        })));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Using bundled featured places because the Aspio API is unavailable.");
      });

    return () => controller.abort();
  }, [fallback, language]);

  return places;
}

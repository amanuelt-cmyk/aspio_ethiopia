"use client";

import { useEffect, useState } from "react";
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
  am: { salon: "የውበት ሳሎን", barbershop: "የወንዶች ፀጉር ቤት", spa: "ስፓ እና የእንክብካቤ ማዕከል", nails: "የጥፍር እና ስፓ አገልግሎት", wellness: "የጤና እና እንክብካቤ", other: "የውበት አገልግሎት" },
  en: { salon: "Hair salon", barbershop: "Barbershop", spa: "Spa & wellness", nails: "Nails & spa", wellness: "Wellness", other: "Beauty service" },
} as const;

export function useBackendSalons(language: "am" | "en", fallback: Place[]) {
  const [salons, setSalons] = useState<Place[]>(fallback);

  useEffect(() => {
    const baseURL = process.env.NEXT_PUBLIC_ASPIO_API_URL?.replace(/\/$/, "");
    if (!baseURL) return;

    const controller = new AbortController();
    fetch(`${baseURL}/api/v1/salons?locale=${language}&pageSize=100`, { signal: controller.signal, cache: "no-store" })
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
          type: categoryNames[language][salon.category as keyof typeof categoryNames.am] ?? categoryNames[language].other,
          area: language === "am" ? `${salon.area} · አዲስ አበባ` : `${salon.area} · Addis Ababa`,
          rating: salon.rating?.toFixed(1) ?? "—",
          price: salon.priceFromEtb == null ? (language === "am" ? "ዋጋ ይጠይቁ" : "Ask for price") : language === "am" ? `ከ ${salon.priceFromEtb} ብር` : `from ${salon.priceFromEtb} birr`,
          image: demoImageForSalon(
            salon.slug,
            salon.category,
            salon.imageUrl?.startsWith("/uploads/") ? `${baseURL}${salon.imageUrl}` : salon.imageUrl,
          ),
          tag: salon.tag || (language === "am" ? "በአስፒዮ" : "On Aspio"),
          latitude: salon.latitude,
          longitude: salon.longitude,
        })));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Using bundled salon data because the Aspio API is unavailable.");
      });

    return () => controller.abort();
  }, [fallback, language]);

  return salons;
}

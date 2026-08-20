export type Place = {
  id?: string;
  slug?: string;
  name: string;
  type: string;
  area: string;
  rating: string;
  price: string;
  image: string;
  tag: string;
  description?: string;
  latitude?: number;
  longitude?: number;
};

export const demoSalonImages = {
  flagship: "/assets/et-featured-salon.png",
  naturalHair: "/assets/et-salon-natural-hair.png",
  braids: "/assets/et-salon-braids.png",
  barber: "/assets/et-barber-studio.png",
  nails: "/assets/et-nail-studio.png",
  spa: "/assets/et-spa-retreat.png",
} as const;

const legacyDemoImages = new Set([
  "/assets/hair-salon.png",
  "/assets/barbershop.png",
  "/assets/nail-studio.png",
  "/assets/spa-clinic.png",
]);

export function demoImageForSalon(slug = "", category = "salon", currentImage?: string) {
  if (currentImage && !legacyDemoImages.has(currentImage)) return currentImage;
  const normalizedSlug = slug.toLowerCase();
  if (normalizedSlug.includes("lucy")) return demoSalonImages.flagship;
  if (normalizedSlug.includes("habesha")) return demoSalonImages.braids;
  if (normalizedSlug.includes("azeb")) return demoSalonImages.naturalHair;
  if (category === "barbershop") return demoSalonImages.barber;
  if (category === "nails") return demoSalonImages.nails;
  if (category === "spa" || category === "wellness") return demoSalonImages.spa;
  return demoSalonImages.naturalHair;
}

export const demoPlaces: Place[] = [
  { name: "Lucy Beauty Lounge", type: "Hair salon", area: "Bole · Addis Ababa", rating: "4.9", price: "from 450 birr", image: demoSalonImages.flagship, tag: "Open today" },
  { name: "Addis Barber Club", type: "Barbershop", area: "Piassa · Addis Ababa", rating: "4.8", price: "from 250 birr", image: demoSalonImages.barber, tag: "Popular" },
  { name: "Seba Nail Studio", type: "Nails & spa", area: "Saris · Addis Ababa", rating: "4.7", price: "from 350 birr", image: demoSalonImages.nails, tag: "New" },
  { name: "Efoyta Spa", type: "Spa & wellness", area: "22 Mazoria · Addis Ababa", rating: "4.9", price: "from 600 birr", image: demoSalonImages.spa, tag: "Nearby" },
  { name: "Habesha Hair House", type: "Hair salon", area: "Megenagna · Addis Ababa", rating: "4.8", price: "from 500 birr", image: demoSalonImages.braids, tag: "Open today" },
  { name: "Kings Barber", type: "Barbershop", area: "CMC · Addis Ababa", rating: "4.6", price: "from 300 birr", image: demoSalonImages.barber, tag: "Quick booking" },
  { name: "Rose Nail Bar", type: "Nails & spa", area: "Kazanchis · Addis Ababa", rating: "4.9", price: "from 400 birr", image: demoSalonImages.nails, tag: "Popular" },
  { name: "Zen Wellness", type: "Spa & wellness", area: "Old Airport · Addis Ababa", rating: "4.8", price: "from 750 birr", image: demoSalonImages.spa, tag: "Special offer" },
  { name: "Azeb Hair Salon", type: "Hair salon", area: "Gerji · Addis Ababa", rating: "4.7", price: "from 380 birr", image: demoSalonImages.naturalHair, tag: "New" },
  { name: "The Groom Room", type: "Barbershop", area: "Bole Atlas · Addis Ababa", rating: "5.0", price: "from 350 birr", image: demoSalonImages.barber, tag: "Top rated" },
  { name: "Mila Nail Studio", type: "Nails & spa", area: "4 Kilo · Addis Ababa", rating: "4.6", price: "from 320 birr", image: demoSalonImages.nails, tag: "Open today" },
  { name: "Wana Spa Retreat", type: "Spa & wellness", area: "Lebu · Addis Ababa", rating: "4.9", price: "from 800 birr", image: demoSalonImages.spa, tag: "Nearby" },
];

export const navigation = [
  { href: "/ethiopia", label: "Home" },
  { href: "https://app.aspio.io/", label: "Marketplace" },
  { href: "/ethiopia/gallery", label: "Gallery" },
  { href: "/ethiopia/how-it-works", label: "How it works" },
  { href: "/ethiopia/business", label: "For business" },
  { href: "/ethiopia/contact", label: "Contact" },
];

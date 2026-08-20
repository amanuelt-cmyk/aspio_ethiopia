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

const demoSalonImageSequence = [
  demoSalonImages.flagship,
  demoSalonImages.barber,
  demoSalonImages.nails,
  demoSalonImages.spa,
  demoSalonImages.braids,
  demoSalonImages.barber,
  demoSalonImages.nails,
  demoSalonImages.spa,
  demoSalonImages.naturalHair,
  demoSalonImages.barber,
  demoSalonImages.nails,
  demoSalonImages.spa,
] as const;

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

export const places: Place[] = [
  { name: "ሉሲ ቢዩቲ ላውንጅ", type: "የውበት ሳሎን", area: "ቦሌ · አዲስ አበባ", rating: "4.9", price: "ከ 450 ብር", image: "/assets/hair-salon.png", tag: "ዛሬ ክፍት" },
  { name: "አዲስ ባርበር ክለብ", type: "የወንዶች ፀጉር ቤት", area: "ፒያሳ · አዲስ አበባ", rating: "4.8", price: "ከ 250 ብር", image: "/assets/barbershop.png", tag: "ተወዳጅ" },
  { name: "ሰባ ኔይል ስቱዲዮ", type: "የጥፍር እና ስፓ አገልግሎት", area: "ሳሪስ · አዲስ አበባ", rating: "4.7", price: "ከ 350 ብር", image: "/assets/nail-studio.png", tag: "አዲስ" },
  { name: "እፎይታ ስፓ", type: "ስፓ እና የእንክብካቤ ማዕከል", area: "22 ማዞሪያ · አዲስ አበባ", rating: "4.9", price: "ከ 600 ብር", image: "/assets/spa-clinic.png", tag: "በቅርብ አቅራቢያ" },
  { name: "ሐበሻ ሄር ሃውስ", type: "የውበት ሳሎን", area: "መገናኛ · አዲስ አበባ", rating: "4.8", price: "ከ 500 ብር", image: "/assets/hair-salon.png", tag: "ዛሬ ክፍት" },
  { name: "ኪንግስ ባርበር", type: "የወንዶች ፀጉር ቤት", area: "CMC · አዲስ አበባ", rating: "4.6", price: "ከ 300 ብር", image: "/assets/barbershop.png", tag: "ፈጣን ቀጠሮ" },
  { name: "ሮዝ ኔይል ባር", type: "የጥፍር እና ስፓ አገልግሎት", area: "ካዛንቺስ · አዲስ አበባ", rating: "4.9", price: "ከ 400 ብር", image: "/assets/nail-studio.png", tag: "ተወዳጅ" },
  { name: "ዜን ዌልነስ", type: "ስፓ እና የእንክብካቤ ማዕከል", area: "ኦልድ ኤርፖርት · አዲስ አበባ", rating: "4.8", price: "ከ 750 ብር", image: "/assets/spa-clinic.png", tag: "ልዩ ቅናሽ" },
  { name: "አዜብ የሴቶች ፀጉር ሳሎን", type: "የውበት ሳሎን", area: "ገርጂ · አዲስ አበባ", rating: "4.7", price: "ከ 380 ብር", image: "/assets/hair-salon.png", tag: "አዲስ" },
  { name: "ዘ ግሩም ሩም", type: "የወንዶች ፀጉር ቤት", area: "ቦሌ አትላስ · አዲስ አበባ", rating: "5.0", price: "ከ 350 ብር", image: "/assets/barbershop.png", tag: "ከፍተኛ ደረጃ ያገኘ" },
  { name: "ሚላ ኔይል ስቱዲዮ", type: "የጥፍር እና ስፓ አገልግሎት", area: "4 ኪሎ · አዲስ አበባ", rating: "4.6", price: "ከ 320 ብር", image: "/assets/nail-studio.png", tag: "ዛሬ ክፍት" },
  { name: "ዋና ስፓ ሪትሪት", type: "ስፓ እና የእንክብካቤ ማዕከል", area: "ለቡ · አዲስ አበባ", rating: "4.9", price: "ከ 800 ብር", image: "/assets/spa-clinic.png", tag: "በቅርብ አቅራቢያ" },
].map((place, index) => ({ ...place, image: demoSalonImageSequence[index] }));

export const placesEn: Place[] = [
  { name: "Lucy Beauty Lounge", type: "Hair salon", area: "Bole · Addis Ababa", rating: "4.9", price: "from 450 birr", image: "/assets/hair-salon.png", tag: "Open today" },
  { name: "Addis Barber Club", type: "Barbershop", area: "Piassa · Addis Ababa", rating: "4.8", price: "from 250 birr", image: "/assets/barbershop.png", tag: "Popular" },
  { name: "Seba Nail Studio", type: "Nails & spa", area: "Saris · Addis Ababa", rating: "4.7", price: "from 350 birr", image: "/assets/nail-studio.png", tag: "New" },
  { name: "Efoyta Spa", type: "Spa & wellness", area: "22 Mazoria · Addis Ababa", rating: "4.9", price: "from 600 birr", image: "/assets/spa-clinic.png", tag: "Nearby" },
  { name: "Habesha Hair House", type: "Hair salon", area: "Megenagna · Addis Ababa", rating: "4.8", price: "from 500 birr", image: "/assets/hair-salon.png", tag: "Open today" },
  { name: "Kings Barber", type: "Barbershop", area: "CMC · Addis Ababa", rating: "4.6", price: "from 300 birr", image: "/assets/barbershop.png", tag: "Quick booking" },
  { name: "Rose Nail Bar", type: "Nails & spa", area: "Kazanchis · Addis Ababa", rating: "4.9", price: "from 400 birr", image: "/assets/nail-studio.png", tag: "Popular" },
  { name: "Zen Wellness", type: "Spa & wellness", area: "Old Airport · Addis Ababa", rating: "4.8", price: "from 750 birr", image: "/assets/spa-clinic.png", tag: "Special offer" },
  { name: "Azeb Hair Salon", type: "Hair salon", area: "Gerji · Addis Ababa", rating: "4.7", price: "from 380 birr", image: "/assets/hair-salon.png", tag: "New" },
  { name: "The Groom Room", type: "Barbershop", area: "Bole Atlas · Addis Ababa", rating: "5.0", price: "from 350 birr", image: "/assets/barbershop.png", tag: "Top rated" },
  { name: "Mila Nail Studio", type: "Nails & spa", area: "4 Kilo · Addis Ababa", rating: "4.6", price: "from 320 birr", image: "/assets/nail-studio.png", tag: "Open today" },
  { name: "Wana Spa Retreat", type: "Spa & wellness", area: "Lebu · Addis Ababa", rating: "4.9", price: "from 800 birr", image: "/assets/spa-clinic.png", tag: "Nearby" },
].map((place, index) => ({ ...place, image: demoSalonImageSequence[index] }));

export const navAm = [
  { href: "/ethiopia/am", label: "መነሻ" },
  { href: "https://app.aspio.io/", label: "ማርኬትፕሌስ" },
  { href: "/ethiopia/am/gallery", label: "ጋለሪ" },
  { href: "/ethiopia/am/how-it-works", label: "እንዴት እንደሚሰራ" },
  { href: "/ethiopia/am/business", label: "ለንግድ ድርጅቶች" },
  { href: "/ethiopia/am/contact", label: "ያግኙን" },
];

export const navEn = [
  { href: "/ethiopia", label: "Home" },
  { href: "https://app.aspio.io/", label: "Marketplace" },
  { href: "/ethiopia/en/gallery", label: "Gallery" },
  { href: "/ethiopia/en/how-it-works", label: "How it works" },
  { href: "/ethiopia/en/business", label: "For business" },
  { href: "/ethiopia/en/contact", label: "Contact" },
];

export const nav = navEn;

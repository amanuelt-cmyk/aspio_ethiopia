import { demoSalonImages } from "./data";

export type AddisArea = {
  id: string;
  nameAm: string;
  nameEn: string;
  count: number;
  time: string;
  lat: number;
  lng: number;
  featured: boolean;
};

export type AreaSalon = {
  id: string;
  name: string;
  type: string;
  rating: string;
  price: string;
  image: string;
  time: string;
};

type AreaSeed = Omit<AddisArea, "count" | "time" | "featured"> & {
  count?: number;
  time?: string;
  featured?: boolean;
};

const areaSeeds: readonly AreaSeed[] = [
  { id: "bole", nameAm: "ቦሌ", nameEn: "Bole", count: 84, time: "14:30", lat: 8.9806, lng: 38.7895, featured: true },
  { id: "piassa", nameAm: "ፒያሳ", nameEn: "Piassa", count: 62, time: "15:00", lat: 9.0365, lng: 38.7523, featured: true },
  { id: "kazanchis", nameAm: "ካዛንቺስ", nameEn: "Kazanchis", count: 47, time: "13:45", lat: 9.0183, lng: 38.7668, featured: true },
  { id: "saris", nameAm: "ሳሪስ", nameEn: "Saris", count: 39, time: "16:15", lat: 8.9489, lng: 38.7643, featured: true },
  { id: "megenagna", nameAm: "መገናኛ", nameEn: "Megenagna", count: 55, time: "14:00", lat: 9.0192, lng: 38.8025, featured: true },
  { id: "cmc", nameAm: "CMC", nameEn: "CMC", count: 28, time: "17:30", lat: 9.0258, lng: 38.8428, featured: true },
  { id: "gerji", nameAm: "ገርጂ", nameEn: "Gerji", count: 24, time: "15:45", lat: 8.9951, lng: 38.8248, featured: true },
  { id: "four-kilo", nameAm: "4 ኪሎ", nameEn: "4 Kilo", lat: 9.034, lng: 38.763 },
  { id: "six-kilo", nameAm: "6 ኪሎ", nameEn: "6 Kilo", lat: 9.045, lng: 38.759 },
  { id: "mercato", nameAm: "መርካቶ", nameEn: "Mercato", lat: 9.032, lng: 38.734 },
  { id: "addis-ketema", nameAm: "አዲስ ከተማ", nameEn: "Addis Ketema", lat: 9.04, lng: 38.7245 },
  { id: "lideta", nameAm: "ልደታ", nameEn: "Lideta", lat: 9.01, lng: 38.738 },
  { id: "mexico", nameAm: "ሜክሲኮ", nameEn: "Mexico", lat: 9.0108, lng: 38.746 },
  { id: "kirkos", nameAm: "ቂርቆስ", nameEn: "Kirkos", lat: 9.003, lng: 38.756 },
  { id: "meskel-square", nameAm: "መስቀል አደባባይ", nameEn: "Meskel Square", lat: 9.0105, lng: 38.761 },
  { id: "kera", nameAm: "ቄራ", nameEn: "Kera", lat: 8.993, lng: 38.748 },
  { id: "gotera", nameAm: "ጎተራ", nameEn: "Gotera", lat: 8.974, lng: 38.765 },
  { id: "wello-sefer", nameAm: "ወሎ ሰፈር", nameEn: "Wello Sefer", lat: 8.983, lng: 38.772 },
  { id: "atlas", nameAm: "አትላስ", nameEn: "Atlas", lat: 9.0058, lng: 38.781 },
  { id: "hayahulet", nameAm: "22 ማዞሪያ", nameEn: "Hayahulet", lat: 9.015, lng: 38.791 },
  { id: "gurd-shola", nameAm: "ጉርድ ሾላ", nameEn: "Gurd Shola", lat: 9.028, lng: 38.816 },
  { id: "lamberet", nameAm: "ላምበረት", nameEn: "Lamberet", lat: 9.041, lng: 38.812 },
  { id: "kotebe", nameAm: "ኮተቤ", nameEn: "Kotebe", lat: 9.052, lng: 38.831 },
  { id: "summit", nameAm: "ሰሚት", nameEn: "Summit", lat: 9.017, lng: 38.871 },
  { id: "ayat", nameAm: "አያት", nameEn: "Ayat", lat: 9.032, lng: 38.885 },
  { id: "yeka-abado", nameAm: "የካ አባዶ", nameEn: "Yeka Abado", lat: 9.067, lng: 38.883 },
  { id: "jacros", nameAm: "ጃክሮስ", nameEn: "Jacros", lat: 9.002, lng: 38.832 },
  { id: "bole-rwanda", nameAm: "ቦሌ ሩዋንዳ", nameEn: "Bole Rwanda", lat: 8.992, lng: 38.781 },
  { id: "bole-bulbula", nameAm: "ቦሌ ቡልቡላ", nameEn: "Bole Bulbula", lat: 8.956, lng: 38.783 },
  { id: "old-airport", nameAm: "ኦልድ ኤርፖርት", nameEn: "Old Airport", lat: 8.989, lng: 38.725 },
  { id: "tor-hailoch", nameAm: "ጦር ኃይሎች", nameEn: "Tor Hailoch", lat: 9.0, lng: 38.716 },
  { id: "bisrate-gabriel", nameAm: "ብስራተ ገብርኤል", nameEn: "Bisrate Gabriel", lat: 8.985, lng: 38.732 },
  { id: "sar-bet", nameAm: "ሳር ቤት", nameEn: "Sar Bet", lat: 8.997, lng: 38.725 },
  { id: "lafto", nameAm: "ላፍቶ", nameEn: "Lafto", lat: 8.97, lng: 38.719 },
  { id: "mekanisa", nameAm: "መካኒሳ", nameEn: "Mekanisa", lat: 8.968, lng: 38.706 },
  { id: "lebu", nameAm: "ለቡ", nameEn: "Lebu", lat: 8.938, lng: 38.721 },
  { id: "jemo", nameAm: "ጀሞ", nameEn: "Jemo", lat: 8.944, lng: 38.694 },
  { id: "gofa", nameAm: "ጎፋ", nameEn: "Gofa", lat: 8.958, lng: 38.735 },
  { id: "saris-abo", nameAm: "ሳሪስ አቦ", nameEn: "Saris Abo", lat: 8.943, lng: 38.754 },
  { id: "kality", nameAm: "ቃሊቲ", nameEn: "Kality", lat: 8.915, lng: 38.757 },
  { id: "akaki", nameAm: "አቃቂ", nameEn: "Akaki", lat: 8.886, lng: 38.785 },
  { id: "ayer-tena", nameAm: "አየር ጤና", nameEn: "Ayer Tena", lat: 9.006, lng: 38.684 },
  { id: "bethel", nameAm: "ቤቴል", nameEn: "Bethel", lat: 9.017, lng: 38.69 },
  { id: "kolfe", nameAm: "ኮልፌ", nameEn: "Kolfe", lat: 9.026, lng: 38.692 },
  { id: "asko", nameAm: "አስኮ", nameEn: "Asko", lat: 9.067, lng: 38.709 },
  { id: "wingate", nameAm: "ዊንጌት", nameEn: "Wingate", lat: 9.057, lng: 38.729 },
  { id: "gulele", nameAm: "ጉለሌ", nameEn: "Gulele", lat: 9.057, lng: 38.748 },
  { id: "shiro-meda", nameAm: "ሽሮ ሜዳ", nameEn: "Shiro Meda", lat: 9.072, lng: 38.769 },
  { id: "kebena", nameAm: "ቀበና", nameEn: "Kebena", lat: 9.044, lng: 38.786 },
  { id: "ferensay-legasion", nameAm: "ፈረንሳይ ለጋሲዮን", nameEn: "Ferensay Legasion", lat: 9.057, lng: 38.797 },
  { id: "meri", nameAm: "መሪ", nameEn: "Meri", lat: 9.008, lng: 38.856 },
  { id: "tulu-dimtu", nameAm: "ቱሉ ዲምቱ", nameEn: "Tulu Dimtu", lat: 8.909, lng: 38.804 },
];

const availableTimes = ["13:45", "14:00", "14:30", "15:00", "15:45", "16:15", "17:30"];

export const addisAreas: readonly AddisArea[] = areaSeeds.map((area, index) => ({
  ...area,
  count: area.count ?? 18 + ((index * 17) % 57),
  time: area.time ?? availableTimes[index % availableTimes.length],
  featured: area.featured ?? false,
}));

const salonProfiles = [
  {
    id: "beauty",
    nameAm: "ማራኪ ቢዩቲ ላውንጅ",
    nameEn: "Maraki Beauty Lounge",
    typeAm: "የውበት ሳሎን",
    typeEn: "Hair salon",
    image: demoSalonImages.naturalHair,
    basePrice: 450,
  },
  {
    id: "barber",
    nameAm: "አዲስ ባርበር ስቱዲዮ",
    nameEn: "Addis Barber Studio",
    typeAm: "የወንዶች ፀጉር ቤት",
    typeEn: "Barbershop",
    image: demoSalonImages.barber,
    basePrice: 280,
  },
  {
    id: "nails",
    nameAm: "ሴና ኔይል እና ስፓ",
    nameEn: "Sena Nail & Spa",
    typeAm: "የጥፍር እና ስፓ አገልግሎት",
    typeEn: "Nails & spa",
    image: demoSalonImages.nails,
    basePrice: 360,
  },
] as const;

export function getAreaSalons(area: AddisArea, language: "am" | "en"): AreaSalon[] {
  const areaIndex = addisAreas.findIndex((item) => item.id === area.id);
  const ratings = ["4.9", "4.8", "4.7", "4.6"];

  return salonProfiles.map((profile, profileIndex) => {
    const price = profile.basePrice + ((areaIndex + profileIndex) % 4) * 25;
    return {
      id: `${area.id}-${profile.id}`,
      name: language === "am" ? `${area.nameAm} · ${profile.nameAm}` : `${area.nameEn} ${profile.nameEn}`,
      type: language === "am" ? profile.typeAm : profile.typeEn,
      rating: ratings[(areaIndex + profileIndex) % ratings.length],
      price: language === "am" ? `ከ ${price} ብር` : `from ${price} birr`,
      image: profile.image,
      time: availableTimes[(areaIndex + profileIndex * 2) % availableTimes.length],
    };
  });
}

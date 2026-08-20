import { demoSalonImages } from "./data";

export type AddisArea = {
  id: string;
  name: string;
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
  { id: "bole", name: "Bole", count: 84, time: "14:30", lat: 8.9806, lng: 38.7895, featured: true },
  { id: "piassa", name: "Piassa", count: 62, time: "15:00", lat: 9.0365, lng: 38.7523, featured: true },
  { id: "kazanchis", name: "Kazanchis", count: 47, time: "13:45", lat: 9.0183, lng: 38.7668, featured: true },
  { id: "saris", name: "Saris", count: 39, time: "16:15", lat: 8.9489, lng: 38.7643, featured: true },
  { id: "megenagna", name: "Megenagna", count: 55, time: "14:00", lat: 9.0192, lng: 38.8025, featured: true },
  { id: "cmc", name: "CMC", count: 28, time: "17:30", lat: 9.0258, lng: 38.8428, featured: true },
  { id: "gerji", name: "Gerji", count: 24, time: "15:45", lat: 8.9951, lng: 38.8248, featured: true },
  { id: "four-kilo", name: "4 Kilo", lat: 9.034, lng: 38.763 },
  { id: "six-kilo", name: "6 Kilo", lat: 9.045, lng: 38.759 },
  { id: "mercato", name: "Mercato", lat: 9.032, lng: 38.734 },
  { id: "addis-ketema", name: "Addis Ketema", lat: 9.04, lng: 38.7245 },
  { id: "lideta", name: "Lideta", lat: 9.01, lng: 38.738 },
  { id: "mexico", name: "Mexico", lat: 9.0108, lng: 38.746 },
  { id: "kirkos", name: "Kirkos", lat: 9.003, lng: 38.756 },
  { id: "meskel-square", name: "Meskel Square", lat: 9.0105, lng: 38.761 },
  { id: "kera", name: "Kera", lat: 8.993, lng: 38.748 },
  { id: "gotera", name: "Gotera", lat: 8.974, lng: 38.765 },
  { id: "wello-sefer", name: "Wello Sefer", lat: 8.983, lng: 38.772 },
  { id: "atlas", name: "Atlas", lat: 9.0058, lng: 38.781 },
  { id: "hayahulet", name: "Hayahulet", lat: 9.015, lng: 38.791 },
  { id: "gurd-shola", name: "Gurd Shola", lat: 9.028, lng: 38.816 },
  { id: "lamberet", name: "Lamberet", lat: 9.041, lng: 38.812 },
  { id: "kotebe", name: "Kotebe", lat: 9.052, lng: 38.831 },
  { id: "summit", name: "Summit", lat: 9.017, lng: 38.871 },
  { id: "ayat", name: "Ayat", lat: 9.032, lng: 38.885 },
  { id: "yeka-abado", name: "Yeka Abado", lat: 9.067, lng: 38.883 },
  { id: "jacros", name: "Jacros", lat: 9.002, lng: 38.832 },
  { id: "bole-rwanda", name: "Bole Rwanda", lat: 8.992, lng: 38.781 },
  { id: "bole-bulbula", name: "Bole Bulbula", lat: 8.956, lng: 38.783 },
  { id: "old-airport", name: "Old Airport", lat: 8.989, lng: 38.725 },
  { id: "tor-hailoch", name: "Tor Hailoch", lat: 9.0, lng: 38.716 },
  { id: "bisrate-gabriel", name: "Bisrate Gabriel", lat: 8.985, lng: 38.732 },
  { id: "sar-bet", name: "Sar Bet", lat: 8.997, lng: 38.725 },
  { id: "lafto", name: "Lafto", lat: 8.97, lng: 38.719 },
  { id: "mekanisa", name: "Mekanisa", lat: 8.968, lng: 38.706 },
  { id: "lebu", name: "Lebu", lat: 8.938, lng: 38.721 },
  { id: "jemo", name: "Jemo", lat: 8.944, lng: 38.694 },
  { id: "gofa", name: "Gofa", lat: 8.958, lng: 38.735 },
  { id: "saris-abo", name: "Saris Abo", lat: 8.943, lng: 38.754 },
  { id: "kality", name: "Kality", lat: 8.915, lng: 38.757 },
  { id: "akaki", name: "Akaki", lat: 8.886, lng: 38.785 },
  { id: "ayer-tena", name: "Ayer Tena", lat: 9.006, lng: 38.684 },
  { id: "bethel", name: "Bethel", lat: 9.017, lng: 38.69 },
  { id: "kolfe", name: "Kolfe", lat: 9.026, lng: 38.692 },
  { id: "asko", name: "Asko", lat: 9.067, lng: 38.709 },
  { id: "wingate", name: "Wingate", lat: 9.057, lng: 38.729 },
  { id: "gulele", name: "Gulele", lat: 9.057, lng: 38.748 },
  { id: "shiro-meda", name: "Shiro Meda", lat: 9.072, lng: 38.769 },
  { id: "kebena", name: "Kebena", lat: 9.044, lng: 38.786 },
  { id: "ferensay-legasion", name: "Ferensay Legasion", lat: 9.057, lng: 38.797 },
  { id: "meri", name: "Meri", lat: 9.008, lng: 38.856 },
  { id: "tulu-dimtu", name: "Tulu Dimtu", lat: 8.909, lng: 38.804 },
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
    name: "Maraki Beauty Lounge",
    type: "Hair salon",
    image: demoSalonImages.naturalHair,
    basePrice: 450,
  },
  {
    id: "barber",
    name: "Addis Barber Studio",
    type: "Barbershop",
    image: demoSalonImages.barber,
    basePrice: 280,
  },
  {
    id: "nails",
    name: "Sena Nail & Spa",
    type: "Nails & spa",
    image: demoSalonImages.nails,
    basePrice: 360,
  },
] as const;

export function getAreaSalons(area: AddisArea): AreaSalon[] {
  const areaIndex = addisAreas.findIndex((item) => item.id === area.id);
  const ratings = ["4.9", "4.8", "4.7", "4.6"];

  return salonProfiles.map((profile, profileIndex) => {
    const price = profile.basePrice + ((areaIndex + profileIndex) % 4) * 25;
    return {
      id: `${area.id}-${profile.id}`,
      name: `${area.name} ${profile.name}`,
      type: profile.type,
      rating: ratings[(areaIndex + profileIndex) % ratings.length],
      price: `from ${price} birr`,
      image: profile.image,
      time: availableTimes[(areaIndex + profileIndex * 2) % availableTimes.length],
    };
  });
}

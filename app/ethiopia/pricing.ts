export const ethiopiaPlans = [
  {
    id: "business",
    index: "01",
    name: "Business",
    price: "0",
    setupFee: "No start-up fee",
    description: "A clean digital home for businesses getting ready to be discovered.",
    features: ["Simple website", "Marketplace", "Business Hub"],
    featured: false,
  },
  {
    id: "starter",
    index: "02",
    name: "Starter",
    price: "2,500",
    setupFee: "No start-up fee",
    description: "Start taking appointments with one focused booking calendar.",
    features: ["Simple website", "Marketplace", "Business Hub", "1 booking calendar"],
    featured: false,
  },
  {
    id: "plus",
    index: "03",
    name: "Plus",
    price: "4,000",
    setupFee: "2,000 ETB starting fee",
    description: "More calendars for a growing team, without adding complexity.",
    features: ["Simple website", "Marketplace", "Business Hub", "Up to 10 booking calendars"],
    featured: true,
  },
  {
    id: "elite",
    index: "04",
    name: "Elite",
    price: "6,000",
    setupFee: "5,000 ETB starting fee",
    description: "A customized web presence for established, ambitious businesses.",
    features: ["Simple website", "Marketplace", "Business Hub", "Up to 10 booking calendars", "Customized website"],
    featured: false,
  },
] as const;

export const starterPlan = ethiopiaPlans[1];

export const ethiopiaPricingSummary =
  "Choose Business at 0 ETB, Starter at 2,500 ETB, Plus at 4,000 ETB or Elite at 6,000 ETB per month. We can help you find the right fit.";

export type CalendarAppointment = {
  name: string;
  service: string;
  time: string;
  tone: "violet" | "coral" | "blue" | "green";
};

const times = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"];
const occupancy = [2, 0, 1, 3, 2, 1, 0, 2, 3, 1];

const clients = ["Mimi Tesfaye", "Sara Alemu", "Liya Bekele", "Ruth Daniel", "Eden Kassahun", "Betty Girma", "Hana Tadesse", "Nahom Elias"];
const services = ["Hair styling", "Hair colour", "Nail care", "Facial", "Barber cut", "Massage"];

const tones: CalendarAppointment["tone"][] = ["violet", "coral", "blue", "green"];

export function calendarAppointments(day: number, month: number): CalendarAppointment[] {
  const count = occupancy[(day * 7 + month * 3) % occupancy.length];
  const firstTime = (day + month) % 3;

  return Array.from({ length: count }, (_, index) => ({
    name: clients[(day * 2 + month + index * 3) % clients.length],
    service: services[(day + month * 2 + index) % services.length],
    time: times[Math.min(firstTime + index * 2, times.length - 1)],
    tone: tones[(day + month + index) % tones.length],
  }));
}

export function clientInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("");
}

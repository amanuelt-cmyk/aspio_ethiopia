import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aspio Ethiopia | Booking for Salons and Barbershops",
  description: "Online booking, websites and business tools built for salons and barbershops in Ethiopia.",
  icons: { icon: [{ url: "/aspio-favicon.png", type: "image/png", sizes: "512x512" }] },
};

export default function EthiopiaSiteLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

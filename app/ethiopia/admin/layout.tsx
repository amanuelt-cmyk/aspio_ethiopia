import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Aspio Ethiopia Admin",
  description: "Private operations dashboard for Aspio Ethiopia.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}

"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { navigation } from "./data";

export default function EthiopiaLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/ethiopia/admin" || pathname.startsWith("/ethiopia/admin/");

  if (isAdmin) return <>{children}</>;

  return (
    <div className="am-shell" lang="en">
      <div className="am-ambient am-ambient-one" aria-hidden="true" />
      <div className="am-ambient am-ambient-two" aria-hidden="true" />

      <header className="am-header">
        <Link className="am-brand" href="/ethiopia" aria-label="Aspio Ethiopia">
          <img src="/assets/aspio-logo.png" alt="Aspio" />
        </Link>
        <nav className="am-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div className="am-actions">
          <Link className="am-cta" href="/ethiopia/register">
            Book a demo<span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      {children}

      <footer className="am-footer">
        <div>
          <Link className="am-brand" href="/ethiopia"><img src="/assets/aspio-logo.png" alt="Aspio" /></Link>
          <p>Simple booking. Better business.</p>
        </div>
        <nav aria-label="Footer">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <small>© 2026 Aspio Ethiopia</small>
      </footer>
    </div>
  );
}

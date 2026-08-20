import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const legacySections = ["business", "contact", "discover", "how-it-works", "register"];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/ethiopia/am", destination: "/ethiopia", permanent: false },
      { source: "/ethiopia/am/:path*", destination: "/ethiopia/en/:path*", permanent: false },
      ...legacySections.flatMap((section) => [
        { source: `/ethiopia/${section}`, destination: `/ethiopia/en/${section}`, permanent: false },
        { source: `/ethiopia/${section}/:path*`, destination: `/ethiopia/en/${section}/:path*`, permanent: false },
      ]),
    ];
  },
};

export default nextConfig;

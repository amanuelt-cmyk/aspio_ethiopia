const legacyAmharicSections = ["business", "contact", "discover", "how-it-works", "register"];

export function englishOnlyPath(pathname: string) {
  if (pathname === "/ethiopia/am") return "/ethiopia";
  if (pathname.startsWith("/ethiopia/am/")) return pathname.replace(/^\/ethiopia\/am/, "/ethiopia/en");

  const isLegacyAmharicRoute = legacyAmharicSections.some(
    (section) => pathname === `/ethiopia/${section}` || pathname.startsWith(`/ethiopia/${section}/`),
  );
  return isLegacyAmharicRoute ? pathname.replace(/^\/ethiopia/, "/ethiopia/en") : null;
}

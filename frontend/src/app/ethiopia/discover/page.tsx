"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import { demoPlaces } from "../data";
import { useBackendSalons } from "../useBackendSalons";

const filters = ["All", "Salons", "Barbers", "Spas"];

export default function EthiopiaDiscoverPage() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const marketplacePlaces = useBackendSalons(demoPlaces);

  const filtered = useMemo(() => {
    const byType = filter === "All"
      ? marketplacePlaces
      : marketplacePlaces.filter((place) => filter === "Barbers" ? place.type === "Barbershop" : filter === "Salons" ? place.type === "Hair salon" : place.type.toLowerCase().includes("spa"));
    if (!query.trim()) return byType;
    const normalizedQuery = query.trim().toLowerCase();
    return byType.filter((place) => `${place.name} ${place.area} ${place.type}`.toLowerCase().includes(normalizedQuery));
  }, [filter, marketplacePlaces, query]);

  return (
    <section className="am-page am-discover">
      <div className="am-page-head">
        <p>ASPIO MARKETPLACE</p>
        <h1>Find your next favourite place.</h1>
        <span>Verified professionals, transparent prices and appointment times you can see immediately.</span>
      </div>

      <div className="am-search">
        <span aria-hidden="true">⌕</span>
        <input aria-label="Search" placeholder="Salon, service or neighbourhood..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" onClick={() => setQuery("")}>{query ? "Clear" : "Search"}</button>
      </div>

      <div className="am-filters" role="tablist" aria-label="Marketplace filters">
        {filters.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={filter === item} className={filter === item ? "on" : ""} onClick={() => setFilter(item)}>{item}</button>
        ))}
        <span className="am-count">{filtered.length} results</span>
      </div>

      <div className="am-grid">
        {filtered.map((place) => (
          <Link className="am-card" key={place.id ?? place.name} href="https://app.aspio.io/">
            <div className="am-card-image">
              <img src={place.image} alt="" />
              <span className="am-card-tag">{place.tag}</span>
              <span className="am-card-heart" aria-hidden="true">↗</span>
            </div>
            <div className="am-card-body">
              <div className="am-card-rating">{place.rating} / 5</div>
              <p>{place.type}</p><h3>{place.name}</h3><small>⌖ {place.area}</small>
              <footer><b>{place.price}</b><span>View place <i aria-hidden="true">→</i></span></footer>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && <div className="am-empty"><b>No results found.</b><p>Try another area or service.</p></div>}
    </section>
  );
}

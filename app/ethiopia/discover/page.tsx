"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import { places } from "../data";
import { useBackendSalons } from "../useBackendSalons";

const filters = ["ሁሉም", "ሳሎን", "ባርበር", "ስፓ"];

export default function EthiopiaV3Discover() {
  const [filter, setFilter] = useState("ሁሉም");
  const [query, setQuery] = useState("");
  const marketplacePlaces = useBackendSalons("am", places);

  const filtered = useMemo(() => {
    const byType = filter === "ሁሉም"
      ? marketplacePlaces
      : marketplacePlaces.filter((p) => filter === "ባርበር" ? p.type.includes("ወንዶች") : filter === "ሳሎን" ? p.type.includes("ሳሎን") : p.type.includes("ስፓ"));
    if (!query.trim()) return byType;
    const q = query.trim().toLowerCase();
    return byType.filter((p) => p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }, [filter, marketplacePlaces, query]);

  return (
    <section className="am-page am-discover">
      <div className="am-page-head">
        <p>የአስፒዮ ማርኬትፕሌስ</p>
        <h1>ቀጣዩን ተወዳጅ ቦታዎን ያግኙ።</h1>
        <span>የተረጋገጡ ባለሙያዎች፣ ግልጽ ዋጋ እና በቀጥታ የሚታዩ ክፍት ሰዓቶች።</span>
      </div>

      <div className="am-search">
        <span aria-hidden="true">⌕</span>
        <input
          aria-label="ፈልግ"
          placeholder="ሳሎን፣ አገልግሎት ወይም አካባቢ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" onClick={() => setQuery("")}>{query ? "አጽዳ" : "ፈልግ"}</button>
      </div>

      <div className="am-filters" role="tablist" aria-label="ማጣሪያ">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            className={filter === f ? "on" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <span className="am-count">{filtered.length} ውጤት</span>
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
              <p>{place.type}</p>
              <h3>{place.name}</h3>
              <small>⌖ {place.area}</small>
              <footer>
                <b>{place.price}</b>
                <span>ቦታውን ይመልከቱ <i aria-hidden="true">→</i></span>
              </footer>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="am-empty">
          <b>ምንም ውጤት አልተገኘም።</b>
          <p>ሌላ አካባቢ ወይም አገልግሎት ይሞክሩ።</p>
        </div>
      )}
    </section>
  );
}

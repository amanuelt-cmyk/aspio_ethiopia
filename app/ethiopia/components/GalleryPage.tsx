"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type GalleryItem = {
  id: string;
  kind: "image" | "video";
  url: string;
  originalName: string;
  title: string;
  caption: string;
};

const GALLERY_API_BASE = process.env.NEXT_PUBLIC_ASPIO_API_URL?.replace(/\/$/, "") ?? "";

function mediaURL(value: string, baseURL: string) {
  return value.startsWith("/uploads/") ? `${baseURL}${value}` : value;
}

export default function GalleryPage({ language }: { language: "am" | "en" }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(Boolean(GALLERY_API_BASE));
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const amharic = language === "am";

  useEffect(() => {
    if (!GALLERY_API_BASE) return;
    const controller = new AbortController();
    fetch(`${GALLERY_API_BASE}/api/v1/gallery?locale=${language}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Gallery API returned ${response.status}`);
        return response.json() as Promise<{ items?: GalleryItem[] }>;
      })
      .then((response) => setItems((response.items ?? []).map((item) => ({ ...item, url: mediaURL(item.url, GALLERY_API_BASE) }))))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) console.warn("The gallery is temporarily unavailable.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [language]);

  const images = useMemo(() => items.filter((item) => item.kind === "image"), [items]);
  const videos = useMemo(() => items.filter((item) => item.kind === "video"), [items]);
  const activeIndex = images.findIndex((item) => item.id === selectedImage);
  const activeImage = activeIndex >= 0 ? images[activeIndex] : null;

  function moveLightbox(direction: number) {
    if (!images.length || activeIndex < 0) return;
    setSelectedImage(images[(activeIndex + direction + images.length) % images.length].id);
  }

  return (
    <main className="eg-page">
      <section className="eg-hero">
        <div className="eg-hero-copy">
          <p><span />{amharic ? "የአስፒዮ ጋለሪ" : "THE ASPIO GALLERY"}</p>
          <h1>{amharic ? <>ከተማዋ።<br /><em>በእኛ እይታ።</em></> : <>Salons and Barbershops<br /><em>Across Addis Ababa</em></>}</h1>
          <span>{amharic ? "ከአዲስ አበባ ራሳቸውን ድራሻ ከሚጽፉ የውበት እና የፈጠራ ቦታዎች የተወሰዱ ታሪኮች።" : "Real photos and videos from the salons and barbershops booking with Aspio."}</span>
        </div>
        <div className="eg-hero-index" aria-label={amharic ? "የጋለሪ ክፍሎች" : "Gallery sections"}>
          <a href="#images"><small>01</small><b>{amharic ? "ምስሎች" : "Images"}</b><i>{String(images.length).padStart(2, "0")}</i></a>
          <a href="#videos"><small>02</small><b>{amharic ? "ቪዲዮዎች" : "Films"}</b><i>{String(videos.length).padStart(2, "0")}</i></a>
        </div>
        <div className="eg-hero-word" aria-hidden="true">ADDIS</div>
      </section>

      <section className="eg-images" id="images">
        <header>
          <div><span>01 / {amharic ? "ምስሎች" : "IMAGES"}</span><h2>{amharic ? "ከተማዋን ያጠራቀሙ ትዕይንቶች።" : "From our community"}</h2></div>
          <p>{amharic ? "እያንዳንዱ ምስል ከቦታው፣ ከእጅ ስራው እና ከልምዱ ታሪክ ይዟል።" : "Photos from the salons and barbershops using Aspio every day."}</p>
        </header>
        {loading ? <GalleryLoading /> : images.length ? (
          <div className="eg-image-wall">
            {images.map((item, index) => (
              <button key={item.id} type="button" className={`eg-image eg-image-${index % 7}`} onClick={() => setSelectedImage(item.id)}>
                <img src={item.url} alt={item.title || item.caption || "Aspio gallery"} />
                <span><small>{String(index + 1).padStart(2, "0")}</small><b>{item.title || (amharic ? "የአስፒዮ ታሪክ" : "Aspio story")}</b><i>↗</i></span>
              </button>
            ))}
          </div>
        ) : <GalleryEmpty language={language} kind="image" />}
      </section>

      <section className="eg-videos" id="videos">
        <header>
          <div><span>02 / {amharic ? "ቪዲዮዎች" : "FILMS"}</span><h2>{amharic ? "ታሪኮችን በንቅናቄ።" : "Videos from our community"}</h2></div>
          <p>{amharic ? "የስራ እንቅስቃሴውን፣ የቦታውን ሙዚቃ እና የተለየ አበራውን ይመልከቱ።" : "See what a day on Aspio actually looks like."}</p>
        </header>
        {loading ? <GalleryLoading dark /> : videos.length ? (
          <div className="eg-film-grid">
            {videos.map((item, index) => (
              <article className="eg-film" key={item.id}>
                <div><video src={item.url} controls preload="metadata" playsInline /></div>
                <footer><small>FILM {String(index + 1).padStart(2, "0")}</small><b>{item.title || item.originalName}</b>{item.caption && <p>{item.caption}</p>}</footer>
              </article>
            ))}
          </div>
        ) : <GalleryEmpty language={language} kind="video" dark />}
      </section>

      <section className="eg-cta">
        <p>{amharic ? "የአስፒዮ ማህበረሰብ" : "THE ASPIO COMMUNITY"}</p>
        <h2>{amharic ? "የሚበለጽገው ታሪክ የእርስዎ ሊሆን ይችላል።" : "Want to be featured here too?"}</h2>
        <Link className="am-btn am-btn-primary" href={amharic ? "/ethiopia/am/register" : "/ethiopia/en/register"}>{amharic ? "ማሳያ ይያዙ" : "Book a demo"}<span>↗</span></Link>
      </section>

      {activeImage && (
        <div className="eg-lightbox" role="dialog" aria-modal="true" aria-label={activeImage.title || "Image preview"}>
          <button className="eg-lightbox-close" type="button" onClick={() => setSelectedImage(null)} aria-label="Close">×</button>
          <button className="eg-lightbox-arrow previous" type="button" onClick={() => moveLightbox(-1)} aria-label="Previous image">←</button>
          <figure><img src={activeImage.url} alt={activeImage.title || activeImage.caption || "Aspio gallery"} /><figcaption><small>{String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</small><b>{activeImage.title}</b>{activeImage.caption && <p>{activeImage.caption}</p>}</figcaption></figure>
          <button className="eg-lightbox-arrow next" type="button" onClick={() => moveLightbox(1)} aria-label="Next image">→</button>
        </div>
      )}
    </main>
  );
}

function GalleryLoading({ dark = false }: { dark?: boolean }) {
  return <div className={`eg-gallery-state${dark ? " dark" : ""}`}><i /><span>Loading collection...</span></div>;
}

function GalleryEmpty({ language, kind, dark = false }: { language: "am" | "en"; kind: "image" | "video"; dark?: boolean }) {
  const amharic = language === "am";
  return <div className={`eg-gallery-state empty${dark ? " dark" : ""}`}><b>{kind === "image" ? "01" : "02"}</b><h3>{amharic ? "አዲስ ታሪኮች በቅርብ ይመጣሉ።" : "New stories are coming soon."}</h3><p>{amharic ? "ይህ ስብስብ በአስፒዮ ቴም እየተዘጋጀ ነው።" : "The Aspio team is curating this collection."}</p></div>;
}

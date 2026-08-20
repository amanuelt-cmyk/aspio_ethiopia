"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl, API_BASE_URL, mediaUrl } from "@/lib/api/config";

type GalleryItem = {
  id: string;
  kind: "image" | "video";
  url: string;
  originalName: string;
  title: string;
  caption: string;
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(Boolean(API_BASE_URL));
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!API_BASE_URL) return;
    const controller = new AbortController();
    fetch(apiUrl("/api/v1/gallery?locale=en"), { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Gallery API returned ${response.status}`);
        return response.json() as Promise<{ items?: GalleryItem[] }>;
      })
      .then((response) => setItems((response.items ?? []).map((item) => ({ ...item, url: mediaUrl(item.url) }))))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) console.warn("The gallery is temporarily unavailable.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

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
          <p><span />THE ASPIO GALLERY</p>
          <h1>Salons and Barbershops<br /><em>Across Addis Ababa</em></h1>
          <span>Real photos and videos from the salons and barbershops booking with Aspio.</span>
        </div>
        <div className="eg-hero-index" aria-label="Gallery sections">
          <a href="#images"><small>01</small><b>Images</b><i>{String(images.length).padStart(2, "0")}</i></a>
          <a href="#videos"><small>02</small><b>Films</b><i>{String(videos.length).padStart(2, "0")}</i></a>
        </div>
        <div className="eg-hero-word" aria-hidden="true">ADDIS</div>
      </section>

      <section className="eg-images" id="images">
        <header>
          <div><span>01 / IMAGES</span><h2>From our community</h2></div>
          <p>Photos from the salons and barbershops using Aspio every day.</p>
        </header>
        {loading ? <GalleryLoading /> : images.length ? (
          <div className="eg-image-wall">
            {images.map((item, index) => (
              <button key={item.id} type="button" className={`eg-image eg-image-${index % 7}`} onClick={() => setSelectedImage(item.id)}>
                <img src={item.url} alt={item.title || item.caption || "Aspio gallery"} />
                <span><small>{String(index + 1).padStart(2, "0")}</small><b>{item.title || "Aspio story"}</b><i>↗</i></span>
              </button>
            ))}
          </div>
        ) : <GalleryEmpty kind="image" />}
      </section>

      <section className="eg-videos" id="videos">
        <header>
          <div><span>02 / FILMS</span><h2>Videos from our community</h2></div>
          <p>See what a day on Aspio actually looks like.</p>
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
        ) : <GalleryEmpty kind="video" dark />}
      </section>

      <section className="eg-cta">
        <p>THE ASPIO COMMUNITY</p>
        <h2>Want to be featured here too?</h2>
        <Link className="am-btn am-btn-primary" href="/ethiopia/register">Book a demo<span>↗</span></Link>
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

function GalleryEmpty({ kind, dark = false }: { kind: "image" | "video"; dark?: boolean }) {
  return <div className={`eg-gallery-state empty${dark ? " dark" : ""}`}><b>{kind === "image" ? "01" : "02"}</b><h3>New stories are coming soon.</h3><p>The Aspio team is curating this collection.</p></div>;
}

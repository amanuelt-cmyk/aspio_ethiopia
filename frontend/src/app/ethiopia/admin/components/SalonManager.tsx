"use client";
/* eslint-disable @next/next/no-img-element */

import { Component, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { mediaUrl } from "@/lib/api/config";
import { demoImageForSalon } from "../../data";
import { AdminApiError } from "../api";
import type { PublishStatus, Salon, SalonCategory, SalonDraft, SalonMedia } from "../types";
import type { ManagerContext } from "./AdminApp";
import Icon from "./Icon";

const categories: { value: SalonCategory; label: string }[] = [
  { value: "salon", label: "Hair salon" }, { value: "barbershop", label: "Barbershop" },
  { value: "spa", label: "Spa" }, { value: "nails", label: "Nails" },
  { value: "wellness", label: "Wellness" }, { value: "other", label: "Other" },
];

const emptySalon: SalonDraft = {
  slug: "", status: "draft", category: "salon", nameAm: "", nameEn: "", descriptionAm: "", descriptionEn: "",
  areaAm: "", areaEn: "", address: "", googleMapsUrl: "", latitude: "", longitude: "", phone: "", email: "",
  websiteUrl: "", bookingUrl: "", imageUrl: "/assets/et-salon-natural-hair.png", priceFromEtb: "", rating: "", reviewCount: "0",
  tagAm: "", tagEn: "", openingHours: "{}", amenities: "", sortOrder: "0",
};

function toDraft(salon: Salon): SalonDraft {
  return {
    id: salon.id, slug: salon.slug, status: salon.status, category: salon.category, nameAm: salon.nameAm, nameEn: salon.nameEn,
    descriptionAm: salon.descriptionAm, descriptionEn: salon.descriptionEn, areaAm: salon.areaAm, areaEn: salon.areaEn,
    address: salon.address, googleMapsUrl: salon.googleMapsUrl ?? "", latitude: String(salon.latitude), longitude: String(salon.longitude), phone: salon.phone, email: salon.email,
    websiteUrl: salon.websiteUrl, bookingUrl: salon.bookingUrl, imageUrl: salon.imageUrl, priceFromEtb: salon.priceFromEtb == null ? "" : String(salon.priceFromEtb),
    rating: salon.rating == null ? "" : String(salon.rating), reviewCount: String(salon.reviewCount), tagAm: salon.tagAm, tagEn: salon.tagEn,
    openingHours: JSON.stringify(salon.openingHours ?? {}, null, 2), amenities: (salon.amenities ?? []).join(", "), sortOrder: String(salon.sortOrder),
  };
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function openingHoursFrom(value: string) {
  try { return JSON.parse(value || "{}") as Record<string, unknown>; }
  catch { return {}; }
}

function openingHoursSummary(value: string) {
  const hours = openingHoursFrom(value);
  const summary = hours.summary ?? hours.hours;
  return typeof summary === "string" ? summary : "";
}

function salonCover(salon: Salon) {
  return demoImageForSalon(salon.slug, salon.category, mediaUrl(salon.imageUrl));
}

class MediaBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: "" };
  static getDerivedStateFromError(error: unknown) { return { error: error instanceof Error ? error.message : "The media panel could not be displayed." }; }
  componentDidCatch(error: unknown) { console.error("Salon media panel failed", error); }
  render() {
    if (this.state.error) return <div className="et-media-crash" role="alert"><b>The form is still safe.</b><p>The media panel hit a display problem. Your uploaded files were not lost.</p><small>{this.state.error}</small><button type="button" onClick={() => this.setState({ error: "" })}>Reload media panel</button></div>;
    return this.props.children;
  }
}

function matchesMediaKind(file: File, kind: "image" | "video") {
  if (file.type.startsWith(`${kind}/`)) return true;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return kind === "image" ? ["jpg", "jpeg", "png", "webp", "gif"].includes(extension) : ["mp4", "webm", "mov"].includes(extension);
}

function SalonMediaPanel({ salonID, context }: { salonID: string; context: ManagerContext }) {
  const [items, setItems] = useState<SalonMedia[]>([]);
  const [photoDescription, setPhotoDescription] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [error, setError] = useState("");
  const [queue, setQueue] = useState<Array<{ id: string; name: string; kind: "image" | "video"; progress: number; status: "queued" | "uploading" | "done" | "error"; error?: string }>>([]);

  async function load() {
    const result = await context.request<{ items: SalonMedia[] }>(`/admin/salons/${salonID}/media`);
    setItems(result.items);
  }

  useEffect(() => {
    let active = true;
    context.request<{ items: SalonMedia[] }>(`/admin/salons/${salonID}/media`).then((result) => { if (active) setItems(result.items); }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load media."); });
    return () => { active = false; };
  }, [context, salonID]);

  function updateQueue(id: string, update: Partial<(typeof queue)[number]>) {
    setQueue((current) => current.map((item) => item.id === id ? { ...item, ...update } : item));
  }

  async function uploadOne(file: File, expectedKind: "image" | "video", description: string, replaceItem?: SalonMedia) {
    const id = crypto.randomUUID();
    setQueue((current) => [...current, { id, name: file.name, kind: expectedKind, progress: 0, status: "queued" }]);
    if (!matchesMediaKind(file, expectedKind)) {
      updateQueue(id, { status: "error", error: expectedKind === "image" ? "Not a supported image." : "Not a supported video." });
      return;
    }
    const maximum = expectedKind === "image" ? 15 << 20 : 150 << 20;
    if (file.size > maximum) {
      updateQueue(id, { status: "error", error: expectedKind === "image" ? "Photo exceeds 15 MB." : "Video exceeds 150 MB." });
      return;
    }
    updateQueue(id, { status: "uploading", progress: 1 });
    const body = new FormData();
    body.set("file", file);
    body.set("altText", description.trim() || file.name.replace(/\.[^.]+$/, ""));
    try {
      await context.upload<SalonMedia>(`/admin/salons/${salonID}/media`, body, (progress) => updateQueue(id, { progress }));
      if (replaceItem) await context.request(`/admin/salons/${salonID}/media/${replaceItem.id}`, { method: "DELETE" });
      updateQueue(id, { status: "done", progress: 100 });
    } catch (uploadError) {
      updateQueue(id, { status: "error", error: uploadError instanceof Error ? uploadError.message : "Upload failed." });
    }
  }

  async function uploadMany(event: ChangeEvent<HTMLInputElement>, expectedKind: "image" | "video") {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setError("");
    const description = expectedKind === "image" ? photoDescription : videoDescription;
    for (const file of files) await uploadOne(file, expectedKind, description);
    await load();
    if (expectedKind === "image") setPhotoDescription(""); else setVideoDescription("");
  }

  async function replace(event: ChangeEvent<HTMLInputElement>, item: SalonMedia) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadOne(file, item.kind, item.altText, item);
    await load();
  }

  async function remove(item: SalonMedia) {
    if (!window.confirm(`Remove ${item.originalName}?`)) return;
    try { await context.request(`/admin/salons/${salonID}/media/${item.id}`, { method: "DELETE" }); await load(); setError(""); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Could not remove media."); }
  }

  const photos = items.filter((item) => item.kind === "image");
  const videos = items.filter((item) => item.kind === "video");
  const working = queue.some((item) => item.status === "queued" || item.status === "uploading");
  const mediaCards = (collection: SalonMedia[]) => <div className="et-media-files">{collection.map((item) => <article key={item.id}><div className={`et-media-preview ${item.kind}`}>{item.kind === "video" ? <span><i>▶</i><small>{item.mimeType.replace("video/", "").toUpperCase()}</small></span> : <img src={mediaUrl(item.url)} alt={item.altText} loading="lazy" decoding="async" />}</div><div className="et-media-file-copy"><b>{item.originalName}</b><small>{item.altText || "No description"}</small><em>{(Number(item.sizeBytes || 0) / 1024 / 1024).toFixed(1)} MB</em></div><div className="et-media-file-actions">{item.kind === "video" && <a href={mediaUrl(item.url)} target="_blank" rel="noreferrer">Open</a>}<label><input type="file" accept={item.kind === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "video/mp4,video/webm,video/quicktime"} onChange={(event) => void replace(event, item)} disabled={working} />Replace</label><button type="button" onClick={() => void remove(item)}>Remove</button></div></article>)}</div>;
  return <div className="et-media-manager">
    {error && <div className="et-media-error" role="alert">{error}</div>}
    {queue.length > 0 && <div className="et-upload-queue"><header><b>Upload activity</b><button type="button" onClick={() => setQueue((current) => current.filter((item) => item.status === "queued" || item.status === "uploading"))}>Clear completed</button></header>{queue.map((item) => <div key={item.id} className={item.status}><i>{item.kind === "image" ? "IMG" : "VID"}</i><span><b>{item.name}</b><small>{item.status === "error" ? item.error : item.status === "done" ? "Uploaded" : item.status === "queued" ? "Waiting…" : `${item.progress}% uploaded`}</small><em><u style={{ width: `${item.progress}%` }} /></em></span>{(item.status === "done" || item.status === "error") && <button type="button" onClick={() => setQueue((current) => current.filter((entry) => entry.id !== item.id))}><Icon name="close" size={12} /></button>}</div>)}</div>}
    <div className="et-media-sections">
      <section className="et-media-section photo">
        <header><i>PHOTOS</i><span><b>Salon photography</b><small>Select several at once · maximum 15 MB each</small></span><em>{photos.length}</em></header>
        {photos.length > 0 && mediaCards(photos)}
        <label className="et-media-description"><span>Description for this batch</span><input maxLength={180} value={photoDescription} onChange={(event) => setPhotoDescription(event.target.value)} placeholder="e.g. Main styling area with natural light" /></label>
        <label className={`et-media-drop ${working ? "busy" : ""}`}><input multiple type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void uploadMany(event, "image")} disabled={working} /><i>＋</i><span><b>Add photos</b><small>Bulk upload JPEG, PNG, WebP or GIF</small></span></label>
      </section>
      <section className="et-media-section video">
        <header><i>VIDEOS</i><span><b>Place videos</b><small>Select several at once · maximum 150 MB each</small></span><em>{videos.length}</em></header>
        {videos.length > 0 && mediaCards(videos)}
        <label className="et-media-description"><span>Description for this batch</span><input maxLength={180} value={videoDescription} onChange={(event) => setVideoDescription(event.target.value)} placeholder="e.g. A quick tour of the salon" /></label>
        <label className={`et-media-drop ${working ? "busy" : ""}`}><input multiple type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => void uploadMany(event, "video")} disabled={working} /><i>▶</i><span><b>Add videos</b><small>Bulk upload MP4, WebM or MOV</small></span></label>
      </section>
    </div>
  </div>;
}

function SalonEditor({ draft, context, onClose }: { draft: SalonDraft; context: ManagerContext; onClose: () => void }) {
  const [form, setForm] = useState(draft);
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const set = (key: keyof SalonDraft, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function resolveLocation() {
    setResolving(true); setError(""); setFields({});
    try {
      const result = await context.request<{ url: string; latitude: number; longitude: number }>("/admin/locations/resolve", {
        method: "POST",
        body: JSON.stringify({ url: form.googleMapsUrl }),
      });
      setForm((current) => ({ ...current, googleMapsUrl: result.url, latitude: String(result.latitude), longitude: String(result.longitude) }));
    } catch (resolveError) {
      if (resolveError instanceof AdminApiError) {
        setError(resolveError.status === 404 ? "We could not read that map link. Please check it and try again." : resolveError.message);
        setFields(resolveError.fields ?? {});
      }
      else setError("Could not read this Google Maps link.");
    } finally { setResolving(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setFields({});

    const payload = {
      slug: form.slug || slugify(form.nameEn) || `salon-${Date.now()}`, status: form.status, category: form.category, nameAm: form.nameAm, nameEn: form.nameEn,
      descriptionAm: form.descriptionAm, descriptionEn: form.descriptionEn, areaAm: form.areaAm, areaEn: form.areaEn,
      address: form.address, googleMapsUrl: form.googleMapsUrl, latitude: Number(form.latitude), longitude: Number(form.longitude), phone: form.phone, email: form.email,
      websiteUrl: form.websiteUrl, bookingUrl: form.bookingUrl, imageUrl: form.imageUrl,
      priceFromEtb: form.priceFromEtb === "" ? undefined : Number(form.priceFromEtb), rating: form.rating === "" ? undefined : Number(form.rating),
      reviewCount: Number(form.reviewCount || 0), tagAm: form.tagAm, tagEn: form.tagEn, openingHours: openingHoursFrom(form.openingHours),
      amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean), sortOrder: Number(form.sortOrder || 0),
    };
    try {
      const saved = await context.request<Salon>(form.id ? `/admin/salons/${form.id}` : "/admin/salons", { method: form.id ? "PUT" : "POST", body: JSON.stringify(payload) });
      await context.refreshAll();
      if (!form.id) { setForm(toDraft(saved)); context.notify("Salon saved. You can add images and video now."); }
      else { context.notify("Salon updated."); onClose(); }
    } catch (saveError) {
      if (saveError instanceof AdminApiError) {
        setError(saveError.status === 400 && saveError.code === "invalid_json" ? "Some location details could not be saved. Please review the form and try again." : saveError.message);
        setFields(saveError.fields ?? {});
      }
      else setError("Could not save this salon.");
    } finally { setSaving(false); }
  }

  return <div className="et-editor-layer">
    <button className="et-editor-scrim" onClick={onClose} aria-label="Close editor" />
    <aside className="et-editor">
      <header><div><span>{form.id ? "EDIT LOCATION" : "NEW LOCATION"}</span><h2>{form.id ? form.nameEn : "Add a salon"}</h2></div><button onClick={onClose} aria-label="Close"><Icon name="close" /></button></header>
      <form onSubmit={submit}>
        <div className="et-simple-flow" aria-label="Salon setup progress"><span className="active"><i>1</i>Salon</span><span className={form.latitude && form.longitude ? "active" : ""}><i>2</i>Location</span><span><i>3</i>Publish</span></div>
        <section><div className="et-form-section-title"><b>1. Salon</b><span>Use either language or both</span></div>
          <div className="et-form-grid">
            <label><span>English name · optional</span><input value={form.nameEn} onChange={(event) => set("nameEn", event.target.value)} />{fields.nameEn && <small>{fields.nameEn}</small>}</label>
            <label lang="am"><span>የአማርኛ ስም · አማራጭ</span><input value={form.nameAm} onChange={(event) => set("nameAm", event.target.value)} />{fields.nameAm && <small>{fields.nameAm}</small>}</label>
            <label><span>Category</span><select value={form.category} onChange={(event) => set("category", event.target.value as SalonCategory)}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{fields.category && <small>{fields.category}</small>}</label>
          </div>
        </section>
        <section><div className="et-form-section-title"><b>2. Location</b><span>One area language is enough</span></div>
          <div className="et-form-grid">
            <label><span>Area in English · optional</span><input value={form.areaEn} onChange={(event) => set("areaEn", event.target.value)} placeholder="Bole" />{fields.areaEn && <small>{fields.areaEn}</small>}</label>
            <label lang="am"><span>አካባቢ በአማርኛ · አማራጭ</span><input value={form.areaAm} onChange={(event) => set("areaAm", event.target.value)} placeholder="ቦሌ" />{fields.areaAm && <small>{fields.areaAm}</small>}</label>
            <label className="wide"><span>Google Maps location link</span><div className="et-location-paste"><input type="url" value={form.googleMapsUrl} onChange={(event) => setForm((current) => ({ ...current, googleMapsUrl: event.target.value, latitude: "", longitude: "" }))} required placeholder="https://maps.app.goo.gl/…" /><button type="button" onClick={() => void resolveLocation()} disabled={resolving || !form.googleMapsUrl}>{resolving ? "Finding…" : "Test link"}</button></div>{fields.googleMapsUrl && <small>{fields.googleMapsUrl}</small>}<em>Google Maps → Share → Copy link. Continue only after “Location found” appears.</em></label>
            {form.latitude && form.longitude && <div className="et-location-result wide"><i /><span><b>Location found in Addis Ababa</b><small>{Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}</small></span><a href={form.googleMapsUrl} target="_blank" rel="noreferrer">Open map ↗</a></div>}
            {fields.coordinates && <p className="et-field-wide-error">{fields.coordinates}</p>}
          </div>
        </section>
        <section><div className="et-form-section-title"><b>3. Publish</b><span>A few optional details</span></div>
          <div className="et-form-grid">
            <label><span>Visibility</span><select value={form.status} onChange={(event) => set("status", event.target.value as PublishStatus)}><option value="draft">Draft — admin only</option><option value="published">Published — show on map</option><option value="archived">Archived</option></select>{fields.status && <small>{fields.status}</small>}</label>
            <label><span>Starting price (ETB)</span><input type="number" min="0" value={form.priceFromEtb} onChange={(event) => set("priceFromEtb", event.target.value)} placeholder="450" /></label>
            <label><span>Phone</span><input value={form.phone} onChange={(event) => set("phone", event.target.value)} placeholder="+251 ..." /></label>
          </div>
          <details className="et-profile-details"><summary><span><b>Public profile details</b><small>Description, contact, opening hours and amenities</small></span><i>＋</i></summary><div className="et-form-grid">
            <label className="wide"><span>English description</span><textarea value={form.descriptionEn} onChange={(event) => set("descriptionEn", event.target.value)} rows={4} placeholder="Tell customers what makes this place special…" /></label>
            <label className="wide" lang="am"><span>የአማርኛ መግለጫ</span><textarea value={form.descriptionAm} onChange={(event) => set("descriptionAm", event.target.value)} rows={4} /></label>
            <label className="wide"><span>Street address</span><input value={form.address} onChange={(event) => set("address", event.target.value)} placeholder="Bole Road, Addis Ababa" /></label>
            <label><span>Email</span><input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} /></label>
            <label><span>Website</span><input type="url" value={form.websiteUrl} onChange={(event) => set("websiteUrl", event.target.value)} placeholder="https://…" /></label>
            <label className="wide"><span>Booking link</span><input type="url" value={form.bookingUrl} onChange={(event) => set("bookingUrl", event.target.value)} placeholder="https://app.aspio.io/…" /></label>
            <label className="wide"><span>Opening hours</span><input value={openingHoursSummary(form.openingHours)} onChange={(event) => set("openingHours", JSON.stringify({ summary: event.target.value }))} placeholder="Monday–Saturday, 9:00–18:00" /></label>
            <label className="wide"><span>Amenities</span><input value={form.amenities} onChange={(event) => set("amenities", event.target.value)} placeholder="Wi-Fi, parking, wheelchair access (separate with commas)" /></label>
            <label><span>Rating</span><input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => set("rating", event.target.value)} /></label>
            <label><span>Review count</span><input type="number" min="0" value={form.reviewCount} onChange={(event) => set("reviewCount", event.target.value)} /></label>
            <label><span>English badge</span><input value={form.tagEn} onChange={(event) => set("tagEn", event.target.value)} placeholder="Open today" /></label>
            <label lang="am"><span>የአማርኛ ባጅ</span><input value={form.tagAm} onChange={(event) => set("tagAm", event.target.value)} /></label>
          </div></details>
        </section>
        <section><div className="et-form-section-title"><b>4. Marketplace cover</b><span>Optional media attached only to this salon record</span></div>{form.id ? <MediaBoundary><SalonMediaPanel salonID={form.id} context={context} /></MediaBoundary> : <div className="et-media-locked"><i>04</i><span><b>Save the salon first</b><small>Profile media unlocks immediately after the first save.</small></span></div>}</section>
        {error && <p className="et-editor-error" role="alert">{error}</p>}
        <footer><small>{form.latitude && form.longitude ? "Location tested — ready to save." : "Test the Google Maps link before saving."}</small><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={saving || resolving || !form.latitude || !form.longitude}><span>{saving ? "Saving…" : form.status === "published" ? "Save and publish" : "Save draft"}</span><Icon name="arrow" /></button></footer>
      </form>
    </aside>
  </div>;
}

export default function SalonManager({ salons, context }: { salons: Salon[]; context: ManagerContext }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState<"all" | PublishStatus>("all"); const [editor, setEditor] = useState<SalonDraft | null>(null);
  const filtered = useMemo(() => salons.filter((salon) => (status === "all" || salon.status === status) && `${salon.nameEn} ${salon.nameAm} ${salon.areaEn} ${salon.areaAm} ${salon.category}`.toLowerCase().includes(query.toLowerCase())), [query, salons, status]);
  async function remove(salon: Salon) { if (!window.confirm(`Remove ${salon.nameEn} from Aspio? This keeps its history but hides it everywhere.`)) return; try { await context.request(`/admin/salons/${salon.id}`, { method: "DELETE" }); await context.refreshAll(); context.notify("Salon removed."); } catch (error) { context.notify(error instanceof Error ? error.message : "Could not remove salon."); } }

  return <div className="et-admin-view">
    <header className="et-view-heading"><div><span className="et-eyebrow">MARKETPLACE</span><h1>Places across Addis.</h1><p>Every published location appears in the marketplace and can be used as a map pin.</p></div><button className="et-primary-button" onClick={() => setEditor({ ...emptySalon })}><Icon name="plus" /> Add salon</button></header>
    <section className="et-list-toolbar"><label><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by salon, area or category" /></label><div>{(["all", "published", "draft", "archived"] as const).map((item) => <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}<span>{item === "all" ? salons.length : salons.filter((salon) => salon.status === item).length}</span></button>)}</div></section>
    <section className="et-data-panel"><header className="et-salon-table-head"><span>Location</span><span>Area</span><span>Visibility</span><span>Updated</span><span /></header>
      {filtered.length ? filtered.map((salon) => <article className="et-salon-row" key={salon.id}><button className="et-place-main" onClick={() => setEditor(toDraft(salon))}><span><img src={salonCover(salon)} alt="" /></span><div><b>{salon.nameEn}</b><small lang="am">{salon.nameAm}</small><em>{salon.category}</em></div></button><div className="et-place-area"><b>{salon.areaEn}</b><small>{salon.latitude.toFixed(4)}, {salon.longitude.toFixed(4)}</small></div><span className={`et-status-pill ${salon.status}`}><i />{salon.status}</span><time>{formatDate(salon.updatedAt)}</time><div className="et-row-actions"><button onClick={() => setEditor(toDraft(salon))} aria-label={`Edit ${salon.nameEn}`}><Icon name="edit" /></button><button className="danger" onClick={() => void remove(salon)} aria-label={`Delete ${salon.nameEn}`}><Icon name="trash" /></button></div></article>) : <div className="et-empty-state"><i><Icon name="salons" size={27} /></i><h3>No matching locations</h3><p>Adjust the filter or add a new salon.</p><button onClick={() => setEditor({ ...emptySalon })}>Add a salon</button></div>}
    </section>
    {editor && <SalonEditor key={editor.id ?? "new"} draft={editor} context={context} onClose={() => setEditor(null)} />}
  </div>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-ET", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }

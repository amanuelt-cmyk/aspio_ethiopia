"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { mediaUrl } from "@/lib/api/config";
import { AdminApiError } from "../api";
import type { GalleryMedia } from "../types";
import type { ManagerContext } from "./AdminApp";
import Icon from "./Icon";

const titleFromFile = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");

export default function GalleryManager({ kind, context }: { kind: "image" | "video"; context: ManagerContext }) {
  const [items, setItems] = useState<GalleryMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<GalleryMedia | null>(null);
  const [queue, setQueue] = useState<Array<{ id: string; name: string; progress: number; state: "uploading" | "done" | "error"; error?: string }>>([]);
  const noun = kind === "image" ? "image" : "video";

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setItems((await context.request<{ items: GalleryMedia[] }>(`/admin/gallery?kind=${kind}`)).items); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : `Could not load ${noun}s.`); }
    finally { setLoading(false); }
  }, [context, kind, noun]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  function updateQueue(id: string, update: Partial<(typeof queue)[number]>) {
    setQueue((current) => current.map((entry) => entry.id === id ? { ...entry, ...update } : entry));
  }

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []); event.target.value = "";
    if (!files.length) return;
    setError("");
    for (const [index, file] of files.entries()) {
      const id = crypto.randomUUID();
      setQueue((current) => [...current, { id, name: file.name, progress: 1, state: "uploading" }]);
      const body = new FormData(); body.set("file", file); body.set("titleEn", titleFromFile(file.name)); body.set("status", "published"); body.set("sortOrder", String(items.length + index));
      try { await context.upload<GalleryMedia>(`/admin/gallery/${kind}`, body, (progress) => updateQueue(id, { progress })); updateQueue(id, { progress: 100, state: "done" }); }
      catch (uploadError) { updateQueue(id, { state: "error", error: uploadError instanceof Error ? uploadError.message : "Upload failed." }); }
    }
    await load(); context.notify(`${files.length} ${files.length === 1 ? noun : `${noun}s`} processed.`);
  }

  async function remove(item: GalleryMedia) {
    if (!window.confirm(`Remove “${item.titleEn || item.originalName}” from the gallery?`)) return;
    try { await context.request(`/admin/gallery/items/${item.id}`, { method: "DELETE" }); await load(); context.notify(`${noun[0].toUpperCase()}${noun.slice(1)} removed.`); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Could not remove this item."); }
  }

  return <div className="et-admin-view et-gallery-admin">
    <header className="et-view-heading"><div><span className="et-eyebrow">PUBLIC GALLERY / {kind === "image" ? "PHOTOGRAPHY" : "FILMS"}</span><h1>{kind === "image" ? "Shape the visual story." : "Show it in motion."}</h1><p>{kind === "image" ? "Upload editorial photography for the image collection. Each item can be published, ordered and described independently." : "Publish landscape, portrait or square video without cropping. Original aspect ratios are preserved on the gallery page."}</p></div><label className="et-primary-button et-upload-button"><Icon name="plus" /> Upload {noun}s<input type="file" multiple accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "video/mp4,video/webm,video/quicktime"} onChange={(event) => void uploadFiles(event)} /></label></header>
    {queue.length > 0 && <section className="et-global-upload-queue"><header><b>Upload activity</b><button onClick={() => setQueue((current) => current.filter((entry) => entry.state === "uploading"))}>Clear finished</button></header><div>{queue.map((entry) => <article key={entry.id} className={entry.state}><i>{kind === "image" ? "IMG" : "VID"}</i><span><b>{entry.name}</b><small>{entry.state === "uploading" ? `${entry.progress}% uploaded` : entry.state === "done" ? "Ready in gallery" : entry.error}</small><em><u style={{ width: `${entry.progress}%` }} /></em></span></article>)}</div></section>}
    {error && <div className="et-gallery-error" role="alert">{error}<button onClick={() => void load()}>Try again</button></div>}
    {loading ? <div className="et-account-loading"><i />Loading {noun}s…</div> : items.length ? <section className={`et-gallery-admin-grid ${kind}`}>{items.map((item, index) => <article key={item.id}>
      <button className="et-gallery-media" onClick={() => setEditor(item)}>{kind === "image" ? <img src={mediaUrl(item.url)} alt={item.titleEn || item.originalName} /> : <video src={mediaUrl(item.url)} muted playsInline preload="metadata" />}{item.status === "draft" && <em>Draft</em>}<span>{String(index + 1).padStart(2, "0")}</span></button>
      <footer><div><b>{item.titleEn || item.originalName}</b><small>{item.originalName} · {(item.sizeBytes / 1024 / 1024).toFixed(1)} MB</small></div><button onClick={() => setEditor(item)} aria-label="Edit"><Icon name="edit" /></button><button className="danger" onClick={() => void remove(item)} aria-label="Remove"><Icon name="trash" /></button></footer>
    </article>)}</section> : <div className="et-gallery-empty"><i><Icon name={kind === "image" ? "images" : "videos"} size={28} /></i><h2>Your {noun} gallery is ready.</h2><p>Upload several files at once. They will appear here with individual publishing controls.</p></div>}
    {editor && <GalleryEditor item={editor} context={context} onClose={() => setEditor(null)} onSaved={async () => { setEditor(null); await load(); }} />}
  </div>;
}

function GalleryEditor({ item, context, onClose, onSaved }: { item: GalleryMedia; context: ManagerContext; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ titleEn: item.titleEn, titleAm: item.titleAm, captionEn: item.captionEn, captionAm: item.captionAm, status: item.status, sortOrder: String(item.sortOrder) });
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setError(""); try { await context.request(`/admin/gallery/items/${item.id}`, { method: "PUT", body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }) }); context.notify("Gallery item updated."); await onSaved(); } catch (saveError) { setError(saveError instanceof AdminApiError ? saveError.message : "Could not update this gallery item."); } finally { setSaving(false); } }
  return <div className="et-editor-layer"><button className="et-editor-scrim" onClick={onClose} aria-label="Close"/><aside className="et-editor et-gallery-item-editor"><header><div><span>{item.kind.toUpperCase()} DETAILS</span><h2>Give the work context.</h2></div><button onClick={onClose}><Icon name="close"/></button></header><div className={`et-gallery-editor-preview ${item.kind}`}>{item.kind === "image" ? <img src={mediaUrl(item.url)} alt=""/> : <video src={mediaUrl(item.url)} controls/>}</div><form onSubmit={submit}>{error && <p className="et-editor-error">{error}</p>}<div className="et-form-grid"><label><span>English title</span><input value={form.titleEn} onChange={(e)=>setForm({...form,titleEn:e.target.value})}/></label><label lang="am"><span>የአማርኛ ርዕስ</span><input value={form.titleAm} onChange={(e)=>setForm({...form,titleAm:e.target.value})}/></label><label className="wide"><span>English caption</span><textarea rows={4} value={form.captionEn} onChange={(e)=>setForm({...form,captionEn:e.target.value})}/></label><label className="wide" lang="am"><span>የአማርኛ መግለጫ</span><textarea rows={4} value={form.captionAm} onChange={(e)=>setForm({...form,captionAm:e.target.value})}/></label><label><span>Visibility</span><select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value as GalleryMedia["status"]})}><option value="published">Published</option><option value="draft">Draft</option></select></label><label><span>Display order</span><input type="number" value={form.sortOrder} onChange={(e)=>setForm({...form,sortOrder:e.target.value})}/></label></div><footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save item"}<Icon name="arrow"/></button></footer></form></aside></div>;
}

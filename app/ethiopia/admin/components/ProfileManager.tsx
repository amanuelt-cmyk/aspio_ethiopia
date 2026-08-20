"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, type ChangeEvent, type FormEvent } from "react";
import { API_BASE, AdminApiError } from "../api";
import type { AdminUser } from "../types";
import type { ManagerContext } from "./AdminApp";
import Icon from "./Icon";

const avatarURL = (value: string) => value.startsWith("/uploads/") ? `${API_BASE}${value}` : value;
const roleLabel = (role: AdminUser["role"]) => role === "super_admin" ? "Super admin" : "Admin";

export default function ProfileManager({ user, context, onUpdated }: { user: AdminUser; context: ManagerContext; onUpdated: (user: AdminUser) => void }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone ?? "", jobTitle: user.jobTitle ?? "" });
  const [saving, setSaving] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setFields({});
    try {
      const updated = await context.request<AdminUser>("/admin/profile", { method: "PUT", body: JSON.stringify(form) });
      onUpdated(updated); context.notify("Profile information updated.");
    } catch (saveError) {
      if (saveError instanceof AdminApiError) { setError(saveError.message); setFields(saveError.fields ?? {}); }
      else setError("Could not update your profile.");
    } finally { setSaving(false); }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Choose a JPEG, PNG, WebP, or GIF image."); return; }
    if (file.size > 15 << 20) { setError("Profile pictures are limited to 15 MB."); return; }
    setError(""); setAvatarProgress(1);
    const body = new FormData(); body.set("file", file);
    try {
      const updated = await context.upload<AdminUser>("/admin/profile/avatar", body, setAvatarProgress);
      onUpdated(updated); context.notify("Profile picture updated.");
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Could not upload the profile picture."); }
    finally { setAvatarProgress(null); }
  }

  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part.slice(0, 1)).join("").toUpperCase();
  return <div className="et-admin-view et-profile-view">
    <header className="et-view-heading"><div><span className="et-eyebrow">YOUR ACCOUNT</span><h1>Make it yours.</h1><p>Keep the identity behind Aspio Ethiopia accurate and recognizable.</p></div></header>
    <div className="et-profile-layout">
      <aside className="et-profile-card"><div className="et-profile-art"><i>ASPIO</i></div><div className="et-profile-avatar">{user.avatarUrl ? <img src={avatarURL(user.avatarUrl)} alt={user.name} /> : <span>{initials}</span>}<label><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void uploadAvatar(event)} disabled={avatarProgress !== null} /><Icon name="edit" size={13} /></label></div><div className="et-profile-identity"><span>{roleLabel(user.role)} account</span><h2>{user.name}</h2><p>{user.jobTitle || "Aspio Ethiopia administrator"}</p></div>{avatarProgress !== null && <div className="et-avatar-progress"><span><b>Uploading picture</b><i>{avatarProgress}%</i></span><em><u style={{ width: `${avatarProgress}%` }} /></em></div>}<dl><div><dt>Access</dt><dd>{roleLabel(user.role)}</dd></div><div><dt>Account ID</dt><dd>{user.id.slice(0, 8)}</dd></div></dl></aside>
      <form className="et-profile-form" onSubmit={save}><header><span>PROFILE INFORMATION</span><h2>The person behind the workspace.</h2><p>Your role and account permissions remain protected.</p></header>{error && <div className="et-profile-error" role="alert">{error}</div>}<div className="et-profile-fields"><label><span>Full name</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />{fields.name && <small>{fields.name}</small>}</label><label><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />{fields.email && <small>{fields.email}</small>}</label><label><span>Phone number</span><input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+251 …" /></label><label><span>Job title</span><input value={form.jobTitle} onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))} placeholder="Marketplace manager" /></label></div><footer><span><i />Changes update your active session immediately.</span><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}<Icon name="arrow" size={15} /></button></footer></form>
    </div>
  </div>;
}

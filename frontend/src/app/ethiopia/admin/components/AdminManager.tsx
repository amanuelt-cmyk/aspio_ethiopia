"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { mediaUrl } from "@/lib/api/config";
import { AdminApiError } from "../api";
import type { AdminRole, AdminUser } from "../types";
import type { ManagerContext } from "./AdminApp";
import Icon from "./Icon";

type AccountDraft = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: AdminRole;
  active: boolean;
  password: string;
};

const roleLabel = (role: AdminRole) => role === "super_admin" ? "Super admin" : "Admin";
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

function generatePassword() {
  const groups = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*-_"];
  const all = groups.join("");
  const bytes = new Uint32Array(18);
  crypto.getRandomValues(bytes);
  const characters = groups.map((group, index) => group[bytes[index] % group.length]);
  for (let index = 4; index < bytes.length; index += 1) characters.push(all[bytes[index] % all.length]);
  return characters.map((_, index, list) => list[(bytes[index] + index) % list.length]).join("");
}

function dateLabel(value?: string) {
  if (!value) return "Never signed in";
  return new Intl.DateTimeFormat("en-ET", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function AccountEditor({ target, currentUser, context, onClose, onSaved }: {
  target: AdminUser | null;
  currentUser: AdminUser;
  context: ManagerContext;
  onClose: () => void;
  onSaved: (user: AdminUser) => void;
}) {
  const creating = !target;
  const [form, setForm] = useState<AccountDraft>(() => target ? {
    id: target.id, name: target.name, email: target.email, phone: target.phone ?? "",
    jobTitle: target.jobTitle ?? "", role: target.role, active: target.active, password: "",
  } : { name: "", email: "", phone: "", jobTitle: "", role: "admin", active: true, password: generatePassword() });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const isSelf = target?.id === currentUser.id;

  function update<K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function copyCredentials() {
    if (!createdCredentials) return;
    await navigator.clipboard.writeText(`Aspio Ethiopia admin\nEmail: ${createdCredentials.email}\nTemporary password: ${createdCredentials.password}`);
    context.notify("Sign-in details copied.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setFields({});
    if (!creating && target?.active && !form.active && !window.confirm(`Deactivate ${target.name}? Their active sessions will end immediately.`)) {
      setSaving(false); return;
    }
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone, jobTitle: form.jobTitle, role: form.role, ...(creating ? { password: form.password } : { active: form.active }) };
      const saved = await context.request<AdminUser>(creating ? "/admin/users" : `/admin/users/${target?.id}`, { method: creating ? "POST" : "PUT", body: JSON.stringify(payload) });
      onSaved(saved);
      if (creating) {
        setCreatedCredentials({ email: saved.email, password: form.password });
        context.notify("Administrator account created.");
      } else {
        context.notify("Administrator access updated.");
        onClose();
      }
    } catch (saveError) {
      if (saveError instanceof AdminApiError) { setError(saveError.message); setFields(saveError.fields ?? {}); }
      else setError("The administrator account could not be saved.");
    } finally { setSaving(false); }
  }

  async function resetPassword() {
    if (!target || isSelf || form.password.length < 12) return;
    if (!window.confirm(`Reset ${target.name}'s password? This signs them out on every device.`)) return;
    setResetting(true); setError(""); setFields({});
    try {
      await context.request(`/admin/users/${target.id}/password`, { method: "POST", body: JSON.stringify({ password: form.password }) });
      await navigator.clipboard.writeText(`Aspio Ethiopia admin\nEmail: ${target.email}\nTemporary password: ${form.password}`).catch(() => undefined);
      context.notify("Password reset. New sign-in details copied.");
      setForm((current) => ({ ...current, password: "" }));
    } catch (resetError) {
      if (resetError instanceof AdminApiError) { setError(resetError.message); setFields(resetError.fields ?? {}); }
      else setError("The password could not be reset.");
    } finally { setResetting(false); }
  }

  return <div className="et-editor-layer et-account-layer">
    <button className="et-editor-scrim" onClick={onClose} aria-label="Close account editor" />
    <aside className="et-editor et-account-editor">
      <header><div><span>{creating ? "NEW ADMINISTRATOR" : "ACCESS CONTROL"}</span><h2>{creating ? "Invite someone trusted." : target.name}</h2></div><button onClick={onClose} aria-label="Close"><Icon name="close" /></button></header>
      {createdCredentials ? <section className="et-credential-card">
        <i><Icon name="check" size={22} /></i><span>ACCOUNT READY</span><h3>Share these sign-in details securely.</h3><p>The temporary password is shown only here. Ask the administrator to store it in a password manager.</p>
        <dl><div><dt>Email</dt><dd>{createdCredentials.email}</dd></div><div><dt>Temporary password</dt><dd>{createdCredentials.password}</dd></div></dl>
        <div><button onClick={() => void copyCredentials()}>Copy sign-in details</button><button onClick={onClose}>Done</button></div>
      </section> : <form onSubmit={submit}>
        {isSelf && <div className="et-account-note"><Icon name="profile" size={17} /><span><b>This is your account.</b>Your access level and active status are protected. Personal details can also be changed from Profile.</span></div>}
        {error && <p className="et-editor-error" role="alert">{error}</p>}
        <section className="et-account-form-section"><header><span>01</span><div><b>Identity</b><small>How this person appears in the workspace.</small></div></header><div className="et-form-grid">
          <label><span>Full name</span><input value={form.name} onChange={(event) => update("name", event.target.value)} required autoFocus />{fields.name && <small>{fields.name}</small>}</label>
          <label><span>Email address</span><input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />{fields.email && <small>{fields.email}</small>}</label>
          <label><span>Phone number</span><input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+251 …" />{fields.phone && <small>{fields.phone}</small>}</label>
          <label><span>Job title</span><input value={form.jobTitle} onChange={(event) => update("jobTitle", event.target.value)} placeholder="Marketplace manager" /></label>
        </div></section>
        <section className="et-account-form-section"><header><span>02</span><div><b>Access level</b><small>Choose the smallest level of access they need.</small></div></header><div className="et-role-options">
          {(["admin", "super_admin"] as AdminRole[]).map((role) => <label key={role} className={form.role === role ? "active" : ""}><input type="radio" name="role" value={role} checked={form.role === role} disabled={isSelf} onChange={() => update("role", role)} /><i><Icon name={role === "super_admin" ? "check" : "users"} size={17} /></i><span><b>{roleLabel(role)}</b><small>{role === "super_admin" ? "Full control, including administrator accounts." : "Manage salons, stories, leads, and profile."}</small></span></label>)}
        </div>{fields.role && <small className="et-field-error">{fields.role}</small>}
        {!creating && <label className={`et-account-toggle ${form.active ? "active" : ""}`}><span><b>Account active</b><small>{form.active ? "This person can sign in." : "Sign-in is blocked and sessions are revoked."}</small></span><input type="checkbox" checked={form.active} disabled={isSelf} onChange={(event) => update("active", event.target.checked)} /><i /></label>}</section>
        {creating ? <section className="et-account-form-section"><header><span>03</span><div><b>Temporary password</b><small>Send it through a private channel.</small></div></header><div className="et-password-maker"><input value={form.password} onChange={(event) => update("password", event.target.value)} minLength={12} required /><button type="button" onClick={() => update("password", generatePassword())}>Generate</button></div>{fields.password && <small className="et-field-error">{fields.password}</small>}</section>
          : !isSelf && <section className="et-account-form-section et-security-section"><header><span>03</span><div><b>Reset password</b><small>This immediately signs the administrator out everywhere.</small></div></header><div className="et-password-maker"><input value={form.password} onChange={(event) => update("password", event.target.value)} minLength={12} placeholder="New temporary password" /><button type="button" onClick={() => update("password", generatePassword())}>Generate</button></div>{fields.password && <small className="et-field-error">{fields.password}</small>}<button className="et-reset-password" type="button" disabled={resetting || form.password.length < 12} onClick={() => void resetPassword()}>{resetting ? "Resetting…" : "Reset and copy credentials"}</button></section>}
        <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={saving}><span>{saving ? "Saving…" : creating ? "Create administrator" : "Save access"}</span><Icon name="arrow" /></button></footer>
      </form>}
    </aside>
  </div>;
}

export default function AdminManager({ currentUser, context, onCurrentUpdated }: { currentUser: AdminUser; context: ManagerContext; onCurrentUpdated: (user: AdminUser) => void }) {
  const [accounts, setAccounts] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "disabled">("all");
  const [editor, setEditor] = useState<AdminUser | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setAccounts((await context.request<{ items: AdminUser[] }>("/admin/users")).items); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Administrator accounts could not be loaded."); }
    finally { setLoading(false); }
  }, [context]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function mergeAccount(account: AdminUser) {
    setAccounts((items) => [...items.filter((item) => item.id !== account.id), account].sort((a, b) => Number(b.active) - Number(a.active) || Number(b.role === "super_admin") - Number(a.role === "super_admin") || a.name.localeCompare(b.name)));
    if (account.id === currentUser.id) onCurrentUpdated(account);
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return accounts.filter((account) => (status === "all" || (status === "active" ? account.active : !account.active)) && (!needle || `${account.name} ${account.email} ${account.jobTitle}`.toLowerCase().includes(needle)));
  }, [accounts, query, status]);
  const superAdmins = accounts.filter((account) => account.active && account.role === "super_admin").length;
  const activeAdmins = accounts.filter((account) => account.active && account.role === "admin").length;
  const disabled = accounts.filter((account) => !account.active).length;

  return <div className="et-admin-view et-users-view">
    <header className="et-view-heading"><div><span className="et-eyebrow">ACCESS CONTROL</span><h1>Your trusted circle.</h1><p>Create administrator accounts, assign only the access they need, and revoke access without losing their history.</p></div><button className="et-primary-button" onClick={() => setEditor("new")}><Icon name="plus" /> Add administrator</button></header>
    <section className="et-access-strip"><div><i className="super"><Icon name="check" /></i><span><b>{superAdmins}</b><small>Super admins</small></span></div><div><i><Icon name="users" /></i><span><b>{activeAdmins}</b><small>Active admins</small></span></div><div><i className="muted"><Icon name="close" /></i><span><b>{disabled}</b><small>Access revoked</small></span></div><p><Icon name="check" size={14} />The active super admin and the last super admin are always protected.</p></section>
    <div className="et-list-toolbar"><label><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or email…" /></label><div>{(["all", "active", "disabled"] as const).map((item) => <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}<span>{item === "all" ? accounts.length : item === "active" ? accounts.length - disabled : disabled}</span></button>)}</div></div>
    <section className="et-data-panel et-account-panel">
      <div className="et-account-table-head"><span>Administrator</span><span>Access</span><span>Last sign-in</span><span>Status</span><span /></div>
      {loading ? <div className="et-account-loading"><i />Loading access…</div> : error ? <div className="et-account-loading error"><p>{error}</p><button onClick={() => void load()}>Try again</button></div> : filtered.length ? filtered.map((account) => <article className={`et-account-row ${!account.active ? "disabled" : ""}`} key={account.id}>
        <div className="et-account-person">{account.avatarUrl ? <span><img src={mediaUrl(account.avatarUrl)} alt="" /></span> : <span>{initials(account.name)}</span>}<p><b>{account.name}{account.id === currentUser.id && <em>You</em>}</b><small>{account.email}</small><u>{account.jobTitle || "Aspio Ethiopia administrator"}</u></p></div>
        <div><span className={`et-role-badge ${account.role}`}>{roleLabel(account.role)}</span></div><time>{dateLabel(account.lastLoginAt)}</time><div><span className={`et-account-status ${account.active ? "active" : ""}`}><i />{account.active ? "Active" : "Disabled"}</span></div>
        <button className="et-account-edit" onClick={() => setEditor(account)}><Icon name="edit" size={15} /><span>{account.id === currentUser.id ? "View" : "Manage"}</span></button>
      </article>) : <div className="et-empty-state"><i><Icon name="users" /></i><h3>No administrators found</h3><p>Try another search or status filter.</p></div>}
    </section>
    {editor && <AccountEditor key={editor === "new" ? "new" : editor.id} target={editor === "new" ? null : editor} currentUser={currentUser} context={context} onClose={() => setEditor(null)} onSaved={mergeAccount} />}
  </div>;
}

"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { API_BASE, AdminApiError, adminRequest, adminUpload, login } from "../api";
import type { AdminUser, AdminView, BlogPost, Lead, PageResult, Salon } from "../types";
import BlogManager from "./BlogManager";
import AdminManager from "./AdminManager";
import FeaturedManager from "./FeaturedManager";
import GalleryManager from "./GalleryManager";
import Icon from "./Icon";
import LeadManager from "./LeadManager";
import ProfileManager from "./ProfileManager";
import SalonManager from "./SalonManager";

const sessionKey = "aspio-ethiopia-admin-session";
const sessionEvent = "aspio-admin-session-change";
type Session = { token: string; expiresAt: string; user: AdminUser };

function subscribeSession(listener: () => void) {
  window.addEventListener(sessionEvent, listener);
  return () => window.removeEventListener(sessionEvent, listener);
}

function writeSession(session: Session | null) {
  if (session) sessionStorage.setItem(sessionKey, JSON.stringify(session));
  else sessionStorage.removeItem(sessionKey);
  window.dispatchEvent(new Event(sessionEvent));
}

const navigation: { id: AdminView; label: string; description: string; superOnly?: boolean }[] = [
  { id: "overview", label: "Overview", description: "Today at a glance" },
  { id: "salons", label: "Salons", description: "Marketplace locations" },
  { id: "featured", label: "Featured Places", description: "Curated salon partners" },
  { id: "images", label: "Images", description: "Public gallery photos" },
  { id: "videos", label: "Videos", description: "Public gallery films" },
  { id: "posts", label: "Blog", description: "Stories and publishing" },
  { id: "leads", label: "Leads", description: "Demo and contact requests" },
  { id: "users", label: "Administrators", description: "Access and permissions", superOnly: true },
  { id: "profile", label: "Profile", description: "Your account and picture" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ET", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function LoginView({ onSuccess }: { onSuccess: (session: Session) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      onSuccess(await login(email, password));
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="et-admin-login">
      <section className="et-login-story">
        <div className="et-login-brand"><img src="/assets/aspio-logo.png" alt="Aspio" /><span>ETHIOPIA ADMIN</span></div>
        <div className="et-login-copy">
          <span className="et-eyebrow">PRIVATE WORKSPACE</span>
          <h1>Run the marketplace from one calm place.</h1>
          <p>Publish salons, place them accurately on the Addis map, create bilingual stories, and follow every new business enquiry.</p>
        </div>
        <div className="et-login-signal"><i /><span>ASPIO ADMIN</span><b>Your salon workspace</b></div>
      </section>
      <section className="et-login-panel">
        <form onSubmit={submit}>
          <header><span>01 / SECURE ACCESS</span><a href="/ethiopia/en">View website <Icon name="external" size={14} /></a></header>
          <div className="et-login-title"><small>WELCOME BACK</small><h2>Sign in to Aspio</h2><p>Use your Aspio administrator account to continue.</p></div>
          <label><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required placeholder="name@aspio.se" /></label>
          <label><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={12} required placeholder="Your admin password" /></label>
          {error && <p className="et-form-error" role="alert">{error}</p>}
          <button type="submit" disabled={submitting}><span>{submitting ? "Signing in…" : "Enter workspace"}</span><i><Icon name="arrow" /></i></button>
          <footer><i /><span>Protected access for your Aspio team.</span></footer>
        </form>
      </section>
    </main>
  );
}

function Overview({ salons, posts, leads, onNavigate }: { salons: Salon[]; posts: BlogPost[]; leads: Lead[]; onNavigate: (view: AdminView) => void }) {
  const publishedSalons = salons.filter((item) => item.status === "published").length;
  const publishedPosts = posts.filter((item) => item.status === "published").length;
  const newLeads = leads.filter((item) => item.status === "new").length;
  const latestLeads = leads.slice(0, 5);
  const recentSalons = salons.slice(0, 4);

  return <div className="et-admin-view et-overview-view">
    <header className="et-view-heading"><div><span className="et-eyebrow">OPERATIONS</span><h1>Everything in motion.</h1><p>A live view of what is published and what needs your attention.</p></div><button className="et-primary-button" onClick={() => onNavigate("salons")}><Icon name="plus" /> Add salon</button></header>
    <section className="et-metric-grid">
      <button onClick={() => onNavigate("salons")}><span>Published salons</span><b>{publishedSalons}</b><small>{salons.length - publishedSalons} not public</small><i>01</i></button>
      <button onClick={() => onNavigate("posts")}><span>Published stories</span><b>{publishedPosts}</b><small>{posts.length - publishedPosts} in progress</small><i>02</i></button>
      <button onClick={() => onNavigate("leads")}><span>New leads</span><b>{newLeads}</b><small>{leads.length} total enquiries</small><i>03</i></button>
      <div className="et-health-card"><span>Today</span><b><i />Ready for business</b><small>Your workspace is up to date</small><em>04</em></div>
    </section>
    <section className="et-overview-grid">
      <div className="et-panel et-recent-leads"><header><div><span>INBOX</span><h2>Latest leads</h2></div><button onClick={() => onNavigate("leads")}>View all <Icon name="arrow" size={15} /></button></header>
        {latestLeads.length ? <div>{latestLeads.map((lead) => <button key={lead.id} onClick={() => onNavigate("leads")}><i>{lead.name.slice(0, 1).toUpperCase()}</i><span><b>{lead.name}</b><small>{lead.businessName || (lead.kind === "demo" ? "Demo registration" : "Contact request")}</small></span><time>{formatDate(lead.createdAt)}</time></button>)}</div> : <div className="et-empty-compact">New leads will appear here.</div>}
      </div>
      <div className="et-panel et-recent-places"><header><div><span>MARKETPLACE</span><h2>Recently updated</h2></div><button onClick={() => onNavigate("salons")}>Manage <Icon name="arrow" size={15} /></button></header>
        {recentSalons.length ? <div>{recentSalons.map((salon) => <button key={salon.id} onClick={() => onNavigate("salons")}><span className={`et-status-dot ${salon.status}`} /><span><b>{salon.nameEn}</b><small>{salon.areaEn} · {salon.category}</small></span><em>{salon.status}</em></button>)}</div> : <div className="et-empty-compact">Add your first marketplace location.</div>}
      </div>
    </section>
  </div>;
}

export default function AdminApp() {
  const rawSession = useSyncExternalStore(subscribeSession, () => sessionStorage.getItem(sessionKey) ?? "", () => "");
  const hydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const session = useMemo(() => {
    if (!rawSession) return null;
    try {
      const stored = JSON.parse(rawSession) as Session;
      return stored.token && new Date(stored.expiresAt) > new Date() ? stored : null;
    } catch { return null; }
  }, [rawSession]);
  const [view, setView] = useState<AdminView>("overview");
  const [salons, setSalons] = useState<Salon[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const clearSession = useCallback(() => {
    writeSession(null);
    setSalons([]); setPosts([]); setLeads([]);
  }, []);

  const request = useCallback(async <T,>(path: string, options?: RequestInit): Promise<T> => {
    if (!session) throw new AdminApiError("Sign in is required.", 401);
    try {
      return await adminRequest<T>(path, options, session.token);
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) clearSession();
      throw error;
    }
  }, [clearSession, session]);

  const upload = useCallback(async <T,>(path: string, body: FormData, onProgress?: (progress: number) => void): Promise<T> => {
    if (!session) throw new AdminApiError("Sign in is required.", 401);
    try { return await adminUpload<T>(path, body, session.token, onProgress); }
    catch (error) { if (error instanceof AdminApiError && error.status === 401) clearSession(); throw error; }
  }, [clearSession, session]);

  const refreshAll = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [salonPage, postPage, leadPage, profile] = await Promise.all([
        request<PageResult<Salon>>("/admin/salons?pageSize=100"),
        request<PageResult<BlogPost>>("/admin/blog/posts?pageSize=100"),
        request<PageResult<Lead>>("/admin/leads?pageSize=100"),
        request<{ user: AdminUser }>("/admin/auth/me"),
      ]);
      setSalons(salonPage.items); setPosts(postPage.items); setLeads(leadPage.items);
      if (JSON.stringify(profile.user) !== JSON.stringify(session.user)) writeSession({ ...session, user: profile.user });
    } catch (error) {
      if (!(error instanceof AdminApiError && error.status === 401)) setNotice(error instanceof Error ? error.message : "Could not load the workspace.");
    } finally { setLoading(false); }
  }, [request, session]);

  useEffect(() => { if (!session) return; const timer = window.setTimeout(() => void refreshAll(), 0); return () => window.clearTimeout(timer); }, [session, refreshAll]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 5000); return () => window.clearTimeout(timer); }, [notice]);

  function acceptSession(next: Session) { writeSession(next); }
  function updateUser(user: AdminUser) { if (session) writeSession({ ...session, user }); }
  async function signOut() { if (session) await adminRequest("/admin/auth/logout", { method: "POST" }, session.token).catch(() => undefined); clearSession(); }
  const context = useMemo(() => ({ request, upload, refreshAll, notify: setNotice }), [request, upload, refreshAll]);

  if (!hydrated) return <div className="et-admin-loading"><img src="/assets/aspio-logo.png" alt="Aspio" /><i /></div>;
  if (!session) return <LoginView onSuccess={acceptSession} />;
  const visibleNavigation = navigation.filter((item) => !item.superOnly || session.user.role === "super_admin");

  return <main className="et-admin-shell">
    <aside className={menuOpen ? "open" : ""}>
      <header><img src="/assets/aspio-logo.png" alt="Aspio" /><span>ETHIOPIA</span><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><Icon name="close" /></button></header>
      <div className="et-admin-workspace"><small>WORKSPACE</small><b>Marketplace operations</b><span><i />Ready to manage</span></div>
      <nav>{visibleNavigation.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setMenuOpen(false); }}><i><Icon name={item.id === "overview" ? "overview" : item.id === "salons" ? "salons" : item.id === "featured" ? "featured" : item.id === "images" ? "images" : item.id === "videos" ? "videos" : item.id === "posts" ? "posts" : item.id === "profile" ? "profile" : item.id === "users" ? "users" : "leads"} /></i><span><b>{item.label}</b><small>{item.description}</small></span>{item.id === "leads" && leads.filter((lead) => lead.status === "new").length > 0 && <em>{leads.filter((lead) => lead.status === "new").length}</em>}</button>)}</nav>
      <footer><button className="et-admin-user" onClick={() => { setView("profile"); setMenuOpen(false); }}>{session.user.avatarUrl ? <span><img src={session.user.avatarUrl.startsWith("/uploads/") ? `${API_BASE}${session.user.avatarUrl}` : session.user.avatarUrl} alt="" /></span> : <span>{session.user.name.slice(0, 1).toUpperCase()}</span>}<p><b>{session.user.name}</b><small>{session.user.jobTitle || session.user.role}</small></p></button><button onClick={() => void signOut()} aria-label="Sign out"><Icon name="logout" /></button></footer>
    </aside>
    {menuOpen && <button className="et-admin-scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}
    <section className="et-admin-main">
      <div className="et-admin-topbar"><button onClick={() => setMenuOpen(true)} aria-label="Open menu"><Icon name="menu" /></button><div><span>{visibleNavigation.find((item) => item.id === view)?.label ?? "Overview"}</span><i />{loading ? "Updating" : "Ready"}</div><a href="/ethiopia/en" target="_blank" rel="noreferrer">Open website <Icon name="external" size={14} /></a></div>
      {view === "overview" && <Overview salons={salons} posts={posts} leads={leads} onNavigate={setView} />}
      {view === "salons" && <SalonManager salons={salons} context={context} />}
      {view === "featured" && <FeaturedManager salons={salons} context={context} />}
      {view === "images" && <GalleryManager kind="image" context={context} />}
      {view === "videos" && <GalleryManager kind="video" context={context} />}
      {view === "posts" && <BlogManager posts={posts} context={context} />}
      {view === "leads" && <LeadManager leads={leads} context={context} />}
      {view === "users" && session.user.role === "super_admin" && <AdminManager currentUser={session.user} context={context} onCurrentUpdated={updateUser} />}
      {view === "profile" && <ProfileManager user={session.user} context={context} onUpdated={updateUser} />}
    </section>
    {notice && <div className="et-admin-toast" role="status"><Icon name="check" /><span>{notice}</span><button onClick={() => setNotice("")}><Icon name="close" size={14} /></button></div>}
  </main>;
}

export type ManagerContext = {
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
  upload: <T>(path: string, body: FormData, onProgress?: (progress: number) => void) => Promise<T>;
  refreshAll: () => Promise<void>;
  notify: (message: string) => void;
};

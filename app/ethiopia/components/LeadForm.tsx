"use client";

import { useState, type FormEvent } from "react";
import type { LeadKind, LeadSource } from "@/lib/leads/types";

type LeadFormProps = {
  kind: LeadKind;
  source: LeadSource;
  showBusinessName?: boolean;
  compact?: boolean;
  language?: "am" | "en";
};

type FormStatus = "idle" | "submitting" | "success" | "error";

const LEAD_API_BASE = process.env.NEXT_PUBLIC_ASPIO_API_URL?.replace(/\/$/, "")
  ?? (process.env.NODE_ENV === "development" ? "http://localhost:18080" : "");

const formCopy = {
  am: {
    success: "ጥያቄዎ ደርሶናል",
    demoSuccess: "በቅርቡ ለማሳያ እንደውላለን።",
    contactSuccess: "በቅርቡ መልስ እንሰጥዎታለን።",
    another: "ሌላ ጥያቄ ይላኩ",
    name: "ሙሉ ስም",
    namePlaceholder: "ስምዎን ያስገቡ",
    business: "የንግድ ስም",
    optional: "ካለ",
    businessPlaceholder: "የሳሎን፣ ባርበር ወይም ንግድ ስም",
    email: "ኢሜይል",
    phone: "ስልክ ቁጥር",
    message: "መልእክት",
    messagePlaceholder: "እንዴት ልንረዳዎ እንችላለን?",
    sending: "በመላክ ላይ...",
    demoSubmit: "ለማሳያ ይመዝገቡ",
    contactSubmit: "መልእክት ይላኩ",
    failure: "ጥያቄዎን አሁን መላክ አልቻልንም። እባክዎ ቆይተው ይሞክሩ።",
  },
  en: {
    success: "We received your request",
    demoSuccess: "We'll contact you shortly to arrange your demo.",
    contactSuccess: "We'll get back to you shortly.",
    another: "Send another request",
    name: "Full name",
    namePlaceholder: "Enter your name",
    business: "Business name",
    optional: "optional",
    businessPlaceholder: "Salon, barbershop or business name",
    email: "Email",
    phone: "Phone number",
    message: "Message",
    messagePlaceholder: "How can we help?",
    sending: "Sending...",
    demoSubmit: "Register for a demo",
    contactSubmit: "Send message",
    failure: "We couldn't send your request right now. Please try again shortly.",
  },
};

export default function LeadForm({ kind, source, showBusinessName = false, compact = false, language = "am" }: LeadFormProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState("");
  const t = formCopy[language];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      kind,
      source,
      name: data.get("name"),
      email: data.get("email"),
      phone: data.get("phone"),
      businessName: data.get("businessName"),
      message: data.get("message"),
      website: data.get("website"),
      locale: language === "en" ? "en-ET" : "am-ET",
    };

    try {
      if (!LEAD_API_BASE) throw new Error(t.failure);
      const response = await fetch(`${LEAD_API_BASE}/api/v1/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; code?: string; message?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(t.failure);

      form.reset();
      setStatus("success");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t.failure);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="am-lead-success" role="status">
        <span aria-hidden="true">✓</span>
        <p>{t.success}</p>
        <h2>{kind === "demo" ? t.demoSuccess : t.contactSuccess}</h2>
        <button type="button" onClick={() => setStatus("idle")}>{t.another}</button>
      </div>
    );
  }

  return (
    <form className={`am-lead-form${compact ? " compact" : ""}`} onSubmit={handleSubmit} aria-busy={status === "submitting"}>
      <div className="am-lead-field full">
        <label htmlFor={`${source}-${language}-name`}>{t.name}</label>
        <input id={`${source}-${language}-name`} name="name" type="text" autoComplete="name" required maxLength={100} placeholder={t.namePlaceholder} />
      </div>

      {showBusinessName && <div className="am-lead-field full">
        <label htmlFor={`${source}-${language}-business`}>{t.business} <span>{t.optional}</span></label>
        <input id={`${source}-${language}-business`} name="businessName" type="text" autoComplete="organization" maxLength={140} placeholder={t.businessPlaceholder} />
      </div>}

      <div className="am-lead-field">
        <label htmlFor={`${source}-${language}-email`}>{t.email}</label>
        <input id={`${source}-${language}-email`} name="email" type="email" inputMode="email" autoComplete="email" required maxLength={180} placeholder="name@example.com" />
      </div>
      <div className="am-lead-field">
        <label htmlFor={`${source}-${language}-phone`}>{t.phone}</label>
        <input id={`${source}-${language}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={40} placeholder="+251 ..." />
      </div>

      {kind === "contact" && <div className="am-lead-field full">
        <label htmlFor={`${source}-${language}-message`}>{t.message}</label>
        <textarea id={`${source}-${language}-message`} name="message" required maxLength={2500} rows={5} placeholder={t.messagePlaceholder} />
      </div>}

      <div className="am-honeypot" aria-hidden="true">
        <label htmlFor={`${source}-${language}-website`}>Website</label>
        <input id={`${source}-${language}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status === "error" && <p className="am-lead-error full" role="alert">{error}</p>}

      <button className="am-lead-submit full" type="submit" disabled={status === "submitting"}>
        <span>{status === "submitting" ? t.sending : kind === "demo" ? t.demoSubmit : t.contactSubmit}</span>
        <i aria-hidden="true">→</i>
      </button>
    </form>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import LeadForm from "../../components/LeadForm";

export const metadata: Metadata = {
  title: "Free demo | Aspio Ethiopia",
  description: "Register for a personal Aspio business plans demo.",
};

export default function EthiopiaEnglishRegistration() {
  return (
    <main className="am-lead-page">
      <section className="am-lead-story">
        <p className="am-lead-kicker"><span />ASPIO BUSINESS PLANS</p>
        <h1>Book Your Free<br /><em>Aspio Demo</em></h1>
        <p>Leave your name, email and phone number. Our team will contact you and show you exactly how Aspio can work for your business.</p>
        <ol className="am-lead-steps">
          <li><span>01</span><div><b>Send your details</b><small>Less than one minute</small></div></li>
          <li><span>02</span><div><b>Choose a time together</b><small>By phone or email</small></div></li>
          <li><span>03</span><div><b>See it live</b><small>A personal 30-minute demo</small></div></li>
        </ol>
        <Link href="/ethiopia/en/business">Compare all Aspio business plans <span>→</span></Link>
      </section>
      <section className="am-lead-card">
        <header><span>ASPIO / REGISTER</span><b>01—03</b></header>
        <div className="am-lead-card-title"><small>FREE DEMO</small><h2>Ready to get started?</h2></div>
        <LeadForm kind="demo" source="ethiopia-registration" showBusinessName language="en" />
        <footer><i />Your details are handled securely</footer>
      </section>
    </main>
  );
}

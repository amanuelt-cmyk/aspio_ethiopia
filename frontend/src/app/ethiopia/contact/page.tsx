import type { Metadata } from "next";
import LeadForm from "../components/LeadForm";

export const metadata: Metadata = {
  title: "Contact | Aspio Ethiopia",
  description: "Contact the Aspio Ethiopia team.",
};

export default function EthiopiaContactPage() {
  return (
    <main className="am-contact-page">
      <section className="am-contact-copy">
        <p className="am-lead-kicker"><span />CONTACT / ETHIOPIA</p>
        <h1>Have a question?<br /><em>Let&apos;s talk.</em></h1>
        <p>Ask us about Aspio plans, your website or how Aspio fits your business. Our team will get back to you shortly.</p>
        <div className="am-contact-details">
          <div><span>RESPONSE</span><b>Within one business day</b></div>
          <div><span>LANGUAGE</span><b>English</b></div>
          <div><span>EMAIL</span><b>semere.e@aspio.se</b></div>
        </div>
      </section>
      <section className="am-contact-form-card">
        <header><span>MESSAGE DESK</span><i>ADDIS ABABA</i></header>
        <LeadForm kind="contact" source="ethiopia-contact" showBusinessName />
      </section>
    </main>
  );
}

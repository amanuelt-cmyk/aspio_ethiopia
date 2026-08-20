import Link from "next/link";

const steps = [
  { n: "01", title: "Search", body: "Choose the right place by neighbourhood, price or service.", icon: "⌕" },
  { n: "02", title: "Choose a time", body: "See each professional's live availability before you book.", icon: "◷" },
  { n: "03", title: "Confirm", body: "Receive your confirmation immediately by SMS and email.", icon: "✓" },
  { n: "04", title: "Enjoy", body: "Show up for your appointment and leave the rest to us.", icon: "✓" },
];

const benefits = [
  { title: "Transparent pricing", body: "No hidden charges. Know the price before you confirm." },
  { title: "Instant confirmation", body: "Book in seconds and receive a reminder at the right time." },
  { title: "Verified professionals", body: "Every listed place is reviewed by the Aspio team." },
  { title: "Free cancellation", body: "Cancel up to 24 hours before your appointment without an extra fee." },
];

export default function EthiopiaHowItWorksPage() {
  return (
    <section className="am-page am-how">
      <div className="am-page-head">
        <p>HOW IT WORKS</p><h1>Four steps. One appointment.</h1>
        <span>Booking should not take time away from your day. Find and confirm the right appointment in a few minutes.</span>
      </div>
      <ol className="am-steps">
        {steps.map((step, index) => <li key={step.n} className="am-step" style={{ ["--i" as string]: index } as React.CSSProperties}><div className="am-step-num">{step.n}</div><div className="am-step-icon" aria-hidden="true">{step.icon}</div><h3>{step.title}</h3><p>{step.body}</p></li>)}
      </ol>
      <div className="am-benefits">
        <div className="am-section-head"><p>WHY ASPIO</p><h2>A completely better booking experience.</h2></div>
        <div className="am-benefit-grid">{benefits.map((benefit) => <article key={benefit.title} className="am-benefit"><i aria-hidden="true">✓</i><h3>{benefit.title}</h3><p>{benefit.body}</p></article>)}</div>
      </div>
      <div className="am-cta-band"><div><p>READY?</p><h2>Book your next appointment today.</h2></div><Link className="am-btn am-btn-light" href="/ethiopia/discover">Find a place<span aria-hidden="true">↗</span></Link></div>
    </section>
  );
}

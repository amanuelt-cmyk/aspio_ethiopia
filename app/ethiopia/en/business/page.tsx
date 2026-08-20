import Link from "next/link";
import { starterPlan } from "../../pricing";

const features = [
  { title: "Smart booking", body: "Accept online bookings around the clock, whenever it suits your clients." },
  { title: "Business website", body: "A website shaped around your brand that presents services and accepts bookings." },
  { title: "Customer records", body: "Keep visit history, useful notes and favourite services together." },
  { title: "Service menu", body: "Set prices, duration and team availability without complicated setup." },
  { title: "Automatic reminders", body: "Reduce missed appointments with timely SMS and email reminders." },
  { title: "Insights and reports", body: "Understand growth, popular services and customer behaviour." },
];

export default function EthiopiaEnglishBusiness() {
  return (
    <section className="am-page am-business">
      <div className="am-business-hero">
        <div>
          <p className="am-eyebrow"><span />FOR SALON OWNERS</p>
          <h1>Fill Your Chairs.<br /><strong>Calm Your Day.</strong><br />Grow Your Business.</h1>
          <p className="am-intro">Booking, customers and your business website in one simple system, built for Ethiopian businesses.</p>
          <ul className="am-check-list">
            <li><i aria-hidden="true">✓</i>0% commission on every appointment</li>
            <li><i aria-hidden="true">✓</i>A simple experience for clients and staff</li>
            <li><i aria-hidden="true">✓</i>No long-term contract. Cancel whenever you need.</li>
          </ul>
        </div>

        <aside className="am-offer-card">
          <span className="am-offer-tag">STARTER</span>
          <div className="am-offer-price"><strong>{starterPlan.price}</strong><div><b>ETB</b><small>/ month</small></div></div>
          <h3>A strong place to start.</h3>
          <ul>{starterPlan.features.map((item) => <li key={item}><i aria-hidden="true">✓</i>{item}</li>)}</ul>
          <small>{starterPlan.setupFee} · 0% booking commission</small>
        </aside>
      </div>

      <div className="am-feature-band">
        <div className="am-section-head"><p>WHY ASPIO</p><h2>Your familiar workday, with a much better rhythm.</h2></div>
        <div className="am-feature-grid">
          {features.map((feature, index) => <article key={feature.title} className="am-feature" style={{ ["--i" as string]: index } as React.CSSProperties}><span aria-hidden="true">✓</span><h3>{feature.title}</h3><p>{feature.body}</p></article>)}
        </div>
      </div>

      <div className="am-form-band">
        <div><p className="am-eyebrow"><span />FREE DEMO</p><h2>See the Aspio plans in action.</h2><p>A personal 30-minute walkthrough tailored to your business, with no commitment.</p></div>
        <Link className="am-business-demo-card" href="/ethiopia/en/register">
          <span>01</span>
          <div><small>PERSONAL DEMO</small><b>Open the registration form</b></div>
          <i aria-hidden="true">↗</i>
        </Link>
      </div>
    </section>
  );
}

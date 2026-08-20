import Link from "next/link";
import { ethiopiaPlans } from "../pricing";

export default function BusinessPackage() {
  return (
    <section className="am-package" id="package" data-am-reveal>
      <header className="am-package-heading">
        <div>
          <p>PLANS FOR EVERY STAGE</p>
          <h2>Start where you are.<br /><em>Grow without starting over.</em></h2>
        </div>
        <span>Four straightforward plans for salons, barbershops and beauty businesses. All prices are in ETB.</span>
      </header>

      <div className="am-package-journey" aria-hidden="true">
        {ethiopiaPlans.map((plan) => <span key={plan.id}><i>{plan.index}</i><b>{plan.name}</b></span>)}
      </div>

      <div className="am-package-grid">
        {ethiopiaPlans.map((plan) => (
          <article className={`am-package-plan${plan.featured ? " featured" : ""}`} key={plan.name}>
            <header>
              <span>{plan.index} / PLAN</span>
              {plan.featured && <em>MOST CHOSEN</em>}
            </header>
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <div className="am-package-price"><strong>{plan.price}</strong><span><b>ETB</b>/ month</span></div>
            <div className="am-package-setup"><i />{plan.setupFee}</div>
            <Link href="/ethiopia/register">Book a demo<span aria-hidden="true">→</span></Link>
            <div className="am-package-included">
              <small>INCLUDED IN {plan.name.toUpperCase()}</small>
              <ul>{plan.features.map((feature) => <li key={feature}><i aria-hidden="true">✓</i><span>{feature}</span></li>)}</ul>
            </div>
            <footer><i />0% booking commission</footer>
          </article>
        ))}
      </div>

      <footer className="am-package-footnote">
        <span>Need help choosing?</span>
        <p>We will recommend the plan that fits your team today, one that still makes sense as you grow.</p>
        <Link href="/ethiopia/business">Compare the business tools<span aria-hidden="true">↗</span></Link>
      </footer>
    </section>
  );
}

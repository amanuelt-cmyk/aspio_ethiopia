import Link from "next/link";
import type { Metadata } from "next";
import LeadForm from "../components/LeadForm";

export const metadata: Metadata = {
  title: "ነፃ ማሳያ | Aspio Ethiopia",
  description: "ለAspio Business Starter + Website የግል ማሳያ ይመዝገቡ።",
};

export default function EthiopiaRegistrationPage() {
  return (
    <main className="am-lead-page">
      <section className="am-lead-story">
        <p className="am-lead-kicker"><span />BUSINESS STARTER + WEBSITE</p>
        <h1>የንግድዎ<br />ቀጣይ ምዕራፍ<br /><em>እዚህ ይጀምራል።</em></h1>
        <p>ስምዎን፣ ኢሜይልዎን እና ስልክዎን ያስገቡ። ቡድናችን አስፒዮ ለንግድዎ እንዴት እንደሚሰራ ለማሳየት ያገኝዎታል።</p>

        <ol className="am-lead-steps">
          <li><span>01</span><div><b>መረጃዎን ይላኩ</b><small>ከአንድ ደቂቃ በታች</small></div></li>
          <li><span>02</span><div><b>ጊዜ እናስማማለን</b><small>በስልክ ወይም በኢሜይል</small></div></li>
          <li><span>03</span><div><b>በቀጥታ ይመልከቱ</b><small>የ30 ደቂቃ የግል ማሳያ</small></div></li>
        </ol>

        <Link href="/ethiopia/business">Business Starter + Website ምን ያካትታል? <span>→</span></Link>
      </section>

      <section className="am-lead-card">
        <header><span>ASPIO / REGISTER</span><b>01—03</b></header>
        <div className="am-lead-card-title"><small>ነፃ ማሳያ</small><h2>ለመጀመር ዝግጁ ነዎት?</h2></div>
        <LeadForm kind="demo" source="ethiopia-registration" showBusinessName />
        <footer><i />መረጃዎ በደህንነት ይጠበቃል</footer>
      </section>
    </main>
  );
}

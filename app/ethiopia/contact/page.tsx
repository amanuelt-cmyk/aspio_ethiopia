import type { Metadata } from "next";
import LeadForm from "../components/LeadForm";

export const metadata: Metadata = {
  title: "ያግኙን | Aspio Ethiopia",
  description: "የAspio Ethiopia ቡድንን ያግኙ።",
};

export default function EthiopiaContactPage() {
  return (
    <main className="am-contact-page">
      <section className="am-contact-copy">
        <p className="am-lead-kicker"><span />CONTACT / ያግኙን</p>
        <h1>ጥያቄ አለዎት?<br /><em>እንነጋገር።</em></h1>
        <p>ስለ Business Starter፣ ድረ-ገጽዎ ወይም የአስፒዮ አገልግሎት ይጠይቁን። ቡድናችን በቅርቡ መልስ ይሰጥዎታል።</p>
        <div className="am-contact-details">
          <div><span>RESPONSE</span><b>በ1 የስራ ቀን ውስጥ</b></div>
          <div><span>LANGUAGE</span><b>አማርኛ · English</b></div>
          <div><span>EMAIL</span><b>amanuel.t@aspio.se</b></div>
        </div>
      </section>

      <section className="am-contact-form-card">
        <header><span>MESSAGE DESK</span><i>AM / ET</i></header>
        <LeadForm kind="contact" source="ethiopia-contact" showBusinessName />
      </section>
    </main>
  );
}

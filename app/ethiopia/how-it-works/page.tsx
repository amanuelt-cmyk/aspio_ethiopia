import Link from "next/link";

const steps = [
  { n: "01", title: "ይፈልጉ", body: "በአካባቢ፣ በዋጋ ወይም በአገልግሎት ተስማሚ ቦታ ይምረጡ።", icon: "⌕" },
  { n: "02", title: "ጊዜ ይምረጡ", body: "የባለሙያውን ክፍት ሰዓት በቀጥታ ይመልከቱ።", icon: "◷" },
  { n: "03", title: "ያረጋግጡ", body: "ማረጋገጫ በSMS እና በኢሜይል ወዲያውኑ ይደርስዎታል።", icon: "✓" },
  { n: "04", title: "ይደሰቱ", body: "ወደ ቀጠሮዎ ይሂዱ፤ ቀሪውን ለእኛ ይተዉ።", icon: "✓" },
];

const benefits = [
  { title: "ግልጽ ዋጋ", body: "የተደበቀ ክፍያ የለም። ከመቀጠሮዎ በፊት የሚከፍሉትን ያውቃሉ።" },
  { title: "ፈጣን ማረጋገጫ", body: "ቀጠሮ በሰከንዶች ውስጥ። ማስታወሻ በተዘጋጀው ጊዜ።" },
  { title: "የተረጋገጡ ባለሙያዎች", body: "ሁሉም ቦታዎች በአስፒዮ ቡድን ተመርምረዋል።" },
  { title: "ነፃ ስረዛ", body: "እስከ 24 ሰዓት ድረስ ያለ ተጨማሪ ክፍያ መሰረዝ ይችላሉ።" },
];

export default function EthiopiaV3HowItWorks() {
  return (
    <section className="am-page am-how">
      <div className="am-page-head">
        <p>እንዴት ይሰራል</p>
        <h1>አራት እርምጃ። አንድ ቀጠሮ።</h1>
        <span>የተለመደው ቀጠሮ ማስያዝ ጊዜ የሚወስድ መሆን የለበትም። ከቤትዎ ወይም ከሥራ ቦታዎ በጥቂት ደቂቃዎች ውስጥ ይጨርሱ።</span>
      </div>

      <ol className="am-steps">
        {steps.map((step, i) => (
          <li key={step.n} className="am-step" style={{ ["--i" as string]: i } as React.CSSProperties}>
            <div className="am-step-num">{step.n}</div>
            <div className="am-step-icon" aria-hidden="true">{step.icon}</div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="am-benefits">
        <div className="am-section-head">
          <p>ለምን አስፒዮ</p>
          <h2>ቀጠሮ በጠቅላላ የተለየ ስሜት።</h2>
        </div>
        <div className="am-benefit-grid">
          {benefits.map((b) => (
            <article key={b.title} className="am-benefit">
              <i aria-hidden="true">✓</i>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="am-cta-band">
        <div>
          <p>ዝግጁ ነዎት?</p>
          <h2>ቀጣይ ቀጠሮዎን ዛሬ ይያዙ።</h2>
        </div>
        <Link className="am-btn am-btn-light" href="/ethiopia/discover">ቦታ ይፈልጉ<span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}

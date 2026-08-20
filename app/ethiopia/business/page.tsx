import Link from "next/link";

const features = [
  { title: "ብልህ ቀጠሮ", body: "24/7 የመስመር ላይ ቀጠሮ። ደንበኞችዎ በራሳቸው ጊዜ ያስይዛሉ።" },
  { title: "የንግድ ድረ-ገጽ", body: "አገልግሎቶችዎን የሚያሳይ እና ቀጠሮ የሚቀበል ለብራንድዎ የተሰራ ድረ-ገጽ።" },
  { title: "የደንበኛ መዝገብ", body: "የደንበኞችዎን ታሪክ፣ ማስታወሻ እና ተመራጭ አገልግሎት ያከማቹ።" },
  { title: "የአገልግሎት ማውጫ", body: "ዋጋ፣ ጊዜ እና የቡድን አባላትን በቀላሉ ያዘጋጁ።" },
  { title: "ራስ ሰር ማስታወሻ", body: "የSMS እና ኢሜይል ማስታወሻ—ያልተገኙ ቀጠሮዎችን ይቀንሱ።" },
  { title: "ትንታኔ እና ሪፖርት", body: "እድገትዎን፣ ተወዳጅ አገልግሎቶችዎን እና የደንበኞችዎን ባህሪ ይመልከቱ።" },
];

const included = [
  "የመስመር ላይ ቀጠሮ",
  "ለንግድዎ የተሰራ ድረ-ገጽ",
  "የደንበኛ መዝገብ",
  "የSMS እና ኢሜይል ማስታወሻ",
  "የንግድ ሪፖርት",
  "የአማርኛ ድጋፍ",
];

export default function EthiopiaV3Business() {
  return (
    <section className="am-page am-business">
      <div className="am-business-hero">
        <div>
          <p className="am-eyebrow"><span />ለሳሎን ባለቤቶች</p>
          <h1>ወንበርዎን<br /><strong>በደንበኞች</strong><br />ይሙሉ።</h1>
          <p className="am-intro">ቀጠሮ፣ ደንበኛ እና የንግድ ድረ-ገጽ—በአንድ ቀላል የስራ ፍሰት። ለኢትዮጵያ ንግዶች የተዘጋጀ።</p>
          <ul className="am-check-list">
            <li><i aria-hidden="true">✓</i>0% ኮሚሽን በእያንዳንዱ ቀጠሮ</li>
            <li><i aria-hidden="true">✓</i>የአማርኛ ድጋፍ በስልክ እና በኢሜይል</li>
            <li><i aria-hidden="true">✓</i>ውል የለም — በማንኛውም ጊዜ ማቋረጥ ይችላሉ</li>
          </ul>
        </div>

        <aside className="am-offer-card">
          <span className="am-offer-tag">BUSINESS STARTER + WEBSITE</span>
          <div className="am-offer-price">
            <strong>5,000</strong>
            <div><b>ብር</b><small>/ በወር*</small></div>
          </div>
          <s>ተራ 7,500 ብር</s>
          <h3>ለመጀመር የሚያስፈልግዎ ሁሉ።</h3>
          <ul>
            {included.map((item) => <li key={item}><i aria-hidden="true">✓</i>{item}</li>)}
          </ul>
          <small>የመጫኛ ክፍያ 2,000 ብር · 0% ኮሚሽን</small>
        </aside>
      </div>

      <div className="am-feature-band">
        <div className="am-section-head">
          <p>ለምን አስፒዮ</p>
          <h2>የተለመደው ስራዎ፣ በተለየ ስሜት።</h2>
        </div>
        <div className="am-feature-grid">
          {features.map((feature, index) => (
            <article key={feature.title} className="am-feature" style={{ ["--i" as string]: index } as React.CSSProperties}>
              <span aria-hidden="true">✓</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="am-form-band">
        <div>
          <p className="am-eyebrow"><span />ነፃ ማሳያ</p>
          <h2>Business Starter + Websiteን በቀጥታ ይመልከቱ።</h2>
          <p>የ30 ደቂቃ ማሳያ በአማርኛ ወይም በእንግሊዝኛ። ምንም ግዴታ የለም።</p>
        </div>
        <Link className="am-business-demo-card" href="/ethiopia/register">
          <span>01</span>
          <div><small>የግል ማሳያ</small><b>መረጃዎን ይሙሉ</b></div>
          <i aria-hidden="true">↗</i>
        </Link>
      </div>
    </section>
  );
}

"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calendarAppointments, clientInitials } from "./calendarSchedule";
import AddisMap from "./components/AddisMap";
import BusinessPackage from "./components/BusinessPackage";
import { places } from "./data";
import EthiopiaEnglishHome from "./en/page";
import { addisAreas, getAreaSalons } from "./mapData";
import { useBackendSalons } from "./useBackendSalons";
import { useFeaturedPlaces } from "./useFeaturedPlaces";

const services = [
  { icon: "✂", name: "ፀጉር መቁረጥ", meta: "60 ደቂቃ · 450 ብር" },
  { icon: "◇", name: "የፀጉር ቀለም", meta: "120 ደቂቃ · 900 ብር" },
  { icon: "◎", name: "ማማከር", meta: "20 ደቂቃ · ነፃ" },
];

const highlights = [
  { href: "/ethiopia/discover", tag: "ማርኬትፕሌስ", title: "የከተማዋ ምርጥ ቦታዎች", body: "የተረጋገጡ ሳሎኖችን፣ ባርበሮችን እና ስፓዎችን ያስሱ።" },
  { href: "/ethiopia/how-it-works", tag: "አሰራራችን", title: "ሦስት እርምጃ። አንድ ቀጠሮ።", body: "ይፈልጉ፣ ጊዜ ይምረጡ፣ ማረጋገጫ ያግኙ።" },
  { href: "/ethiopia/business", tag: "ለንግድ", title: "ወንበርን በደንበኞች ይሙሉ", body: "Business Starter ከንግድ ድረ-ገጽ ጋር።" },
];

const ethMonths = [
  "መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት",
  "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ",
];
const ethWeekdays = ["ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "ዓርብ", "ቅዳሜ", "እሁድ"];
const heroDays = [
  { day: "ዛሬ", date: "15", month: "ሰኔ" },
  { day: "ነገ", date: "16", month: "ሰኔ" },
  { day: "ረቡዕ", date: "17", month: "ሰኔ" },
];
const heroTimes = ["09:30", "11:00", "13:30", "15:00", "16:30", "18:00"];
const marqueeWords = ["ውበት", "ሳሎን", "ባርበር", "ስፓ", "ቀጠሮ", "ማራኪ", "ዘመናዊ", "አስፒዮ", "ኢትዮጵያ"];
const cityNodes = addisAreas.map((area) => ({ ...area, name: area.nameAm }));
const featuredCityNodes = cityNodes.filter((area) => area.featured);
const bundledFeatured = places.slice(0, 6);

const stats: [string, string][] = [
  ["500+", "የተመዘገቡ ቦታዎች"],
  ["12,000+", "የተያዙ ቀጠሮዎች"],
  ["4.8 / 5", "የደንበኞች ደረጃ"],
  ["0%", "ኮሚሽን — ሁሌም"],
];

const neighborhoods = [
  { name: "ቦሌ", count: 84, trend: true },
  { name: "ፒያሳ", count: 62 },
  { name: "ካዛንቺስ", count: 47 },
  { name: "ሳሪስ", count: 39 },
  { name: "መገናኛ", count: 55 },
  { name: "4 ኪሎ", count: 33 },
  { name: "ኦልድ ኤርፖርት", count: 41 },
  { name: "ሲኤምሲ", count: 28 },
  { name: "ገርጂ", count: 24 },
  { name: "ለቡ", count: 19 },
];

const testimonials = [
  {
    quote: "የቀጠሮ አያያዝ እጅግ ቀላል ሆኗል። አሁን ደንበኞቼ ማታም ቢሆን ቀጠሮ ያስይዛሉ።",
    name: "ሉሲ ተስፋዬ",
    role: "ሉሲ ቢዩቲ ላውንጅ · ቦሌ",
    initial: "ሉ",
  },
  {
    quote: "ጊዜ የሚሻማ የስልክ ጥሪ ቀርቷል። አሁን ሙሉ ትኩረቴ ደንበኞቼ ላይ ነው።",
    name: "ዳዊት አለሙ",
    role: "አዲስ ባርበር ክለብ · ፒያሳ",
    initial: "ዳ",
  },
  {
    quote: "በኢትዮጵያ የቀን አቆጣጠር መስራቱ ብቻ ሳይሆን አጠቃቀሙም እጅግ ምቹ ነው።",
    name: "ሰላም ደጀኔ",
    role: "እፎይታ ስፓ · ሀያ ሁለት",
    initial: "ሰ",
  },
  {
    quote: "ማስታወሻዎቹ ደንበኞች ቀጠሮ እንዳይረሱ አድርገዋል። በ80% ለውጥ አምጥተናል።",
    name: "ኪሮስ ገብረ",
    role: "ኪንግስ ባርበር · ሲኤምሲ",
    initial: "ኪ",
  },
];

const faqs = [
  {
    q: "ውል ማሰር ያስፈልጋል?",
    a: "አያስፈልግም። ምንም ዓይነት ውል የለም፤ በማንኛውም ጊዜ ያለ ተጨማሪ ክፍያ ማቋረጥ ይቻላል።",
  },
  {
    q: "Business Starter + Website ምን ምን ያካትታል?",
    a: "የኦንላይን ቀጠሮ፣ የደንበኞች መዝገብ፣ አውቶማቲክ ማስታወሻ፣ ሪፖርት እና ለንግድ የተሰራ ዘመናዊ ድረ-ገጽን ያካትታል።",
  },
  {
    q: "የኮሚሽን ክፍያው ስንት ነው?",
    a: "ምንም ኮሚሽን የለም። ሙሉ ገቢው የንግዱ ነው። የምንጠይቀው ወርሃዊ ክፍያ ብቻ ነው።",
  },
  {
    q: "ደንበኞች በአማርኛ ቀጠሮ ማስያዝ ይችላሉ?",
    a: "አዎ። ሙሉ ስርዓቱ በአማርኛ እና በእንግሊዝኛ ይሰራል። ደንበኞች የሚፈልጉትን ቋንቋ መምረጥ ይችላሉ።",
  },
  {
    q: "ስልጠና ይሰጣል?",
    a: "አዎ። ሲስተሙን በነፃ የማዋቀር እና የ2 ሰዓት ስልጠና ለሰራተኞች እንሰጣለን።",
  },
];

function ethNum(n: number) {
  const digits = ["፩","፪","፫","፬","፭","፮","፯","፰","፱","፲"];
  if (n <= 0) return "";
  if (n <= 10) return digits[n - 1];
  return String(n);
}

export function EthiopiaAmharicHome() {
  const marketplacePlaces = useBackendSalons("am", places);
  const featured = useFeaturedPlaces("am", bundledFeatured);
  const [step, setStep] = useState(0);
  const [month, setMonth] = useState(10);
  const [selectedDay, setSelectedDay] = useState(15);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [activeCityNode, setActiveCityNode] = useState(0);
  const [heroService, setHeroService] = useState(0);
  const [heroDay, setHeroDay] = useState(1);
  const [heroTime, setHeroTime] = useState(2);

  const daysInMonth = month === 12 ? 6 : 30;
  const todayDay = 15;
  const selectedAppointments = useMemo(() => calendarAppointments(selectedDay, month, "am"), [month, selectedDay]);
  const availableCount = 8 - selectedAppointments.length;
  const mappedPlaces = useMemo(() => marketplacePlaces.filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude)), [marketplacePlaces]);
  const locatorNodes = useMemo(() => mappedPlaces.length ? mappedPlaces.map((place, index) => ({ id: place.id ?? place.slug ?? `salon-${index}`, name: place.name, count: 1, lat: place.latitude!, lng: place.longitude! })) : cityNodes, [mappedPlaces]);
  const safeCityNode = Math.min(activeCityNode, Math.max(0, locatorNodes.length - 1));
  const selectedCityNode = locatorNodes[safeCityNode];
  const quickCityNodes = mappedPlaces.length ? locatorNodes.slice(0, 7) : featuredCityNodes;
  const locatorPlaces = useMemo(() => {
    if (!mappedPlaces.length) return getAreaSalons(addisAreas[safeCityNode], "am").map((place) => ({ ...place, slug: undefined as string | undefined, tag: "" }));
    const selected = mappedPlaces[safeCityNode];
    return mappedPlaces
      .map((place) => ({ place, distance: Math.hypot((place.latitude ?? 0) - (selected.latitude ?? 0), (place.longitude ?? 0) - (selected.longitude ?? 0)) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(({ place }, index) => ({ ...place, id: place.id ?? place.slug ?? `nearby-${index}`, time: "", tag: place.tag }));
  }, [mappedPlaces, safeCityNode]);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-am-reveal]"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("is-in"); });
    }, { threshold: 0.14 });
    els.forEach((el) => io.observe(el));

    const onScroll = () => {
      const y = window.scrollY;
      document.documentElement.style.setProperty("--am-scroll", String(Math.min(y / 700, 1)));
      document.documentElement.style.setProperty("--am-scroll-y", String(y));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setActiveTestimonial((i) => (i + 1) % testimonials.length), 5500);
    return () => window.clearInterval(t);
  }, []);

  return (
    <>
      <svg className="am-svg-defs" width="0" height="0" aria-hidden="true">
        <defs>
          <pattern id="am-habesha" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M30 6 L34 26 L54 30 L34 34 L30 54 L26 34 L6 30 L26 26 Z" fill="none" stroke="rgba(121,0,232,.18)" strokeWidth="1" />
            <circle cx="30" cy="30" r="2" fill="rgba(121,0,232,.35)" />
          </pattern>
        </defs>
      </svg>

      <section className="am-hero" data-am-reveal>
        <div className="am-hero-fidel" aria-hidden="true">አ ስ ፒ ዮ</div>
        <div className="am-hero-pattern" aria-hidden="true">
          <svg width="100%" height="100%"><rect width="100%" height="100%" fill="url(#am-habesha)" /></svg>
        </div>
        <div className="am-hero-copy">
          <p className="am-eyebrow"><span />ቀጠሮ፣ ድረ-ገጽ እና እድገት — ለንግድ ስራ</p>
          <h1>
            <span>ሙሉ የቀጠሮ ደብተር።</span>
            <strong>የተረጋጋ ሳሎን።</strong>
          </h1>
          <p className="am-intro">
            አስፒዮ Business Starter ቀጠሮዎችን፣ ደንበኞችን እና የንግድ ድረ-ገጽን በአንድ ቀላል የስራ ሂደት ያገናኛል።
          </p>

          <div className="am-offer">
            <div><span>BUSINESS STARTER + WEBSITE</span><b>የንግድ መሳሪያዎች + ዘመናዊ ድረ-ገጽ</b></div>
            <div className="am-price">
              <strong>5,000</strong>
              <span><b>ብር</b>/ በወር*</span>
            </div>
            <small>የቀጠሮ ስርዓት፣ የደንበኞች መዝገብ እና የንግድ ድረ-ገጽ ተካትተዋል።</small>
          </div>

          <div className="am-hero-actions">
            <Link className="am-btn am-btn-primary" href="/ethiopia/register">ነፃ ዴሞ ያግኙ<span aria-hidden="true">↗</span></Link>
            <Link className="am-btn am-btn-text" href="/ethiopia/discover"><i aria-hidden="true">▶</i>ቦታዎችን ይመልከቱ</Link>
          </div>
        </div>

        <div className="am-stage">
          <div className="am-stage-orbit" aria-hidden="true"><i /><i /><i /></div>
          <div className="am-device">
            <div className="am-laptop">
              <div className="am-laptop-camera" aria-hidden="true"><i /></div>
              <div className="am-browser">
                <span><i /><i /><i /></span>
                <b><i /> book.aspio.et/lucy</b>
                <em><i />በኦንላይን</em>
              </div>
              <div className="am-booking">
                <aside className="am-app-rail" aria-label="Booking navigation">
                  <div>A</div>
                  <button type="button" className="active" aria-label="Book">⌁</button>
                  <button type="button" aria-label="Calendar">▦</button>
                  <button type="button" aria-label="Profile">◉</button>
                  <span>AM</span>
                </aside>

                <main className="am-booking-main">
                  <header>
                    <div className="am-salon-avatar">ሉ</div>
                    <div><b>ሉሲ ቢዩቲ ላውንጅ</b><small>ቦሌ · አዲስ አበባ</small></div>
                    <button type="button" aria-label="More options">••</button>
                  </header>

                  <nav className="am-flow-tabs" aria-label="የቀጠሮ ደረጃዎች">
                    {["አገልግሎት", "ቀን", "ሰዓት", "ማረጋገጫ"].map((label, i) => (
                      <button key={label} type="button" className={`${i === step ? "active" : ""} ${i < step ? "done" : ""}`} onClick={() => { if (i <= step) setStep(i); }}>
                        <i>{i < step ? "✓" : `0${i + 1}`}</i><span>{label}</span>
                      </button>
                    ))}
                  </nav>

                  <section className="am-step-panel" key={step}>
                    {step === 0 && <>
                      <div className="am-step-heading"><span>01 / 04</span><h2>ምን አገልግሎት ይፈልጋሉ?</h2><small>አንድ አገልግሎት ይምረጡ</small></div>
                      <div className="am-services">
                        {services.map((service, i) => (
                          <button key={service.name} type="button" className={heroService === i ? "selected" : ""} onClick={() => { setHeroService(i); setStep(1); }}>
                            <span>{service.icon}</span><div><b>{service.name}</b><small>{service.meta}</small></div><i aria-hidden="true">→</i>
                          </button>
                        ))}
                      </div>
                    </>}

                    {step === 1 && <>
                      <div className="am-step-heading"><span>02 / 04</span><h2>ቀን ይምረጡ</h2><small>{services[heroService].name} · {services[heroService].meta}</small></div>
                      <div className="am-quick-days">
                        {heroDays.map((item, i) => <button key={item.date} type="button" className={heroDay === i ? "selected" : ""} onClick={() => { setHeroDay(i); setStep(2); }}><small>{item.day}</small><b>{item.date}</b><span>{item.month}</span></button>)}
                      </div>
                      <button className="am-flow-back" type="button" onClick={() => setStep(0)}>← አገልግሎት ይቀይሩ</button>
                    </>}

                    {step === 2 && <>
                      <div className="am-step-heading"><span>03 / 04</span><h2>ምቹ ሰዓት ይምረጡ</h2><small>{heroDays[heroDay].day} · {heroDays[heroDay].month} {heroDays[heroDay].date}</small></div>
                      <div className="am-quick-times">
                        {heroTimes.map((time, i) => <button key={time} type="button" className={heroTime === i ? "selected" : ""} onClick={() => { setHeroTime(i); setStep(3); }}><span>{time}</span><small>{i === 2 ? "ተመራጭ" : "ክፍት"}</small></button>)}
                      </div>
                      <button className="am-flow-back" type="button" onClick={() => setStep(1)}>← ቀን ይቀይሩ</button>
                    </>}

                    {step === 3 && <div className="am-confirmation">
                      <div className="am-confirm-mark"><i>✓</i><span /><span /></div>
                      <div><small>ቀጠሮው ተረጋግጧል</small><h2>{heroDays[heroDay].day} · {heroTimes[heroTime]}</h2><p>{services[heroService].name} — ሉሲ ቢዩቲ ላውንጅ</p></div>
                      <footer><span><small>የቀጠሮ ቁጥር</small><b>AS-2406</b></span><button type="button" onClick={() => setStep(0)}>ሌላ ቀጠሮ ይያዙ ↻</button></footer>
                    </div>}
                  </section>
                </main>
              </div>
            </div>
            <div className="am-laptop-deck" aria-hidden="true">
              <div className="am-keyboard">{Array.from({ length: 36 }).map((_, i) => <i key={i} />)}</div>
              <span />
            </div>
          </div>
          <div className="am-float am-float-top">
            <span aria-hidden="true">✓</span>
            <div><b>ቀጠሮ ተረጋግጧል</b><small>ሚሚ · አሁን</small></div>
          </div>
          <div className="am-float am-float-bottom">
            <b>82%</b>
            <div><span aria-hidden="true"><i /></span><small>የዛሬው ቦታ ተይዟል</small></div>
          </div>
        </div>
      </section>

      <div className="am-marquee" aria-hidden="true">
        <div className="am-marquee-track">
          {[...marqueeWords, ...marqueeWords, ...marqueeWords].map((word, i) => (
            <span key={i}>
              {word}
              <em />
            </span>
          ))}
        </div>
      </div>

      <section className="am-locator" data-am-reveal>
        <header className="am-locator-head">
          <div>
            <p><span>ADDIS ABABA</span> · በአቅራቢያ</p>
            <h2>በከተማው ያሉ<br />ምርጥ ቦታዎችን ያግኙ።</h2>
          </div>
          <Link href="/ethiopia/discover">ማርኬትፕሌሱን ይመልከቱ <span>↗</span></Link>
        </header>

        <div className="am-locator-scroll-scene">
          <div className="am-locator-shell am-locator-sticky">
          <aside className="am-locator-panel">
            <div className="am-locator-search"><span aria-hidden="true">⌕</span><b>ሰፈር ወይም አገልግሎት ይፈልጉ</b><kbd>↵</kbd></div>
            <div className="am-locator-result-head">
              <div><small>የተመረጠ ቦታ</small><h3>{selectedCityNode.name}</h3></div>
              <span><b>{mappedPlaces.length || selectedCityNode.count}</b> ቦታዎች</span>
            </div>

            <div className="am-locator-list">
              {locatorPlaces.map((place, index) => (
                <Link key={place.id} href="https://app.aspio.io/" className={index === 0 ? "active" : ""}>
                  <img src={place.image} alt="" />
                  <span>
                    <small>{place.type}</small>
                    <strong>{place.name}</strong>
                    <em>{place.rating} / 5 · {place.price}</em>
                  </span>
                  <i>{index === 0 ? (place.time ? `ዛሬ ${place.time}` : place.tag) : "→"}</i>
                </Link>
              ))}
            </div>

            <Link className="am-locator-more" href="/ethiopia/discover">በ{selectedCityNode.name} አቅራቢያ ያሉትን ይመልከቱ <span>→</span></Link>
          </aside>

            <AddisMap locations={locatorNodes} activeIndex={safeCityNode} onSelect={setActiveCityNode} language="am" />
          </div>
        </div>

        <nav className="am-locator-areas" aria-label="የአዲስ አበባ ሰፈሮች">
          {quickCityNodes.map((node, i) => <button key={node.id} type="button" className={safeCityNode === i ? "active" : ""} onClick={() => setActiveCityNode(i)}><span>0{i + 1}</span>{node.name}<small>{node.count}</small></button>)}
        </nav>
      </section>

      <section className="am-stats" data-am-reveal>
        <div className="am-stats-intro"><span>ASPIO / በቁጥር</span><p>የከተማዋ የውበት<br />ንግድ በአንድ ቦታ።</p></div>
        {stats.map(([value, label], i) => (
          <div key={label} className="am-stat" style={{ ["--i" as string]: i } as React.CSSProperties}>
            <small>0{i + 1}</small>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="am-calendar-section" data-am-reveal>
        <div className="am-calendar-copy">
          <p className="am-eyebrow"><span />የኢትዮጵያ የቀን መቁጠሪያ</p>
          <h2>ቀጠሮዎን በኢትዮጵያ<br /><em>ቀን መቁጠሪያ</em> ይያዙ።</h2>
          <p className="am-intro">
            13 ወራት፣ የአማርኛ ስም እና በቀጥታ የሚታዩ ክፍት ሰዓቶች። እንደ ሰፈር ስሜት፣ እንደ ዓለም አቀፍ ጥራት።
          </p>
          <div className="am-calendar-legend">
            <span><i className="dot dot-purple" />ተመርጧል</span>
            <span><i className="dot dot-today" />ዛሬ</span>
            <span><i className="dot dot-busy" />ተያዘ</span>
            <span><i className="dot dot-free" />ክፍት</span>
          </div>
          <div className="am-calendar-summary">
            <div>
              <small>የተመረጠው ቀን</small>
              <b>{ethMonths[month]} {selectedDay}፣ 2018</b>
            </div>
            <div>
              <small>የዕለቱ አቅም</small>
              <b>{selectedAppointments.length} ተይዟል · {availableCount} ክፍት</b>
            </div>
          </div>
        </div>

        <div className="am-calendar">
          <div className="am-calendar-toolbar">
            <button
              type="button"
              className="am-cal-nav"
              onClick={() => setMonth((m) => (m + 12) % 13)}
              aria-label="የቀደመ ወር"
            >‹</button>
            <div className="am-cal-title">
              <strong>{ethMonths[month]}</strong>
              <span>2018 ዓ.ም · Ethiopian Calendar</span>
            </div>
            <button
              type="button"
              className="am-cal-nav"
              onClick={() => setMonth((m) => (m + 1) % 13)}
              aria-label="ቀጣይ ወር"
            >›</button>
          </div>

          <div className="am-cal-months">
            {ethMonths.map((m, i) => (
              <button
                key={m}
                type="button"
                className={i === month ? "on" : ""}
                onClick={() => setMonth(i)}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="am-cal-weekdays">
            {ethWeekdays.map((d) => <span key={d}>{d}</span>)}
          </div>

          <div className="am-cal-grid" style={{ ["--offset" as string]: month * 2 % 7 } as React.CSSProperties}>
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = month === 10 && day === todayDay;
              const isSelected = day === selectedDay;
              const appointments = calendarAppointments(day, month, "am");
              const calendarColumn = ((month * 2 % 7) + i) % 7;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`am-cal-day${isSelected ? " selected" : ""}${isToday ? " today" : ""}${appointments.length ? " has-events" : ""}${appointments.length >= 3 ? " full" : ""}${isSelected && day > 21 ? " popover-up" : ""}${isSelected && calendarColumn < 2 ? " popover-left" : ""}${isSelected && calendarColumn > 4 ? " popover-right" : ""}`}
                  style={i === 0 ? { gridColumnStart: (month * 2 % 7) + 1 } : undefined}
                >
                  <span className="am-cal-date">
                    <strong>{ethNum(day)}</strong>
                    <small>{appointments.length ? `${appointments.length} ቀጠሮ` : "ክፍት"}</small>
                  </span>
                  <span className="am-cal-events">
                    {appointments.slice(0, 2).map((appointment) => (
                      <span className={`am-cal-event ${appointment.tone}`} key={`${appointment.time}-${appointment.name}`}>
                        <i aria-hidden="true">{clientInitials(appointment.name)}</i>
                        <span>{appointment.name}</span>
                        <time>{appointment.time}</time>
                      </span>
                    ))}
                    {appointments.length > 2 && <small className="am-cal-more">+{appointments.length - 2} ተጨማሪ</small>}
                  </span>
                  {isToday && <i className="am-cal-today-dot" aria-hidden="true" />}
                  {isSelected && (
                    <span className="am-cal-popover" role="status">
                      <span className="am-cal-popover-top"><small>የተመረጠ ቀን</small><em><i />የቀጥታ መርሐ ግብር</em></span>
                      <strong>{ethMonths[month]} {ethNum(day)}</strong>
                      <span className="am-cal-popover-metrics">
                        <span><b>{appointments.length}</b><small>ደንበኞች</small></span>
                        <span><b>{8 - appointments.length}</b><small>ክፍት ሰዓቶች</small></span>
                      </span>
                      {appointments[0] ? (
                        <span className="am-cal-popover-next">
                          <i aria-hidden="true">{clientInitials(appointments[0].name)}</i>
                          <span><small>ቀጣይ ደንበኛ</small><b>{appointments[0].name} · {appointments[0].time}</b></span>
                        </span>
                      ) : <span className="am-cal-popover-empty">ገና ቀጠሮ የለም — ቀኑ ክፍት ነው።</span>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="am-cal-agenda">
            <header>
              <span><small>የዕለቱ መርሐ ግብር</small><b>{ethMonths[month]} {ethNum(selectedDay)}፣ 2018</b></span>
              <em><i />{availableCount} ክፍት ሰዓቶች</em>
            </header>
            <div className="am-cal-agenda-list">
              {selectedAppointments.length ? selectedAppointments.map((appointment) => (
                <div className={`am-cal-agenda-item ${appointment.tone}`} key={`${appointment.time}-${appointment.name}`}>
                  <i aria-hidden="true">{clientInitials(appointment.name)}</i>
                  <span><b>{appointment.name}</b><small>{appointment.service} · ተረጋግጧል</small></span>
                  <time>{appointment.time}</time>
                </div>
              )) : <div className="am-cal-empty"><i>○</i><span><b>ገና ቀጠሮ የለም</b><small>ይህ ቀን ሙሉ በሙሉ ክፍት ነው።</small></span></div>}
            </div>
            <button type="button" className="am-cal-add"><i>＋</i><span><b>አዲስ ቀጠሮ</b><small>ደንበኛ ያክሉ</small></span></button>
          </div>
        </div>
      </section>

      <section className="am-hoods" data-am-reveal>
        <div className="am-section-head am-hoods-head">
          <div>
            <p>የከተማዋ ማዕዘኖች</p>
            <h2>በአዲስ አበባ የቀጣይ ቀጠሮዎ<br />በአቅራቢያ ነው።</h2>
          </div>
          <p className="am-hoods-lead">10 ማዕዘኖች። 400+ ቦታዎች። አንድ አጭር ጉዞ።</p>
        </div>
        <div className="am-hood-grid">
          {neighborhoods.map((h, i) => (
            <button
              key={h.name}
              type="button"
              className={`am-hood${h.trend ? " trend" : ""}`}
              style={{ ["--i" as string]: i } as React.CSSProperties}
            >
              {h.trend && <span className="am-hood-pulse" aria-hidden="true" />}
              <div className="am-hood-body">
                <b>{h.name}</b>
                <small>{h.count} ቦታዎች</small>
              </div>
              {h.trend && <em>ተወዳጅ</em>}
              <i aria-hidden="true">→</i>
            </button>
          ))}
        </div>
      </section>

      <section className="am-market-preview" id="market" data-am-reveal>
        <div className="am-section-head am-market-head">
          <div>
            <p>የተመረጡ ቦታዎች</p>
            <h2>የከተማዋ ተወዳጅ ስፍራዎች።</h2>
          </div>
          <Link className="am-see-all" href="https://app.aspio.io/">ሁሉንም ይመልከቱ<span aria-hidden="true">→</span></Link>
        </div>
        <div className="am-market-grid">
          {featured.map((place, i) => (
            <Link
              className="am-card am-card-featured"
              key={place.name}
              href="https://app.aspio.io/"
              style={{ ["--i" as string]: i } as React.CSSProperties}
            >
              <div className="am-card-image">
                <img src={place.image} alt="" />
                <span className="am-card-tag">{place.tag}</span>
              </div>
              <div className="am-card-body">
                <div className="am-card-rating">{place.rating} / 5</div>
                <p>{place.type}</p>
                <h3>{place.name}</h3>
                <small>⌖ {place.area}</small>
                {place.description && <p className="am-card-note">{place.description}</p>}
                <footer>
                  <b>{place.price}</b>
                  <span>በአስፒዮ ይያዙ<span aria-hidden="true">→</span></span>
                </footer>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="am-testimonials" data-am-reveal>
        <div className="am-testimonial-stage">
          <span className="am-quote-mark" aria-hidden="true">“</span>
          <div className="am-testimonial-track">
            {testimonials.map((t, i) => (
              <blockquote
                key={t.name}
                className={`am-testimonial${i === activeTestimonial ? " on" : ""}`}
                aria-hidden={i !== activeTestimonial}
              >
                <p>{t.quote}</p>
                <footer>
                  <div className="am-testimonial-avatar" aria-hidden="true">{t.initial}</div>
                  <div>
                    <b>{t.name}</b>
                    <small>{t.role}</small>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
          <div className="am-testimonial-dots" role="tablist">
            {testimonials.map((t, i) => (
              <button
                key={t.name}
                type="button"
                role="tab"
                aria-selected={i === activeTestimonial}
                onClick={() => setActiveTestimonial(i)}
                aria-label={`ምስክርነት ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="am-highlights" data-am-reveal>
        <div className="am-section-head" style={{ margin: "0 auto 44px", textAlign: "center" }}>
          <p>የሚቀጥለው ደረጃ</p>
          <h2>የተሟላ ስርዓት፣ በአንድ ቦታ።</h2>
        </div>
        <div className="am-highlight-grid">
          {highlights.map((h, i) => (
            <Link
              key={h.href}
              className="am-highlight"
              href={h.href}
              style={{ ["--i" as string]: i } as React.CSSProperties}
            >
              <span className="am-highlight-tag">{h.tag}</span>
              <h3>{h.title}</h3>
              <p>{h.body}</p>
              <em>ተጨማሪ ይመልከቱ<i aria-hidden="true">→</i></em>
            </Link>
          ))}
        </div>
      </section>

      <section className="am-faq" data-am-reveal>
        <div className="am-section-head am-faq-head">
          <p>ተደጋግመው የሚጠየቁ</p>
          <h2>ጥያቄዎ ካለ፣ መልሱ እዚህ ነው።</h2>
        </div>
        <ul className="am-faq-list">
          {faqs.map((f, i) => {
            const open = i === openFaq;
            return (
              <li key={f.q} className={`am-faq-item${open ? " open" : ""}`}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? -1 : i)}
                >
                  <span>{f.q}</span>
                  <i aria-hidden="true">+</i>
                </button>
                <div className="am-faq-body"><p>{f.a}</p></div>
              </li>
            );
          })}
        </ul>
      </section>

      <BusinessPackage language="am" />

      <section className="am-culture" data-am-reveal>
        <div className="am-culture-pattern" aria-hidden="true">
          <svg width="100%" height="100%"><rect width="100%" height="100%" fill="url(#am-habesha)" /></svg>
        </div>
        <p className="am-eyebrow"><span />ስለ ውበት፣ ስለ ጊዜ፣ ስለ ሰላም</p>
        <blockquote className="am-culture-quote">
          <p>
            <em>“</em>
            እንደ ቡና ሥነ-ሥርዓት ቀስ ብሎ የሚደረግ፣<br />
            እንደ ንጋት አየር ንጹህ የሆነ ቀጠሮ።
            <em>”</em>
          </p>
          <footer>— የአስፒዮ ፍልስፍና</footer>
        </blockquote>
        <div className="am-culture-cta">
          <Link className="am-btn am-btn-primary" href="/ethiopia/register">ጉዞዎን ይጀምሩ<span aria-hidden="true">↗</span></Link>
          <Link className="am-btn am-btn-text" href="/ethiopia/discover"><i aria-hidden="true">▶</i>ቦታዎችን ይመልከቱ</Link>
        </div>
      </section>
    </>
  );
}

export default function EthiopiaDefaultHome() {
  return <EthiopiaEnglishHome />;
}

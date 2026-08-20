"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calendarAppointments, clientInitials } from "./calendarSchedule";
import AddisMap from "./components/AddisMap";
import BusinessPackage from "./components/BusinessPackage";
import { demoPlaces as places } from "./data";
import { addisAreas, getAreaSalons } from "./mapData";
import { ethiopiaPricingSummary, starterPlan } from "./pricing";
import { useBackendSalons } from "./useBackendSalons";
import { useFeaturedPlaces } from "./useFeaturedPlaces";

const services = [
  { icon: "✂", name: "Haircut & styling", meta: "60 minutes · 450 birr" },
  { icon: "◇", name: "Hair colour", meta: "120 minutes · 900 birr" },
  { icon: "◎", name: "Consultation", meta: "20 minutes · free" },
];

const highlights = [
  { href: "/ethiopia/discover", tag: "MARKETPLACE", title: "The city's best places", body: "Explore verified salons, barbershops and spas across Addis Ababa." },
  { href: "/ethiopia/how-it-works", tag: "HOW IT WORKS", title: "Four steps. One appointment.", body: "Search, choose a time and receive your confirmation." },
  { href: "/ethiopia/business", tag: "FOR BUSINESS", title: "Fill your chairs with clients", body: "Four flexible plans with a website made for your business." },
];

const ethMonths = [
  "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
  "Megabit", "Miyazya", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume",
];
const ethWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const heroDays = [
  { day: "Today", date: "15", month: "Sene" },
  { day: "Tomorrow", date: "16", month: "Sene" },
  { day: "Wednesday", date: "17", month: "Sene" },
];
const heroTimes = ["09:30", "11:00", "13:30", "15:00", "16:30", "18:00"];
const marqueeWords = ["BEAUTY", "SALON", "BARBER", "SPA", "BOOKING", "SIMPLE", "GROWTH", "ASPIO", "ETHIOPIA"];
const cityNodes = addisAreas;
const featuredCityNodes = cityNodes.filter((area) => area.featured);
const bundledFeatured = places.slice(0, 6);

const stats: [string, string][] = [
  ["500+", "registered places"],
  ["12,000+", "appointments booked"],
  ["4.8 / 5", "customer rating"],
  ["0%", "commission, always"],
];

const neighborhoods = [
  { name: "Bole", count: 84, trend: true },
  { name: "Piassa", count: 62 },
  { name: "Kazanchis", count: 47 },
  { name: "Saris", count: 39 },
  { name: "Megenagna", count: 55 },
  { name: "4 Kilo", count: 33 },
  { name: "Old Airport", count: 41 },
  { name: "CMC", count: 28 },
  { name: "Gerji", count: 24 },
  { name: "Lebu", count: 19 },
];

const testimonials = [
  {
    quote: "Booking has become effortless. My clients can even make appointments while I sleep.",
    name: "Lucy Tesfaye",
    role: "Lucy Beauty Lounge · Bole",
    initial: "LT",
  },
  {
    quote: "The phone calls that used to interrupt my day are gone. Now my attention stays with my clients.",
    name: "Dawit Alemu",
    role: "Addis Barber Club · Piassa",
    initial: "DA",
  },
  {
    quote: "It does not just support the Ethiopian calendar. The whole experience feels made for us.",
    name: "Selam Dejene",
    role: "Efoyta Spa · 22 Mazoria",
    initial: "SD",
  },
  {
    quote: "The reminders have transformed attendance. Missed appointments are down dramatically.",
    name: "Kiros Gebre",
    role: "Kings Barber · CMC",
    initial: "KG",
  },
];

const faqs = [
  {
    q: "Do I need a long contract?",
    a: "No. There is no long-term contract, and you can stop at any time without an additional cancellation charge.",
  },
  {
    q: "Which Aspio plan is right for my business?",
    a: ethiopiaPricingSummary,
  },
  {
    q: "How much commission do you charge?",
    a: "Zero commission. Every birr from your bookings stays yours; Aspio charges only the monthly subscription.",
  },
  {
    q: "Can my clients book from their phones?",
    a: "Yes. The booking experience is designed to work smoothly on phones, tablets and computers.",
  },
  {
    q: "Do you provide training?",
    a: "Yes. We provide an onboarding visit and a two-hour training session for your team.",
  },
];

export default function EthiopiaHomePage() {
  const marketplacePlaces = useBackendSalons(places);
  const featured = useFeaturedPlaces(bundledFeatured);
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
  const selectedAppointments = useMemo(() => calendarAppointments(selectedDay, month), [month, selectedDay]);
  const availableCount = 8 - selectedAppointments.length;
  const mappedPlaces = useMemo(() => marketplacePlaces.filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude)), [marketplacePlaces]);
  const locatorNodes = useMemo(() => mappedPlaces.length ? mappedPlaces.map((place, index) => ({ id: place.id ?? place.slug ?? `salon-${index}`, name: place.name, count: 1, lat: place.latitude!, lng: place.longitude! })) : cityNodes, [mappedPlaces]);
  const safeCityNode = Math.min(activeCityNode, Math.max(0, locatorNodes.length - 1));
  const selectedCityNode = locatorNodes[safeCityNode];
  const quickCityNodes = mappedPlaces.length ? locatorNodes.slice(0, 7) : featuredCityNodes;
  const locatorPlaces = useMemo(() => {
    if (!mappedPlaces.length) return getAreaSalons(addisAreas[safeCityNode]).map((place) => ({ ...place, slug: undefined as string | undefined, tag: "" }));
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
        <div className="am-hero-fidel" aria-hidden="true">A S P I O</div>
        <div className="am-hero-pattern" aria-hidden="true">
          <svg width="100%" height="100%"><rect width="100%" height="100%" fill="url(#am-habesha)" /></svg>
        </div>
        <div className="am-hero-copy">
          <p className="am-eyebrow"><span />BOOKING, WEBSITE AND GROWTH FOR YOUR BUSINESS</p>
          <h1>
            <span>Bookings, Website</span>
            <span>and Growth.</span>
            <strong>All in One App.</strong>
          </h1>
          <p className="am-intro">
            Aspio brings your bookings, customers and business website together in one simple system, built for Ethiopia.
          </p>

          <div className="am-offer">
            <div><span>STARTER</span><b>Simple website + one booking calendar</b></div>
            <div className="am-price">
              <strong>{starterPlan.price}</strong>
              <span><b>ETB</b>/ month</span>
            </div>
            <small>{starterPlan.setupFee} · Marketplace and Business Hub included.</small>
          </div>

          <div className="am-hero-actions">
            <Link className="am-btn am-btn-primary" href="/ethiopia/register">Book a free demo<span aria-hidden="true">↗</span></Link>
            <Link className="am-btn am-btn-text" href="/ethiopia/discover"><i aria-hidden="true">▶</i>Explore places</Link>
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
                <em><i />online</em>
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
                    <div className="am-salon-avatar">L</div>
                    <div><b>Lucy Beauty Lounge</b><small>Bole · Addis Ababa</small></div>
                    <button type="button" aria-label="More options">••</button>
                  </header>

                  <nav className="am-flow-tabs" aria-label="Booking steps">
                    {["Service", "Date", "Time", "Confirm"].map((label, i) => (
                      <button key={label} type="button" className={`${i === step ? "active" : ""} ${i < step ? "done" : ""}`} onClick={() => { if (i <= step) setStep(i); }}>
                        <i>{i < step ? "✓" : `0${i + 1}`}</i><span>{label}</span>
                      </button>
                    ))}
                  </nav>

                  <section className="am-step-panel" key={step}>
                    {step === 0 && <>
                      <div className="am-step-heading"><span>01 / 04</span><h2>What do you need?</h2><small>Choose one service</small></div>
                      <div className="am-services">
                        {services.map((service, i) => (
                          <button key={service.name} type="button" className={heroService === i ? "selected" : ""} onClick={() => { setHeroService(i); setStep(1); }}>
                            <span>{service.icon}</span><div><b>{service.name}</b><small>{service.meta}</small></div><i aria-hidden="true">→</i>
                          </button>
                        ))}
                      </div>
                    </>}

                    {step === 1 && <>
                      <div className="am-step-heading"><span>02 / 04</span><h2>Choose a date</h2><small>{services[heroService].name} · {services[heroService].meta}</small></div>
                      <div className="am-quick-days">
                        {heroDays.map((item, i) => <button key={item.date} type="button" className={heroDay === i ? "selected" : ""} onClick={() => { setHeroDay(i); setStep(2); }}><small>{item.day}</small><b>{item.date}</b><span>{item.month}</span></button>)}
                      </div>
                      <button className="am-flow-back" type="button" onClick={() => setStep(0)}>← Change service</button>
                    </>}

                    {step === 2 && <>
                      <div className="am-step-heading"><span>03 / 04</span><h2>Choose your time</h2><small>{heroDays[heroDay].day} · {heroDays[heroDay].month} {heroDays[heroDay].date}</small></div>
                      <div className="am-quick-times">
                        {heroTimes.map((time, i) => <button key={time} type="button" className={heroTime === i ? "selected" : ""} onClick={() => { setHeroTime(i); setStep(3); }}><span>{time}</span><small>{i === 2 ? "Most popular" : "Available"}</small></button>)}
                      </div>
                      <button className="am-flow-back" type="button" onClick={() => setStep(1)}>← Change date</button>
                    </>}

                    {step === 3 && <div className="am-confirmation">
                      <div className="am-confirm-mark"><i>✓</i><span /><span /></div>
                      <div><small>Your appointment is confirmed</small><h2>{heroDays[heroDay].day} · {heroTimes[heroTime]}</h2><p>{services[heroService].name} — Lucy Beauty Lounge</p></div>
                      <footer><span><small>Booking reference</small><b>AS-2406</b></span><button type="button" onClick={() => setStep(0)}>Book another ↻</button></footer>
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
            <div><b>Booking confirmed</b><small>Mimi · now</small></div>
          </div>
          <div className="am-float am-float-bottom">
            <b>82%</b>
            <div><span aria-hidden="true"><i /></span><small>of today is booked</small></div>
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
            <p><span>ADDIS ABABA</span> · NEAR YOU</p>
            <h2>Find the best place<br />in your city.</h2>
          </div>
          <Link href="/ethiopia/discover">Explore the marketplace <span>↗</span></Link>
        </header>

        <div className="am-locator-scroll-scene">
          <div className="am-locator-shell am-locator-sticky">
          <aside className="am-locator-panel">
            <div className="am-locator-search"><span aria-hidden="true">⌕</span><b>Search an area or service</b><kbd>↵</kbd></div>
            <div className="am-locator-result-head">
              <div><small>SELECTED LOCATION</small><h3>{selectedCityNode.name}</h3></div>
              <span><b>{mappedPlaces.length || selectedCityNode.count}</b> places</span>
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
                  <i>{index === 0 ? (place.time ? `Today ${place.time}` : place.tag) : "→"}</i>
                </Link>
              ))}
            </div>

            <Link className="am-locator-more" href="/ethiopia/discover">See places near {selectedCityNode.name} <span>→</span></Link>
          </aside>

            <AddisMap locations={locatorNodes} activeIndex={safeCityNode} onSelect={setActiveCityNode} />
          </div>
        </div>

        <nav className="am-locator-areas" aria-label="Addis Ababa neighbourhoods">
          {quickCityNodes.map((node, i) => <button key={node.id} type="button" className={safeCityNode === i ? "active" : ""} onClick={() => setActiveCityNode(i)}><span>0{i + 1}</span>{node.name}<small>{node.count}</small></button>)}
        </nav>
      </section>

      <section className="am-stats" data-am-reveal>
        <div className="am-stats-intro"><span>ASPIO / IN NUMBERS</span><p>Beauty and grooming businesses<br />across the city, all on Aspio.</p></div>
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
          <p className="am-eyebrow"><span />THE ETHIOPIAN CALENDAR</p>
          <h2>Book naturally with the<br /><em>Ethiopian calendar.</em></h2>
          <p className="am-intro">
            Thirteen months and familiar local dates, with availability you can see immediately. Rooted in Addis, built to a global standard.
          </p>
          <div className="am-calendar-legend">
            <span><i className="dot dot-purple" />Selected</span>
            <span><i className="dot dot-today" />Today</span>
            <span><i className="dot dot-busy" />Booked</span>
            <span><i className="dot dot-free" />Available</span>
          </div>
          <div className="am-calendar-summary">
            <div>
              <small>SELECTED DATE</small>
              <b>{ethMonths[month]} {selectedDay}, 2018</b>
            </div>
            <div>
              <small>DAY CAPACITY</small>
              <b>{selectedAppointments.length} booked · {availableCount} open</b>
            </div>
          </div>
        </div>

        <div className="am-calendar">
          <div className="am-calendar-toolbar">
            <button
              type="button"
              className="am-cal-nav"
              onClick={() => setMonth((m) => (m + 12) % 13)}
              aria-label="Previous month"
            >‹</button>
            <div className="am-cal-title">
              <strong>{ethMonths[month]}</strong>
              <span>2018 E.C. · Ethiopian Calendar</span>
            </div>
            <button
              type="button"
              className="am-cal-nav"
              onClick={() => setMonth((m) => (m + 1) % 13)}
              aria-label="Next month"
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
              const appointments = calendarAppointments(day, month);
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
                    <strong>{day}</strong>
                    <small>{appointments.length ? `${appointments.length} booked` : "Open"}</small>
                  </span>
                  <span className="am-cal-events">
                    {appointments.slice(0, 2).map((appointment) => (
                      <span className={`am-cal-event ${appointment.tone}`} key={`${appointment.time}-${appointment.name}`}>
                        <i aria-hidden="true">{clientInitials(appointment.name)}</i>
                        <span>{appointment.name}</span>
                        <time>{appointment.time}</time>
                      </span>
                    ))}
                    {appointments.length > 2 && <small className="am-cal-more">+{appointments.length - 2} more</small>}
                  </span>
                  {isToday && <i className="am-cal-today-dot" aria-hidden="true" />}
                  {isSelected && (
                    <span className="am-cal-popover" role="status">
                      <span className="am-cal-popover-top"><small>SELECTED DAY</small><em><i />Live schedule</em></span>
                      <strong>{ethMonths[month]} {day}</strong>
                      <span className="am-cal-popover-metrics">
                        <span><b>{appointments.length}</b><small>{appointments.length === 1 ? "client" : "clients"}</small></span>
                        <span><b>{8 - appointments.length}</b><small>open slots</small></span>
                      </span>
                      {appointments[0] ? (
                        <span className="am-cal-popover-next">
                          <i aria-hidden="true">{clientInitials(appointments[0].name)}</i>
                          <span><small>NEXT CLIENT</small><b>{appointments[0].name} · {appointments[0].time}</b></span>
                        </span>
                      ) : <span className="am-cal-popover-empty">No bookings yet. The day is open.</span>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="am-cal-agenda">
            <header>
              <span><small>DAY FOCUS</small><b>{ethMonths[month]} {selectedDay}, 2018</b></span>
              <em><i />{availableCount} open slots</em>
            </header>
            <div className="am-cal-agenda-list">
              {selectedAppointments.length ? selectedAppointments.map((appointment) => (
                <div className={`am-cal-agenda-item ${appointment.tone}`} key={`${appointment.time}-${appointment.name}`}>
                  <i aria-hidden="true">{clientInitials(appointment.name)}</i>
                  <span><b>{appointment.name}</b><small>{appointment.service} · Confirmed</small></span>
                  <time>{appointment.time}</time>
                </div>
              )) : <div className="am-cal-empty"><i>○</i><span><b>No clients yet</b><small>The day is completely open.</small></span></div>}
            </div>
            <button type="button" className="am-cal-add"><i>＋</i><span><b>New booking</b><small>Add a client</small></span></button>
          </div>
        </div>
      </section>

      <section className="am-hoods" data-am-reveal>
        <div className="am-section-head am-hoods-head">
          <div>
            <p>AROUND THE CITY</p>
            <h2>Your next Addis Ababa appointment<br />is closer than you think.</h2>
          </div>
          <p className="am-hoods-lead">10 neighbourhoods. 400+ places to choose from.</p>
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
                <small>{h.count} places</small>
              </div>
              {h.trend && <em>Popular</em>}
              <i aria-hidden="true">→</i>
            </button>
          ))}
        </div>
      </section>

      <section className="am-market-preview" id="market" data-am-reveal>
        <div className="am-section-head am-market-head">
          <div>
            <p>FEATURED PLACES</p>
            <h2>The city&apos;s favourites.</h2>
          </div>
          <Link className="am-see-all" href="https://app.aspio.io/">See all places<span aria-hidden="true">→</span></Link>
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
                  <span>Book on Aspio<span aria-hidden="true">→</span></span>
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
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="am-highlights" data-am-reveal>
        <div className="am-section-head" style={{ margin: "0 auto 44px", textAlign: "center" }}>
          <p>THE NEXT STEP</p>
          <h2>A complete experience, connected in one place.</h2>
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
              <em>Explore more<i aria-hidden="true">→</i></em>
            </Link>
          ))}
        </div>
      </section>

      <section className="am-faq" data-am-reveal>
        <div className="am-section-head am-faq-head">
          <p>FREQUENTLY ASKED</p>
          <h2>Your question may already be answered.</h2>
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

      <BusinessPackage />

      <section className="am-culture" data-am-reveal>
        <div className="am-culture-pattern" aria-hidden="true">
          <svg width="100%" height="100%"><rect width="100%" height="100%" fill="url(#am-habesha)" /></svg>
        </div>
        <p className="am-eyebrow"><span />READY WHEN YOU ARE</p>
        <div className="am-culture-content">
          <h2>Built for how Addis Ababa actually runs.</h2>
          <p>From the Ethiopian calendar to same-day setup, Aspio fits the way your business already works.</p>
        </div>
        <div className="am-culture-cta">
          <Link className="am-btn am-btn-primary" href="/ethiopia/register">Book a demo<span aria-hidden="true">↗</span></Link>
          <Link className="am-btn am-btn-text" href="/ethiopia/discover"><i aria-hidden="true">▶</i>Explore places</Link>
        </div>
      </section>
    </>
  );
}

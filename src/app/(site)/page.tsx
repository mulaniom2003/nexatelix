import Link from "next/link";
import { Globe } from "@/components/site/Globe";
import { Phone, type PhoneItem } from "@/components/site/Phone";
import { RevealLines, FadeUp, Counter, InViewClass } from "@/components/site/Reveal";
import { Marquee, Cta, SectionHead } from "@/components/site/Blocks";
import { Btn } from "@/components/Btn";
import { Icon, ArrowUR } from "@/components/icons";
import { channels, site } from "@/lib/site";
import { rate } from "@/lib/pricing";

const heroChat: PhoneItem[] = [
  { kind: "in", text: "Your verification code is 482 913. It expires in 5 minutes.", time: "9:41" },
  { kind: "rich", art: "lime", caption: "Diwali drop", title: "30% off, this weekend only", text: "Free delivery on every order until Sunday midnight.", buttons: ["Shop the sale", "Remind me later"] },
  { kind: "chips", items: ["Track my order", "Talk to support"] },
  { kind: "out", text: "Track my order", time: "Read" },
  { kind: "in", text: "Out for delivery. Arriving between 2 and 4 PM.", time: "9:42" },
];

const rcsChat: PhoneItem[] = [
  { kind: "out", text: "Is my flight still on time?", time: "Read" },
  { kind: "rich", art: "ocean", caption: "AMD → DXB", title: "Flight SR 1477 · On time", text: "Boarding 21:10 at Gate 4. Seat 14A.", buttons: ["Show boarding pass", "Change seat"] },
  { kind: "chips", items: ["Add bag", "Check in", "Help"] },
];

const useCases = ["One-time passwords", "Order updates", "Flash sales", "Appointment reminders", "Boarding passes", "Payment alerts", "Re-engagement", "Lead follow-ups"];

const features = [
  { ico: Icon.route, t: "Smart routing", d: "Each message picks the best route for its country and type: direct operator for OTP, cost-optimised for promotions." },
  { ico: Icon.repeat, t: "Automatic fallback", d: "If a handset can't receive RCS, the same message goes out as SMS. Nobody misses it." },
  { ico: Icon.chart, t: "Delivery receipts", d: "Sent, delivered, read and clicked for every recipient, with downloadable reports per campaign." },
  { ico: Icon.code, t: "One REST API", d: "A single endpoint for all four channels. Switch channel with one field, not a new integration." },
  { ico: Icon.wallet, t: "Prepaid wallet", d: "Top up by UPI, bank transfer or USDT. You only pay for what you send, with no monthly fee." },
  { ico: Icon.shield, t: "Verified sender", d: "Register your brand name, logo and colours so customers see who's messaging before they open it." },
];

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="gridlines" />
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot" /> RCS · SMS · WhatsApp · Telegram
            </p>
            <RevealLines as="h1" className="display" lines={["Every", "message,", <em key="d">delivered.</em>]} />
            <FadeUp delay={0.4}>
              <p className="lead">
                {site.name} sends verified RCS, SMS, WhatsApp and Telegram messages from one panel and one API, with live delivery receipts for every recipient.
              </p>
              <div className="hero-cta">
                <Btn href="/signup">Start sending</Btn>
                <Btn href="/rcs" variant="ghost">See RCS in action</Btn>
              </div>
            </FadeUp>
          </div>

          <div className="hero-visual">
            <Globe />
            <span className="hero-orbit" aria-hidden />
            <div className="hero-badge b1">
              <span className="pip" />
              <span>
                <b>Delivered · Read</b>
                <small>+91 98•• ••• 210 · 0.9s</small>
              </span>
            </div>
            <div className="hero-badge b2">
              <span className="pip" />
              <span>
                <b>Fallback to SMS</b>
                <small>No RCS on handset · sent</small>
              </span>
            </div>
            <div className="hero-phone">
              <Phone theme="rcs" name={site.name} sub="Verified business" initials="NX" verified items={heroChat} input="RCS message" />
            </div>
          </div>
        </div>

        <div className="wrap">
          <div className="hero-stats">
            {site.stats.map((s) => (
              <div key={s.label}>
                <div className="stat-value">
                  <Counter to={s.value} prefix={"prefix" in s ? s.prefix : ""} suffix={s.suffix} />
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Marquee items={useCases} />

      {/* ── Channels ── */}
      <section className="section">
        <div className="wrap">
          <SectionHead idx="01 — Channels" title={<>Four channels. <em>One</em> panel.</>} lead="Pick the channel your customers actually open. Prices are per message, prepaid, with no setup fee." />
          <div className="chan-list">
            {Object.values(channels).map((c) => (
              <Link key={c.href} href={c.href} className="chan-row" data-cursor="big">
                <span className="mono muted">{c.index}</span>
                <span className="name">{c.name}</span>
                <span className="desc muted">{c.blurb}</span>
                <span className="price mono">
                  from {rate(c.from)}
                  <span className="muted"> / {c.unit}</span>
                </span>
                <span className="go">
                  <ArrowUR />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── RCS spotlight ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap spot">
          <div>
            <SectionHead idx="02 — Why RCS" title={<>The text message, <em>rebuilt.</em></>} />
            <FadeUp>
              <p className="lead" style={{ marginBottom: 36 }}>
                RCS arrives in the phone's own messages app with your logo and a verified tick. Add images, buttons and one-tap replies, and see exactly who read it.
              </p>
              <ul className="ticks">
                <li>Brand name, logo and verified badge on every message</li>
                <li>Rich cards and carousels with up to four buttons each</li>
                <li>Suggested replies, so customers answer in one tap</li>
                <li>Read receipts and click tracking per recipient</li>
                <li>Automatic SMS fallback for phones without RCS</li>
              </ul>
              <div className="hero-cta">
                <Btn href="/rcs" variant="ghost">Explore RCS</Btn>
              </div>
            </FadeUp>
          </div>
          <div className="phone-col">
            <Phone theme="rcs" name="SkyRoute Air" sub="Verified business" initials="SR" verified items={rcsChat} input="RCS message" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead idx="03 — Platform" title={<>Built for traffic that <em>matters.</em></>} />
          <div className="fgrid">
            {features.map((f, i) => (
              <div className="fcell" key={f.t}>
                <span className="num">0{i + 1}</span>
                <span className="ico">
                  <f.ico />
                </span>
                <h3 className="h4">{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead idx="04 — Getting started" title={<>Live in an <em>afternoon.</em></>} />
          <div className="steps">
            <InViewClass className="step">
              <h3 className="h3">Create an account</h3>
              <p>Sign up with your business details. Accounts are reviewed and approved within a few hours.</p>
            </InViewClass>
            <InViewClass className="step">
              <h3 className="h3">Top up your wallet</h3>
              <p>Add credit by UPI, bank transfer or USDT. Your balance is ready the moment payment clears.</p>
            </InViewClass>
            <InViewClass className="step">
              <h3 className="h3">Send your first campaign</h3>
              <p>Upload a contact list in the panel or call the API. Watch delivery and read receipts come in live.</p>
            </InViewClass>
          </div>
        </div>
      </section>

      <Cta />
    </>
  );
}

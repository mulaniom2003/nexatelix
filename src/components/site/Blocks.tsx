import Link from "next/link";
import { links, site, channels } from "@/lib/site";
import { Logo } from "../icons";
import { Btn } from "../Btn";

export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee" aria-hidden>
      <div className="marquee-track">
        {doubled.map((t, i) => (
          <span className="marquee-item" key={i}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Cta({ title = <>Ready when <em>you</em> are.</>, sub = "Accounts are approved within hours. Bring your data and creative — we handle routing, compliance and delivery." }: { title?: React.ReactNode; sub?: string }) {
  return (
    <section className="section-tight">
      <div className="wrap">
        <div className="cta">
          <span className="ring" />
          <span className="ring r2" />
          <p className="eyebrow" style={{ color: "rgba(11,11,12,.6)", marginBottom: 32 }}>
            Start in under 24 hours
          </p>
          <div className="cta-row">
            <h2 className="h1">{title}</h2>
            <div style={{ maxWidth: 380 }}>
              <p style={{ fontSize: 18, lineHeight: 1.5, marginBottom: 28 }}>{sub}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn href="/signup">Create account</Btn>
                <Btn href={links.telegram} variant="ghost" arrow={false}>
                  Telegram
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link href="/" className="wordmark">
              <Logo /> {site.name}
            </Link>
            <p className="muted" style={{ marginTop: 20, maxWidth: 360, fontSize: 15 }}>
              {site.description}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
              <a className="tag" href={links.telegram} target="_blank" rel="noreferrer">Telegram</a>
              <a className="tag" href={links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            </div>
          </div>
          <div>
            <h4>Channels</h4>
            <ul>
              {Object.values(channels).map((c) => (
                <li key={c.href}><Link href={c.href}>{c.name}</Link></li>
              ))}
              <li><Link href="/gaming">iGaming</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/developers">Developers</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/login">Client login</Link></li>
            </ul>
          </div>
          <div>
            <h4>Reach us</h4>
            <ul>
              <li><a href={links.telegramSupport} target="_blank" rel="noreferrer">Telegram · @{site.contact.telegramSupport}</a></li>
              <li><a href={links.telegram} target="_blank" rel="noreferrer">Channel · @{site.contact.telegramChannel}</a></li>
              <li><a href={links.sales}>{site.contact.salesEmail}</a></li>
              <li><a href={links.support}>{site.contact.supportEmail}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-mark" aria-hidden>
          Nexa<em>Telix</em>
        </div>
      </div>
      <div className="wrap">
        <div className="footer-bottom">
          <span>© {year} {site.legalName}. All rights reserved.</span>
          <span style={{ display: "flex", gap: 20 }}>
            <Link href="/legal/terms" className="link-u">Terms</Link>
            <Link href="/legal/privacy" className="link-u">Privacy</Link>
            <Link href="/legal/acceptable-use" className="link-u">Acceptable use</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function PageHero({
  index,
  eyebrow,
  title,
  lead,
  children,
  aside,
}: {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="phero">
      <div className="gridlines" />
      <div className="wrap" style={{ position: "relative" }}>
        <div className="crumb">
          <span className="eyebrow">
            <span className="dot" /> {index} / {eyebrow}
          </span>
        </div>
        <div className="phero-grid">
          <div>
            <h1 className="h1">{title}</h1>
            {lead && <p className="lead" style={{ marginTop: 32 }}>{lead}</p>}
            {children}
          </div>
          {aside && <div style={{ display: "flex", justifyContent: "center" }}>{aside}</div>}
        </div>
      </div>
    </section>
  );
}

export function SectionHead({ idx, title, lead }: { idx: string; title: React.ReactNode; lead?: string }) {
  return (
    <div className="shead">
      <div className="idx">{idx}</div>
      <div>
        <h2 className="h2">{title}</h2>
        {lead && <p className="lead">{lead}</p>}
      </div>
    </div>
  );
}

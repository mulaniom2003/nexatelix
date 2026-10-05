import { Btn } from "../Btn";
import { links, site } from "@/lib/site";

export function PortalSoon({ mode }: { mode: "login" | "signup" }) {
  return (
    <section className="center-page">
      <div className="gridlines" />
      <div className="center-card">
        <p className="eyebrow">
          <span className="dot" /> Client panel
        </p>
        <h1 className="h2">{mode === "login" ? <>Welcome <em>back.</em></> : <>Open an <em>account.</em></>}</h1>
        <p className="lead">
          The {site.name} panel is being set up. Until it opens, message us and we&apos;ll {mode === "login" ? "help with your account" : "open your account"} directly.
        </p>
        <div className="hero-cta" style={{ marginTop: 8 }}>
          <Btn href={links.telegramSupport}>Message on Telegram</Btn>
          <Btn href="/contact" variant="ghost">Contact form</Btn>
        </div>
      </div>
    </section>
  );
}

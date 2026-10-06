import type { Metadata } from "next";
import { PageHero } from "@/components/site/Blocks";
import { ContactForm } from "@/components/site/ContactForm";
import { Icon, ArrowUR } from "@/components/icons";
import { links, site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact", description: `Talk to the ${site.name} team about RCS, SMS, WhatsApp or Telegram messaging.` };

const ways = [
  { ico: Icon.telegram, t: "Telegram", s: `@${site.contact.telegramSupport}`, href: links.telegramSupport },
  { ico: Icon.mail, t: "Sales", s: site.contact.salesEmail, href: links.sales },
  { ico: Icon.life, t: "Support", s: site.contact.supportEmail, href: links.support },
  { ico: Icon.bell, t: "Updates channel", s: `@${site.contact.telegramChannel} on Telegram`, href: links.telegram },
];

// The form only appears once email sending is configured (RESEND_API_KEY + CONTACT_TO).
const formReady = Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO);

export default function Contact() {
  return (
    <>
      <PageHero index="08" eyebrow="Contact" title={<>Let&apos;s <em>talk</em> traffic.</>} lead="Tell us what you send and where. Message us on Telegram and a person replies, usually within a few hours." />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className={`wrap ${formReady ? "split" : ""}`} style={{ alignItems: "start", maxWidth: formReady ? undefined : 860 }}>
          {formReady && <ContactForm />}
          <div className="contact-ways">
            {ways.map((w) => (
              <a key={w.t} href={w.href} target={w.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                <span className="ico">
                  <w.ico />
                </span>
                <span>
                  {w.t}
                  <small>{w.s}</small>
                </span>
                <ArrowUR />
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

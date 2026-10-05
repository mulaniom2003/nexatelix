import type { ReactNode } from "react";
import { site } from "./site";

export const legal: Record<string, { title: string; updated: string; body: ReactNode }> = {
  terms: {
    title: "Terms of service",
    updated: "3 October 2026",
    body: (
      <>
        <p>These terms govern your use of {site.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account you agree to them.</p>
        <h2>Accounts</h2>
        <p>You must give accurate business details and keep your login and API keys secure. You are responsible for all activity on your account.</p>
        <h2>Credit and payment</h2>
        <p>Services are prepaid. Credit is debited when a campaign is accepted. Refunds of unused credit are handled case by case on request.</p>
        <h2>Your content</h2>
        <p>You are responsible for the messages you send and for having the recipient&apos;s consent. We may pause or reject campaigns that breach the acceptable use policy.</p>
        <h2>Availability</h2>
        <p>Delivery depends on carriers and platforms outside our control. We don&apos;t guarantee delivery of any individual message.</p>
        <h2>Contact</h2>
        <p>Questions about these terms: email <a href={`mailto:${site.contact.supportEmail}`}>{site.contact.supportEmail}</a> or message us on Telegram at <a href={`https://t.me/${site.contact.telegramSupport}`}>@{site.contact.telegramSupport}</a>.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    updated: "3 October 2026",
    body: (
      <>
        <p>This policy explains what personal data {site.name} handles and why.</p>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: name, email, company, phone and Telegram handle.</li>
          <li>Recipient lists and message content you upload, used only to deliver your campaigns.</li>
          <li>Delivery and usage logs, kept for reporting and billing.</li>
        </ul>
        <h2>How long we keep it</h2>
        <p>Recipient files and reports are kept for 90 days after a campaign completes, then deleted. Account and billing records are kept as long as the law requires.</p>
        <h2>Sharing</h2>
        <p>We share recipient numbers and message content with carriers and messaging platforms only to deliver your messages. We never sell personal data.</p>
        <h2>Your rights</h2>
        <p>To access, correct or delete your data, email <a href={`mailto:${site.contact.supportEmail}`}>{site.contact.supportEmail}</a>, or message us on Telegram at <a href={`https://t.me/${site.contact.telegramSupport}`}>@{site.contact.telegramSupport}</a> or on WhatsApp at {site.contact.whatsappDisplay}.</p>
      </>
    ),
  },
  "acceptable-use": {
    title: "Acceptable use policy",
    updated: "3 October 2026",
    body: (
      <>
        <p>To protect recipients and our routes, these rules apply to every message sent through {site.name}.</p>
        <h2>Consent</h2>
        <p>Only message people who agreed to hear from you. Promotional messages must include a way to opt out, and opt-outs must be honoured.</p>
        <h2>Not allowed</h2>
        <ul>
          <li>Phishing, impersonation of another brand or person, or misleading sender names.</li>
          <li>Illegal content, or products and services illegal in the recipient&apos;s country.</li>
          <li>Purchased or scraped contact lists.</li>
          <li>Harassment, hate or adult content.</li>
        </ul>
        <h2>Enforcement</h2>
        <p>We may reject campaigns, pause sending or close accounts that break these rules, without refund of credit used on the offending traffic.</p>
      </>
    ),
  },
};

import type { Metadata } from "next";
import { PageHero, SectionHead, Cta } from "@/components/site/Blocks";
import { channelContent } from "@/lib/channel-content";

export const metadata: Metadata = { title: "FAQ", description: "Answers about accounts, payments, channels, delivery and the API." };

const general: [string, string][] = [
  ["How do I get started?", "Create an account, wait for approval (usually a few hours), top up your wallet and send your first campaign from the panel or the API."],
  ["How do I pay?", "Prepaid in EUR. Top up by UPI, bank transfer or USDT. Credit appears once the payment is confirmed."],
  ["Is there a minimum spend?", "No monthly minimum and no setup fee. You only pay for messages you send."],
  ["Do unused credits expire?", "No. Your wallet balance stays available for as long as your account is active."],
  ["What can't I send?", "Anything illegal, deceptive or sent to people who didn't agree to hear from you. See the acceptable use policy for details."],
];

export default function Faq() {
  const groups: [string, [string, string][]][] = [
    ["Account & billing", general],
    ["RCS", channelContent.rcs.faq],
    ["SMS", channelContent.sms.faq],
    ["WhatsApp", channelContent.whatsapp.faq],
    ["Telegram", channelContent.telegram.faq],
  ];
  return (
    <>
      <PageHero index="09" eyebrow="FAQ" title={<>Questions, <em>answered.</em></>} lead="Can't find what you need? Message us on Telegram and a person will reply." />
      {groups.map(([g, items], i) => (
        <section className="section-tight" key={g}>
          <div className="wrap">
            <SectionHead idx={`0${i + 1} — ${g}`} title={g} />
            <div className="faq">
              {items.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <span className="pm" aria-hidden />
                  </summary>
                  <p className="ans">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ))}
      <Cta />
    </>
  );
}

import type { Metadata } from "next";
import { PageHero, SectionHead, Cta } from "@/components/site/Blocks";
import { Calculator } from "@/components/site/Calculator";
import { getPrices } from "@/lib/auth";
import { channels, type ChannelKey } from "@/lib/site";
import { num, rate } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Prepaid per-message pricing for RCS, SMS, WhatsApp and Telegram. No setup fee, no monthly minimum.",
};

const ORDER: ChannelKey[] = ["rcs", "sms", "whatsapp", "telegram"];

export default async function PricingPage() {
  const prices = (await getPrices()).filter((p) => p.active ?? true);

  return (
    <>
      <PageHero
        index="06"
        eyebrow="Pricing"
        title={<>Pay for what you <em>send.</em></>}
        lead="Prepaid credit, per-message rates, no setup fee and no monthly minimum. Volume discounts apply on their own."
      >
        <div className="meta">
          <div><b>$0</b><span className="stat-label">Setup fee</span></div>
          <div><b>$0</b><span className="stat-label">Monthly fee</span></div>
          <div><b>USD</b><span className="stat-label">UPI · Bank · USDT</span></div>
        </div>
      </PageHero>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead idx="01 — Estimate" title={<>Price a campaign in <em>seconds.</em></>} />
          <Calculator prices={prices} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead idx="02 — Rate card" title={<>Every <em>rate.</em></>} lead="Rates shown are standard routes. International destinations may differ; your panel shows the exact rate before sending." />
          <div className="scroll-x">
            <table className="ptable">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Plan</th>
                  <th>Volume</th>
                  <th>Best for</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {ORDER.flatMap((k) =>
                  prices
                    .filter((p) => p.channel === k)
                    .map((p) => (
                      <tr key={`${p.channel}-${p.tier}-${p.min_volume}`}>
                        <td className="mono muted">{channels[k].short}</td>
                        <td>{p.label}</td>
                        <td className="mono muted tnum">{p.min_volume ? `${num(p.min_volume)}+` : "Any"}</td>
                        <td className="muted" style={{ fontSize: 14 }}>{p.description}</td>
                        <td className="rate tnum">
                          {rate(p.unit_price)}
                          <span className="muted" style={{ fontSize: 13, letterSpacing: 0 }}> / {channels[k].unit}</span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Cta title={<>Need a <em>custom</em> rate?</>} sub="Sending more than a million messages a month? Message us and we'll price your routes directly." />
    </>
  );
}

import { PageHero, SectionHead, Cta } from "./Blocks";
import { Phone } from "./Phone";
import { FadeUp } from "./Reveal";
import { Btn } from "../Btn";
import { getPrices } from "@/lib/auth";
import { rate, num } from "@/lib/pricing";
import { channels } from "@/lib/site";
import type { ChannelContent } from "@/lib/channel-content";

export async function ChannelPage({ c }: { c: ChannelContent }) {
  const prices = (await getPrices()).filter((p) => c.priceChannels.includes(p.channel) && (p.active ?? true));
  const multi = c.priceChannels.length > 1;

  return (
    <>
      <PageHero
        index={c.index}
        eyebrow={c.eyebrow}
        title={c.title}
        lead={c.lead}
        aside={<Phone {...c.phone} />}
      >
        <div className="hero-cta">
          <Btn href="/signup">Start sending</Btn>
          <Btn href="/pricing" variant="ghost">See pricing</Btn>
        </div>
        <div className="meta">
          {c.meta.map((m) => (
            <div key={m.label}>
              <b>{m.b}</b>
              <span className="stat-label">{m.label}</span>
            </div>
          ))}
        </div>
      </PageHero>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead idx="01 — Features" title={<>What you <em>get.</em></>} />
          <div className={`fgrid ${c.features.length === 4 ? "cols-2" : ""}`}>
            {c.features.map((f, i) => (
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

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap split" style={{ alignItems: "start" }}>
          <div>
            <SectionHead idx={c.spotlight.idx} title={c.spotlight.title} />
            <FadeUp>
              <p className="lead" style={{ marginBottom: 32 }}>{c.spotlight.lead}</p>
              <ul className="ticks">
                {c.spotlight.ticks.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </FadeUp>
          </div>
          <FadeUp delay={0.1}>
            {c.compare ? (
              <div className="scroll-x">
                <table className="compare">
                  <thead>
                    <tr>
                      <th />
                      <th>{c.compare.head[0]}</th>
                      <th className="signal">{c.compare.head[1]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.compare.rows.map(([k, lo, hi]) => (
                      <tr key={k}>
                        <td>{k}</td>
                        <td className="lo">{lo}</td>
                        <td className="hi">{hi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="scroll-x">
                <table className="ptable">
                  <thead>
                    <tr>
                      {multi && <th>Channel</th>}
                      <th>Plan</th>
                      <th>Best for</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map((p) => (
                      <tr key={`${p.channel}-${p.tier}-${p.min_volume}`}>
                        {multi && <td className="mono muted">{channels[p.channel].short}</td>}
                        <td>{p.label}</td>
                        <td className="muted" style={{ fontSize: 14 }}>{p.description}</td>
                        <td className="rate tnum">{rate(p.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FadeUp>
        </div>
      </section>

      {c.compare && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <SectionHead idx="03 — Pricing" title={<>Pay per <em>message.</em></>} lead="Prepaid, no monthly fee. Volume rates apply automatically." />
            <div className="scroll-x">
              <table className="ptable">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Volume</th>
                    <th>Best for</th>
                    <th>Rate / {channels[c.priceChannels[0]].unit}</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((p) => (
                    <tr key={`${p.tier}-${p.min_volume}`}>
                      <td>{p.label}</td>
                      <td className="mono muted tnum">{p.min_volume ? `${num(p.min_volume)}+` : "Any"}</td>
                      <td className="muted" style={{ fontSize: 14 }}>{p.description}</td>
                      <td className="rate tnum">{rate(p.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead idx={c.compare ? "04 — Questions" : "03 — Questions"} title={<>Good to <em>know.</em></>} />
          <div className="faq">
            {c.faq.map(([q, a]) => (
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

      <Cta />
    </>
  );
}

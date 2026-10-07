"use client";
import { useMemo, useState } from "react";
import { channels, type ChannelKey, type PriceRow } from "@/lib/site";
import { num, rate, resolvePrice, smsSegments, tiersFor, usd } from "@/lib/pricing";
import { Btn } from "../Btn";

const VOLUMES = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000];
const ORDER: ChannelKey[] = ["rcs", "sms", "whatsapp", "telegram"];

export function Calculator({ prices }: { prices: PriceRow[] }) {
  const [channel, setChannel] = useState<ChannelKey>("rcs");
  const tiers = useMemo(() => tiersFor(prices, channel), [prices, channel]);
  const [tier, setTier] = useState<string>(tiers[0]?.tier ?? "");
  const [vi, setVi] = useState(4);
  const [text, setText] = useState("Your Paywise login code is 482913. It expires in 5 minutes.");

  const activeTier = tiers.some((t) => t.tier === tier) ? tier : tiers[0]?.tier ?? "";
  const volume = VOLUMES[vi];
  const row = resolvePrice(prices, channel, activeTier, volume);
  const seg = smsSegments(text);
  const segments = channel === "sms" ? seg.segments : 1;
  const units = volume * segments;
  const total = row ? units * row.unit_price : 0;

  return (
    <div className="calc">
      <div className="calc-in">
        <div className="field">
          <label>Channel</label>
          <div className="seg-tabs" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }} role="tablist" aria-label="Channel">
            {ORDER.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={channel === k}
                className={channel === k ? "on" : ""}
                onClick={() => {
                  setChannel(k);
                  setTier(tiersFor(prices, k)[0]?.tier ?? "");
                }}
              >
                {channels[k].short}
              </button>
            ))}
          </div>
        </div>

        {tiers.length > 1 && (
          <div className="field">
            <label>Route</label>
            <div className="tier-pick">
              {tiers.map((t) => (
                <button key={t.tier} type="button" className={activeTier === t.tier ? "on" : ""} onClick={() => setTier(t.tier)} aria-pressed={activeTier === t.tier}>
                  <span>{t.label}</span>
                  <small>{t.description}</small>
                  <span className="r">{rate(t.unit_price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <div className="calc-row">
            <label htmlFor="vol">Recipients</label>
            <b className="tnum">{num(volume)}</b>
          </div>
          <input
            id="vol"
            type="range"
            min={0}
            max={VOLUMES.length - 1}
            step={1}
            value={vi}
            onChange={(e) => setVi(Number(e.target.value))}
            style={{ ["--p" as string]: `${(vi / (VOLUMES.length - 1)) * 100}%` }}
          />
        </div>

        {channel === "sms" && (
          <div className="field">
            <label htmlFor="msg">Message</label>
            <textarea id="msg" className="textarea" value={text} onChange={(e) => setText(e.target.value)} rows={3} />
            <div className="seg-meta">
              <span>{seg.encoding}</span>
              <span>{seg.length} chars</span>
              <span className="signal">{seg.segments} segment{seg.segments > 1 ? "s" : ""}</span>
            </div>
          </div>
        )}
      </div>

      <div className="calc-out">
        <div>
          <p className="eyebrow" style={{ color: "var(--mute-2)" }}>Estimated cost</p>
          <div className="total tnum" style={{ marginTop: 18 }}>{usd(total)}</div>
        </div>
        <dl className="tnum">
          <dt>Plan</dt>
          <dd>{row?.label ?? "—"}</dd>
          <dt>Rate</dt>
          <dd>{row ? `${rate(row.unit_price)} / ${channels[channel].unit}` : "—"}</dd>
          {channel === "sms" && (
            <>
              <dt>Segments</dt>
              <dd>
                {num(volume)} × {segments}
              </dd>
            </>
          )}
          <dt>Billable</dt>
          <dd>{num(units)}</dd>
        </dl>
        <div>
          <Btn href="/signup">Create account</Btn>
          <p style={{ fontSize: 12.5, color: "var(--mute-2)", marginTop: 14 }}>Prepaid in EUR. Final cost depends on the destination country.</p>
        </div>
      </div>
    </div>
  );
}

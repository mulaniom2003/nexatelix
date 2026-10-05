"use client";
import { useMemo, useState } from "react";

type R = { id: number; name: string; channel: string; country: string; iso: string; dial_code: string; price: number; assigned: boolean };

export function CoverageTable({ routes }: { routes: R[] }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^\+/, "");
    if (!t) return routes;
    return routes.filter((r) => [r.name, r.country, r.iso, r.dial_code, r.channel].some((v) => v.toLowerCase().includes(t)));
  }, [q, routes]);
  return (
    <>
      <section className="pcard" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} className="input" placeholder="Search route, country, ISO, code…" aria-label="Search coverage" style={{ maxWidth: 420 }} />
        <span className="muted" style={{ fontSize: 13 }}>{list.length} route{list.length === 1 ? "" : "s"}</span>
      </section>
      <section className="pcard">
        {list.length === 0 ? (
          <p className="muted">{routes.length ? "No routes match your search." : "No routes are assigned to your account yet. Contact support to get coverage."}</p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Route</th><th>Channel</th><th>Country</th><th className="num">Price (USD)</th></tr></thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id}>
                    <td><b style={{ fontWeight: 500 }}>{r.name}</b> {r.assigned && <span className="badge b-approved" style={{ marginLeft: 6 }}>Assigned</span>}<small>{r.assigned ? "priority" : "global"}</small></td>
                    <td>{r.channel.toUpperCase()}</td>
                    <td><span className="flag">{r.iso}</span>{r.country} <span className="muted" style={{ fontSize: 12.5 }}>+{r.dial_code}</span></td>
                    <td className="num"><span className="signal mono-num">{r.price.toFixed(4)}</span><small>{r.channel === "sms" ? "per part" : "per message"}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

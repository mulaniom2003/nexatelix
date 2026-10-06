import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { addDays, isYmd, istDate, istStart } from "@/lib/format";

export const maxDuration = 60;

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV of the signed-in client's messages: ?from&to (India dates), ?iso, ?campaign, ?channel. Admins may pass ?user. */
export async function GET(req: NextRequest) {
  const { user, profile } = await getSession();
  if (!user || !profile) return NextResponse.redirect(new URL("/login", req.url));
  const p = req.nextUrl.searchParams;
  const owner = profile.role === "admin" && p.get("user") ? p.get("user")! : user.id;
  const campaign = p.get("campaign");
  const iso = p.get("iso");
  const channel = p.get("channel");
  const today = istDate();
  const from = isYmd(p.get("from")) ? p.get("from")! : addDays(today, -29);
  const to = isYmd(p.get("to")) ? p.get("to")! : today;

  const db = createAdminClient();
  const header = ["time_ist", "channel", "campaign", "sender", "to", "country", "status", "parts", "cost_eur", "error", "message_id", "message"];
  const lines = [header.join(",")];
  const camps = new Map<string, string>();
  for (let page = 0; page < 100; page++) {
    let q = db
      .from("messages")
      .select("id, created_at, channel, campaign_id, sender, recipient, iso, status, segments, price, error, body")
      .eq("user_id", owner)
      .order("created_at", { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (campaign) q = q.eq("campaign_id", campaign);
    else q = q.gte("created_at", istStart(from).toISOString()).lt("created_at", istStart(addDays(to, 1)).toISOString());
    if (iso) q = q.eq("iso", iso);
    if (channel === "sms" || channel === "rcs") q = q.eq("channel", channel);
    const { data } = await q;
    if (!data?.length) break;
    const need = [...new Set(data.map((m) => m.campaign_id).filter((c): c is string => !!c && !camps.has(c)))];
    if (need.length) {
      const { data: cs } = await db.from("campaigns").select("id, name").in("id", need);
      (cs ?? []).forEach((c) => camps.set(c.id, c.name));
    }
    for (const m of data) {
      const t = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(m.created_at));
      lines.push([t, m.channel, m.campaign_id ? camps.get(m.campaign_id) ?? "" : "", m.sender, m.recipient, m.iso, m.status, m.segments, Number(m.price).toFixed(5), m.error, m.id, m.body].map(esc).join(","));
    }
    if (data.length < 1000) break;
  }
  const name = campaign ? `nexatelix-campaign-${campaign.slice(0, 8)}` : `nexatelix-report-${from}${from !== to ? `_${to}` : ""}${iso ? `-${iso}` : ""}`;
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"`, "Cache-Control": "no-store" },
  });
}

import "server-only";
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "./supabase/server";
import { getSetting } from "./auth";
import { pickRoute, routesFor, type Route } from "./routing";
import { smsSegments } from "./pricing";
import {
  BULK_LIMIT,
  clientSafe,
  dlrUrl,
  messageStatus,
  sendRcs,
  sendSms,
  sendSmsBulk,
  upstreamConfigured,
  type RcsContent,
  type UpResult,
} from "./upstream";

export type Channel = "sms" | "rcs";
const FINAL_FAIL = ["failed", "rejected", "expired", "undelivered"];
const PENDING = ["queued", "submitted", "accepted", "sent", "enroute"];

export type SendInput = {
  userId: string;
  channel: Channel;
  from: string;
  numbers: string[];
  text?: string;
  content?: RcsContent;
  campaignName?: string;
  source: "panel" | "api";
  clientRef?: string | null;
  clientDlr?: string | null;
  origin: string;
};

export type SendResult =
  | {
      ok: true;
      campaignId: string | null;
      accepted: number;
      failed: number;
      unroutable: string[];
      charged: number;
      messages: { id: string; to: string; status: string; error: string | null }[];
    }
  | { ok: false; code: 400 | 402 | 503; error: string };

const round = (n: number) => Math.round(n * 100000) / 100000;

async function senderAllowed(userId: string, channel: Channel, from: string) {
  if (channel === "sms" && !(await getSetting<boolean>("require_approved_sms_sender", false))) return true;
  const { data } = await createAdminClient().from("sender_ids").select("id").eq("user_id", userId).eq("channel", channel).eq("sender", from).eq("status", "approved").maybeSingle();
  return Boolean(data);
}

/** Price, charge, record and hand messages to the delivery platform. */
export async function sendMessages(input: SendInput): Promise<SendResult> {
  if (!upstreamConfigured) return { ok: false, code: 503, error: "Sending is temporarily unavailable. Please try again shortly." };
  const db = createAdminClient();
  const from = input.from.trim();
  if (!from) return { ok: false, code: 400, error: "Choose a sender ID." };
  if (!(await senderAllowed(input.userId, input.channel, from)))
    return { ok: false, code: 400, error: input.channel === "rcs" ? "Only approved RCS senders can be used. Request one in Wallet → Sender IDs." : "This sender ID isn't approved yet. Request it in Wallet → Sender IDs." };

  let text = "";
  let segments = 1;
  let encoding: string | null = null;
  if (input.channel === "sms") {
    text = (input.text ?? "").trim();
    if (!text) return { ok: false, code: 400, error: "Write the message text." };
    if (text.length > 1600) return { ok: false, code: 400, error: "The message is too long (1,600 characters max)." };
    const s = smsSegments(text);
    segments = s.segments;
    encoding = s.encoding;
  } else {
    if (!input.content) return { ok: false, code: 400, error: "Add the RCS content." };
    text = input.content.type === "text" ? input.content.text : input.content.type === "card" ? `${input.content.title}\n${input.content.description}` : input.content.cards.map((c) => c.title).join(" · ");
    if (!text.trim()) return { ok: false, code: 400, error: "Write the message text." };
  }

  const numbers = [...new Set(input.numbers)];
  if (numbers.length === 0) return { ok: false, code: 400, error: "Add at least one number, with country code." };
  if (numbers.length > 100000) return { ok: false, code: 400, error: "Up to 100,000 numbers per send. Split larger lists." };

  const routes = await routesFor(input.userId, input.channel);
  const routed: { to: string; route: Route }[] = [];
  const unroutable: string[] = [];
  for (const n of numbers) {
    const r = pickRoute(n, routes);
    if (r) routed.push({ to: n, route: r });
    else unroutable.push(n);
  }
  if (routed.length === 0) return { ok: false, code: 400, error: "None of these numbers are covered by your routes. Check the country codes, or see Coverage." };

  const total = round(routed.reduce((s, x) => s + x.route.price * segments, 0));
  const wallet = "sms"; // single general wallet (the "balance" column) covers all channels
  const label = input.campaignName?.trim() || (routed.length === 1 ? `${input.channel.toUpperCase()} to ${routed[0].to}` : `${input.channel.toUpperCase()} to ${routed.length} numbers`);

  // Campaign row for multi-number sends (or when the client names it).
  let campaignId: string | null = null;
  if (routed.length > 1 || input.campaignName?.trim()) {
    const { data: c } = await db
      .from("campaigns")
      .insert({ user_id: input.userId, name: label.slice(0, 120), channel: input.channel, sender_id: from, message: text, recipients_count: routed.length, segments, cost: total, status: "sending", source: input.source })
      .select("id")
      .single();
    campaignId = c?.id ?? null;
  }

  // Charge first; nothing is sent unless the wallet covers it.
  const charge = await db.rpc("wallet_move", { p_user: input.userId, p_wallet: wallet, p_amount: -total, p_kind: "send", p_reference: campaignId, p_note: `${label} · ${routed.length} msg${routed.length > 1 ? "s" : ""}` });
  if (charge.error) {
    if (campaignId) await db.from("campaigns").delete().eq("id", campaignId);
    if (/insufficient|check constraint/i.test(charge.error.message)) {
      const { data: w } = await db.from("wallets").select("balance").eq("user_id", input.userId).single();
      const bal = Number(w?.balance ?? 0);
      return { ok: false, code: 402, error: `This send costs €${total.toFixed(4)} but your balance is €${bal.toFixed(2)}. Top up in Wallet.` };
    }
    return { ok: false, code: 503, error: "We couldn't start this send. Please try again." };
  }

  // Record every message before handing it over.
  const rows = routed.map((x) => ({
    id: randomUUID(),
    user_id: input.userId,
    campaign_id: campaignId,
    channel: input.channel,
    sender: from,
    recipient: x.to,
    country: x.route.country,
    iso: x.route.iso,
    route_id: x.route.id,
    body: text,
    content: input.channel === "rcs" ? input.content : null,
    segments,
    encoding,
    price: round(x.route.price * segments),
    status: "queued",
    source: input.source,
    client_ref: routed.length === 1 ? (input.clientRef ?? null) : null,
    dlr_url: input.clientDlr ?? null,
  }));
  for (let i = 0; i < rows.length; i += 1000) await db.from("messages").insert(rows.slice(i, i + 1000));

  // Hand over to the delivery platform.
  const dlr = dlrUrl(input.origin);
  const results: UpResult[] = [];
  if (input.channel === "sms") {
    if (rows.length === 1) {
      try {
        results.push(await sendSms({ from, to: rows[0].recipient, text, dlr }));
      } catch (e) {
        results.push({ to: rows[0].recipient, id: null, status: "failed", error: clientSafe(e) });
      }
    } else {
      for (let i = 0; i < rows.length; i += BULK_LIMIT) {
        const chunk = rows.slice(i, i + BULK_LIMIT).map((r) => r.recipient);
        try {
          results.push(...(await sendSmsBulk({ from, to: chunk, text, dlr })));
        } catch (e) {
          results.push(...chunk.map((to) => ({ to, id: null, status: "failed", error: clientSafe(e) })));
        }
      }
    }
  } else {
    // RCS goes one by one, 8 at a time.
    for (let i = 0; i < rows.length; i += 8) {
      const part = await Promise.all(
        rows.slice(i, i + 8).map(async (r) => {
          try {
            return await sendRcs({ from, to: r.recipient, content: input.content!, dlr });
          } catch (e) {
            return { to: r.recipient, id: null, status: "failed", error: clientSafe(e) } as UpResult;
          }
        })
      );
      results.push(...part);
    }
  }

  const marks = rows.map((r, i) => {
    const res = results[i] ?? { id: null, status: "failed", error: "No response" };
    const failed = !res.id || FINAL_FAIL.includes(res.status);
    return { id: r.id, upstream_id: res.id, status: failed ? "failed" : res.status || "submitted", error: failed ? res.error ?? "Not accepted" : null, price: r.price };
  });
  for (let i = 0; i < marks.length; i += 2000) await db.rpc("messages_mark", { p: marks.slice(i, i + 2000).map(({ price: _p, ...m }) => m) });

  // Messages that never left are refunded straight away.
  const refused = marks.filter((m) => m.status === "failed");
  const refund = round(refused.reduce((s, m) => s + m.price, 0));
  if (refund > 0) {
    await db.rpc("wallet_move", { p_user: input.userId, p_wallet: wallet, p_amount: refund, p_kind: "refund", p_reference: campaignId, p_note: `Not submitted: ${refused.length} of ${rows.length}` });
    await db.from("messages").update({ price: 0 }).in("id", refused.map((m) => m.id));
  }
  if (campaignId) await db.from("campaigns").update({ status: refused.length === rows.length ? "rejected" : "sending", cost: round(total - refund), updated_at: new Date().toISOString() }).eq("id", campaignId);

  return {
    ok: true,
    campaignId,
    accepted: rows.length - refused.length,
    failed: refused.length,
    unroutable,
    charged: round(total - refund),
    messages: marks.map((m, i) => ({ id: m.id, to: rows[i].recipient, status: m.status, error: m.error })),
  };
}

/** Apply a delivery report from the platform. Returns the message so the caller can notify the client. */
export async function applyDlr(upstreamId: string, rawStatus: string, ts?: string, error?: string | null) {
  const db = createAdminClient();
  const status = rawStatus.toLowerCase();
  const { data: m } = await db.from("messages").select("id, user_id, channel, status, price, client_ref, dlr_url, recipient").eq("upstream_id", upstreamId).maybeSingle();
  if (!m) return null;
  if (m.status === status) return m;
  // Reports can arrive out of order: never move a final message back to in-flight.
  const final = (x: string) => x === "delivered" || FINAL_FAIL.includes(x);
  if (final(m.status) && !final(status)) return m;
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "delivered") patch.delivered_at = ts ? new Date(ts).toISOString() : new Date().toISOString();
  if (error) patch.error = String(error).slice(0, 300);
  await db.from("messages").update(patch).eq("id", m.id);

  if (FINAL_FAIL.includes(status) && !FINAL_FAIL.includes(m.status) && Number(m.price) > 0 && (await getSetting<boolean>("refund_failed", false))) {
    await db.rpc("wallet_move", { p_user: m.user_id, p_wallet: "sms", p_amount: Number(m.price), p_kind: "refund", p_reference: m.id, p_note: `Undelivered to ${m.recipient}` });
    await db.from("messages").update({ price: 0 }).eq("id", m.id);
  }

  if (m.dlr_url) {
    const url = m.dlr_url;
    // Forward after the response is sent, so the platform gets its 2xx straight away.
    after(() => fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: m.id, vendor_msg_id: null, client_msg_id: m.client_ref, to: m.recipient, status, ts: ts ?? new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    }).then(() => undefined, () => undefined));
  }
  return m;
}

/** Ask the platform for fresh statuses of messages still in flight (used when reports are opened). */
export async function syncPending(userId: string | null, limit = 40) {
  if (!upstreamConfigured) return;
  const db = createAdminClient();
  let q = db
    .from("messages")
    .select("upstream_id")
    .in("status", PENDING)
    .not("upstream_id", "is", null)
    .gte("created_at", new Date(Date.now() - 3 * 864e5).toISOString())
    .lte("updated_at", new Date(Date.now() - 60e3).toISOString())
    .order("updated_at")
    .limit(limit);
  if (userId) q = q.eq("user_id", userId);
  const { data } = await q;
  const ids = (data ?? []).map((r) => r.upstream_id as string).filter((id) => !id.includes(":"));
  for (let i = 0; i < ids.length; i += 6) {
    await Promise.all(
      ids.slice(i, i + 6).map(async (id) => {
        const s = await messageStatus(id);
        if (s?.status) await applyDlr(id, s.status, undefined, s.error);
        else await db.from("messages").update({ updated_at: new Date().toISOString() }).eq("upstream_id", id);
      })
    );
  }
}

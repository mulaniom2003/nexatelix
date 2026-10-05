"use server";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, getSetting } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendMessages } from "@/lib/messaging";
import { parseNumbers } from "@/lib/numbers";
import { originFrom, money } from "@/lib/format";
import { site } from "@/lib/site";
import type { RcsContent } from "@/lib/upstream";

export type ActionState = { ok?: boolean; message?: string; secret?: string } | null;

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/* ── Send ──────────────────────────────────────────────────────── */
function summary(r: { accepted: number; failed: number; unroutable: string[]; charged: number }) {
  const parts = [`${r.accepted.toLocaleString("en-IN")} submitted`];
  if (r.failed) parts.push(`${r.failed.toLocaleString("en-IN")} not accepted (refunded)`);
  if (r.unroutable.length) parts.push(`${r.unroutable.length.toLocaleString("en-IN")} skipped: no route for that country`);
  return `${parts.join(" · ")}. Charged ${money(r.charged, 4)}.`;
}

export async function sendSmsAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const mode = s(form, "mode");
  const raw = mode === "single" ? s(form, "to") : s(form, "numbers");
  const { list } = parseNumbers(raw);
  if (list.length === 0) return { message: mode === "single" ? "Enter a number with country code, e.g. 919876543210." : "Add numbers with country code, one per line." };
  const r = await sendMessages({
    userId: user.id,
    channel: "sms",
    from: s(form, "from"),
    numbers: list,
    text: String(form.get("text") ?? ""),
    campaignName: s(form, "campaign") || undefined,
    source: "panel",
    origin: originFrom(await headers(), site.url),
  });
  if (!r.ok) return { message: r.error };
  revalidatePath("/app", "layout");
  if (r.accepted === 0) return { message: `Nothing was submitted. ${r.messages[0]?.error ?? ""}`.trim() };
  return { ok: true, message: summary(r) };
}

export async function sendRcsAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const mode = s(form, "mode");
  const kind = s(form, "kind");
  const raw = mode === "single" ? s(form, "to") : s(form, "numbers");
  const { list } = parseNumbers(raw);
  if (list.length === 0) return { message: mode === "single" ? "Enter a number in E.164 format, e.g. +919876543210." : "Add numbers with country code, one per line." };

  const btns = (prefix: string) =>
    [1, 2]
      .map((i) => ({ text: s(form, `${prefix}btn${i}_text`), url: s(form, `${prefix}btn${i}_url`) }))
      .filter((b) => b.text && /^https?:\/\//.test(b.url));
  let content: RcsContent;
  if (kind === "card") {
    content = { type: "card", title: s(form, "title"), description: s(form, "description"), media_url: s(form, "media_url") || undefined, suggestions: btns("") };
    if (!content.title) return { message: "Give the card a title." };
  } else if (kind === "carousel") {
    const cards = [1, 2, 3, 4, 5]
      .map((i) => ({ title: s(form, `c${i}_title`), description: s(form, `c${i}_description`), media_url: s(form, `c${i}_media`) || undefined, suggestions: btns(`c${i}_`) }))
      .filter((c) => c.title);
    if (cards.length < 2) return { message: "A carousel needs at least two cards with a title." };
    content = { type: "carousel", cards };
  } else {
    content = { type: "text", text: String(form.get("text") ?? "").trim() };
  }

  const r = await sendMessages({
    userId: user.id,
    channel: "rcs",
    from: s(form, "from"),
    numbers: list,
    content,
    campaignName: s(form, "campaign") || undefined,
    source: "panel",
    origin: originFrom(await headers(), site.url),
  });
  if (!r.ok) return { message: r.error };
  revalidatePath("/app", "layout");
  if (r.accepted === 0) return { message: `Nothing was submitted. ${r.messages[0]?.error ?? ""}`.trim() };
  return { ok: true, message: summary(r) };
}

/* ── Wallet ────────────────────────────────────────────────────── */
export async function requestTopup(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const min = Number(await getSetting("min_topup_usd", 10));
  const schema = z.object({
    amount: z.coerce.number().min(min, `The minimum top-up is $${min}.`).max(100000, "That amount is too large. Message us for large top-ups."),
    wallet: z.enum(["sms", "rcs"]),
    method: z.enum(["upi", "bank", "usdt"]),
    reference: z.string().trim().min(4, "Enter the UTR or transaction ID so we can match your payment.").max(120),
  });
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: parsed.error.issues[0]?.message };
  const { error } = await createAdminClient().from("topups").insert({ user_id: user.id, ...parsed.data });
  if (error) return { message: "We couldn't save your request. Please try again." };
  revalidatePath("/app/wallet");
  return { ok: true, message: "Top-up requested. Credit appears as soon as the payment is confirmed." };
}

export async function requestSender(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const channel = s(form, "channel") === "rcs" ? "rcs" : "sms";
  const sender = s(form, "sender");
  if (channel === "sms" && !/^[A-Za-z0-9 ]{3,11}$|^\d{3,15}$/.test(sender)) return { message: "SMS sender IDs are 3–11 letters/digits, or a phone number." };
  if (channel === "rcs" && (sender.length < 3 || sender.length > 40)) return { message: "Enter your RCS agent / brand name (3–40 characters)." };
  const { error } = await createAdminClient().from("sender_ids").insert({ user_id: user.id, channel, sender, note: s(form, "note") || null });
  if (error) return { message: /duplicate|unique/i.test(error.message) ? "You've already requested this sender ID." : "We couldn't save the request." };
  revalidatePath("/app/wallet");
  return { ok: true, message: `${sender} requested. You'll be able to use it once it's approved.` };
}

/* ── API keys ──────────────────────────────────────────────────── */
export async function createApiKey(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const name = s(form, "name").slice(0, 60) || "My key";
  const db = createAdminClient();
  const { count } = await db.from("api_keys").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("revoked", false);
  if ((count ?? 0) >= 10) return { message: "You already have 10 active keys. Revoke one first." };
  const secret = `nx_live_${randomBytes(24).toString("base64url")}`;
  const { error } = await db.from("api_keys").insert({ user_id: user.id, name, prefix: secret.slice(0, 12), key_hash: createHash("sha256").update(secret).digest("hex") });
  if (error) return { message: "We couldn't create the key. Please try again." };
  revalidatePath("/app/api");
  return { ok: true, message: "Key created. Copy it now: it's shown only once.", secret };
}

export async function revokeApiKey(form: FormData) {
  const { user } = await requireUser();
  await createAdminClient().from("api_keys").update({ revoked: true }).eq("id", s(form, "id")).eq("user_id", user.id);
  revalidatePath("/app/api");
}

/* ── Support ───────────────────────────────────────────────────── */
export async function openTicket(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const subject = s(form, "subject").slice(0, 140);
  const body = s(form, "body").slice(0, 5000);
  if (!subject || !body) return { message: "Add a subject and describe the problem." };
  const db = createAdminClient();
  const { data: t, error } = await db.from("tickets").insert({ user_id: user.id, subject }).select("id").single();
  if (error || !t) return { message: "We couldn't open the ticket. Please try again." };
  await db.from("ticket_messages").insert({ ticket_id: t.id, author_id: user.id, body });
  redirect(`/app/support/${t.id}`);
}

export async function replyTicket(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const id = s(form, "id");
  const body = s(form, "body").slice(0, 5000);
  if (!body) return { message: "Write a message first." };
  const db = createAdminClient();
  const { data: t } = await db.from("tickets").select("user_id").eq("id", id).single();
  if (t?.user_id !== user.id) return { message: "Ticket not found." };
  await db.from("ticket_messages").insert({ ticket_id: id, author_id: user.id, body });
  await db.from("tickets").update({ status: "open", updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/app/support/${id}`);
  return { ok: true, message: "Sent." };
}

/* ── Settings ──────────────────────────────────────────────────── */
export async function saveProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const v = (k: string, max = 120) => s(form, k).slice(0, max) || null;
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ full_name: v("full_name"), company: v("company"), phone: v("phone", 30), telegram: v("telegram", 40)?.replace(/^@/, "") ?? null })
    .eq("id", user.id);
  if (error) return { message: "We couldn't save your profile. Please try again." };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Profile saved." };
}

export async function changePassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { message: "Use at least 8 characters." };
  if (password !== String(form.get("confirm") ?? "")) return { message: "The two passwords don't match." };
  const { error } = await (await createClient()).auth.updateUser({ password });
  if (error) return { message: error.message };
  return { ok: true, message: "Password updated." };
}

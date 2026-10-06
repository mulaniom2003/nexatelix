"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import type { ActionState } from "@/app/app/actions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const done = () => revalidatePath("/admin", "layout");
const wallet = (v: string) => (v === "rcs" ? "rcs" : "sms");

/* ── Top-ups ───────────────────────────────────────────────────── */
export async function approveTopup(form: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  // Flip pending → approved first so a double click can never credit twice.
  const { data: t } = await db
    .from("topups")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", str(form, "id"))
    .eq("status", "pending")
    .select("id, user_id, amount, wallet, method, reference")
    .maybeSingle();
  if (t) await db.rpc("wallet_move", { p_user: t.user_id, p_wallet: "sms", p_amount: Number(t.amount), p_kind: "topup", p_reference: t.id, p_note: `${t.method.toUpperCase()} ${t.reference ?? ""}`.trim() });
  done();
}

export async function rejectTopup(form: FormData) {
  await requireAdmin();
  await createAdminClient()
    .from("topups")
    .update({ status: "rejected", admin_note: str(form, "note") || "Payment not found. Message support with a screenshot.", reviewed_at: new Date().toISOString() })
    .eq("id", str(form, "id"))
    .eq("status", "pending");
  done();
}

/* ── Sender IDs ────────────────────────────────────────────────── */
export async function reviewSender(form: FormData) {
  await requireAdmin();
  const decision = str(form, "decision") === "approve" ? "approved" : "rejected";
  await createAdminClient().from("sender_ids").update({ status: decision, note: str(form, "note") || null, reviewed_at: new Date().toISOString() }).eq("id", str(form, "id"));
  done();
}

export async function addSender(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const sender = str(form, "sender");
  if (!sender) return { message: "Enter the sender ID." };
  const { error } = await createAdminClient()
    .from("sender_ids")
    .upsert({ user_id: str(form, "user_id"), channel: wallet(str(form, "channel")), sender, status: "approved", reviewed_at: new Date().toISOString() }, { onConflict: "user_id,channel,sender" });
  if (error) return { message: error.message };
  done();
  return { ok: true, message: `${sender} approved for this client.` };
}

/* ── Clients ───────────────────────────────────────────────────── */
export async function addClient(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const email = str(form, "email").toLowerCase();
  const password = str(form, "password");
  const full_name = str(form, "full_name");
  const company = str(form, "company");
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { message: "Enter a valid email address." };
  if (password.length < 8) return { message: "Password must be at least 8 characters." };

  const db = createAdminClient();
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, company },
  });
  if (error) {
    if (/registered|exists|already/i.test(error.message)) return { message: "A client with that email already exists." };
    return { message: error.message };
  }
  const uid = data.user!.id;
  await db.from("profiles").update({ full_name: full_name || null, company: company || null, role: "customer" }).eq("id", uid);
  done();
  const creds = [
    `NexaTelix — your account login`,
    `Website: ${site.url}`,
    `Login page: ${site.url}/login`,
    `Email: ${email}`,
    `Password: ${password}`,
    ``,
    `Log in at the login page above. You can change your password in Settings after signing in.`,
  ].join("\n");
  return { ok: true, message: "Client created. Copy the login details below and send them to your client.", secret: creds };
}

/* ── Routes ────────────────────────────────────────────────────── */
function routeFields(form: FormData) {
  return {
    channel: wallet(str(form, "channel")),
    name: str(form, "name").slice(0, 60),
    country: str(form, "country").slice(0, 60),
    iso: str(form, "iso").toUpperCase().slice(0, 3),
    dial_code: str(form, "dial_code").replace(/\D/g, ""),
    price: Number(str(form, "price")),
    is_global: form.get("is_global") === "on",
    active: form.get("active_present") ? form.get("active") === "on" : true,
  };
}

export async function addRoute(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const r = routeFields(form);
  if (!r.name || !r.country || !r.iso || !r.dial_code || !(r.price >= 0)) return { message: "Fill in name, country, ISO, dial code and price." };
  const { error } = await createAdminClient().from("routes").insert({ ...r, active: true });
  if (error) return { message: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: `Route ${r.name} added.` };
}

export async function saveRoute(form: FormData) {
  await requireAdmin();
  const r = routeFields(form);
  if (!r.name || !r.dial_code || !(r.price >= 0)) return;
  await createAdminClient().from("routes").update(r).eq("id", Number(str(form, "id")));
  revalidatePath("/", "layout");
}

export async function assignRoute(form: FormData) {
  await requireAdmin();
  const price = str(form, "price");
  await createAdminClient().from("user_routes").upsert({ user_id: str(form, "user_id"), route_id: Number(str(form, "route_id")), price: price ? Number(price) : null });
  done();
}

export async function unassignRoute(form: FormData) {
  await requireAdmin();
  await createAdminClient().from("user_routes").delete().eq("user_id", str(form, "user_id")).eq("route_id", Number(str(form, "route_id")));
  done();
}

/* ── Clients ───────────────────────────────────────────────────── */
export async function adjustBalance(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const amount = Number(str(form, "amount"));
  if (!amount || !Number.isFinite(amount)) return { message: "Enter an amount, e.g. 25 to add or -5 to deduct." };
  const { error } = await createAdminClient().rpc("wallet_move", {
    p_user: str(form, "user_id"),
    p_wallet: "sms",
    p_amount: amount,
    p_kind: "adjustment",
    p_reference: null,
    p_note: str(form, "note") || (amount > 0 ? "Credit added" : "Deduction"),
  });
  if (error) return { message: /insufficient|check constraint/i.test(error.message) ? "That would take the balance below zero." : error.message };
  done();
  return { ok: true, message: `${amount > 0 ? "Added" : "Deducted"} €${Math.abs(amount).toFixed(2)} ${amount > 0 ? "to" : "from"} the balance.` };
}

/** Quick top-up used on the Clients list (plain form, no inline state). */
export async function creditClient(form: FormData) {
  await requireAdmin();
  const amount = Number(str(form, "amount"));
  if (!amount || !Number.isFinite(amount)) return;
  await createAdminClient().rpc("wallet_move", {
    p_user: str(form, "user_id"),
    p_wallet: "sms",
    p_amount: amount,
    p_kind: "adjustment",
    p_reference: null,
    p_note: amount > 0 ? "Credit added" : "Deduction",
  });
  done();
}

export async function setUserFlag(form: FormData) {
  const { user } = await requireAdmin();
  const id = str(form, "id");
  if (id === user.id) return; // never lock yourself out
  const flag = str(form, "flag");
  const update = flag === "suspend" ? { suspended: true } : flag === "unsuspend" ? { suspended: false } : flag === "admin" ? { role: "admin" } : flag === "customer" ? { role: "customer" } : null;
  if (update) await createAdminClient().from("profiles").update(update).eq("id", id);
  done();
}

/* ── Website prices (marketing pages) ──────────────────────────── */
export async function savePrice(form: FormData) {
  await requireAdmin();
  const unit = Number(str(form, "unit_price"));
  if (!(unit > 0)) return;
  await createAdminClient()
    .from("prices")
    .update({ label: str(form, "label"), description: str(form, "description") || null, unit_price: unit, min_volume: Math.max(0, Number(str(form, "min_volume")) || 0), active: form.get("active") === "on" })
    .eq("id", Number(str(form, "id")));
  revalidatePath("/", "layout");
}

/* ── Tickets ───────────────────────────────────────────────────── */
export async function staffReply(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const id = str(form, "id");
  const body = str(form, "body").slice(0, 5000);
  if (!body) return { message: "Write a reply first." };
  const db = createAdminClient();
  await db.from("ticket_messages").insert({ ticket_id: id, author_id: user.id, is_staff: true, body });
  await db.from("tickets").update({ status: form.get("close") === "on" ? "closed" : "answered", updated_at: new Date().toISOString() }).eq("id", id);
  done();
  return { ok: true, message: "Reply sent." };
}

export async function closeTicket(form: FormData) {
  await requireAdmin();
  await createAdminClient().from("tickets").update({ status: "closed", updated_at: new Date().toISOString() }).eq("id", str(form, "id"));
  done();
}

/* ── Settings ──────────────────────────────────────────────────── */
export async function saveSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const rows = [
    { key: "payment_details", value: { upi: str(form, "upi"), bank: str(form, "bank"), usdt_trc20: str(form, "usdt") } },
    { key: "min_topup_usd", value: Math.max(1, Number(str(form, "min_topup")) || 10) },
    { key: "usd_inr_rate", value: Math.max(1, Number(str(form, "usd_inr")) || 88) },
    { key: "refund_failed", value: form.get("refund_failed") === "on" },
    { key: "require_approved_sms_sender", value: form.get("require_sender") === "on" },
  ];
  const { error } = await createAdminClient().from("settings").upsert(rows);
  if (error) return { message: error.message };
  done();
  return { ok: true, message: "Settings saved." };
}

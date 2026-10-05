/** Small display helpers shared by the panel pages. */

export function money(n: number | string | null | undefined, digits = 2) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: Math.max(digits, 2) }).format(v);
}

export function count(n: number | string | null | undefined) {
  return new Intl.NumberFormat("en-IN").format(Number(n ?? 0));
}

export function when(d: string | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(d));
}

export function day(d: string | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(d));
}

export const statusLabel: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  sending: "Sending",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  open: "Open",
  answered: "Answered",
  closed: "Closed",
};

export function originFrom(h: Headers, fallback: string) {
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host ? `${host.startsWith("localhost") || host.startsWith("192.168.") ? "http" : proto}://${host}` : fallback;
}

/** YYYY-MM-DD for a date in India time. */
export function istDate(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** UTC instant for 00:00 India time on the given YYYY-MM-DD. */
export function istStart(ymd: string) {
  return new Date(`${ymd}T00:00:00+05:30`);
}

export function addDays(ymd: string, n: number) {
  const d = istStart(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return istDate(d);
}

export const isYmd = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

import "server-only";
import { createAdminClient } from "./supabase/server";

export type Route = { id: number; channel: "sms" | "rcs"; name: string; country: string; iso: string; dial_code: string; price: number; assigned: boolean };

/** Routes a client may use: global routes + routes assigned to them (client-specific price wins). */
export async function routesFor(userId: string, channel?: "sms" | "rcs"): Promise<Route[]> {
  const db = createAdminClient();
  let q = db.from("routes").select("id, channel, name, country, iso, dial_code, price, is_global").eq("active", true);
  if (channel) q = q.eq("channel", channel);
  const [{ data: routes }, { data: mine }] = await Promise.all([q, db.from("user_routes").select("route_id, price").eq("user_id", userId)]);
  const assigned = new Map((mine ?? []).map((r) => [r.route_id as number, r.price as number | null]));
  return (routes ?? [])
    .filter((r) => r.is_global || assigned.has(r.id))
    .map((r) => ({
      id: r.id,
      channel: r.channel,
      name: r.name,
      country: r.country,
      iso: r.iso,
      dial_code: String(r.dial_code).replace(/\D/g, ""),
      price: Number(assigned.get(r.id) ?? r.price),
      assigned: assigned.has(r.id),
    }))
    .sort((a, b) => Number(b.assigned) - Number(a.assigned) || a.country.localeCompare(b.country));
}

/** Pick the route for a number: longest matching dial code, assigned routes before global ones. */
export function pickRoute(msisdn: string, routes: Route[]): Route | null {
  let best: Route | null = null;
  for (const r of routes) {
    if (!r.dial_code || !msisdn.startsWith(r.dial_code)) continue;
    if (!best || r.dial_code.length > best.dial_code.length || (r.dial_code.length === best.dial_code.length && r.assigned && !best.assigned)) best = r;
  }
  return best;
}

export { cleanNumber, parseNumbers } from "./numbers";

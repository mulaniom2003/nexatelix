import "server-only";
import { redirect } from "next/navigation";
import { createAdminClient, createClient, supabaseConfigured } from "./supabase/server";
import { fallbackPrices, type PriceRow } from "./site";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  telegram: string | null;
  role: "customer" | "admin";
  suspended: boolean;
  credit_limit?: number | null;
  created_at: string;
};

export async function getSession() {
  if (!supabaseConfigured) return { user: null, profile: null as Profile | null };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null as Profile | null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { user, profile: profile as Profile | null };
}

export async function requireUser() {
  if (!supabaseConfigured) redirect("/login");
  const session = await getSession();
  const { user } = session;
  let { profile } = session;
  if (!user) redirect("/login");
  if (!profile && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Account created before the database trigger existed: create the missing rows once.
    const db = createAdminClient();
    await db.from("profiles").upsert({ id: user.id, email: user.email ?? "", full_name: (user.user_metadata?.full_name as string) ?? "" });
    await db.from("wallets").upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
    profile = ((await db.from("profiles").select("*").eq("id", user.id).single()).data as Profile | null) ?? null;
  }
  if (!profile) redirect("/login?error=profile");
  if (profile.suspended) redirect("/login?error=suspended");
  return { user, profile };
}

export async function requireAdmin() {
  const s = await requireUser();
  if (s.profile.role !== "admin") redirect("/app");
  return s;
}

export async function getPrices(): Promise<PriceRow[]> {
  if (!supabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return fallbackPrices;
  try {
    const { data, error } = await createAdminClient().from("prices").select("*").order("channel").order("sort");
    if (error || !data?.length) return fallbackPrices;
    return data.map((p) => ({ ...p, unit_price: Number(p.unit_price) })) as PriceRow[];
  } catch {
    return fallbackPrices;
  }
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  if (!supabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return fallback;
  const { data } = await createAdminClient().from("settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T) ?? fallback;
}

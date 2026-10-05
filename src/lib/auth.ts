import "server-only";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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

export const DEMO_CUSTOMER: Profile = {
  id: "demo-client-id",
  email: "stacy@gmail.com",
  full_name: "Stacy Miller",
  company: "Stacy Global Gaming",
  phone: "+1 (555) 234-8900",
  telegram: "@stacy_nexatelix",
  role: "customer",
  suspended: false,
  credit_limit: 50000,
  created_at: "2026-07-01T00:00:00Z",
};

export const DEMO_ADMIN: Profile = {
  id: "demo-admin-id",
  email: "admin@nexatelix.com",
  full_name: "NexaTelix Operations",
  company: "NexaTelix HQ",
  phone: "+91 75800 84630",
  telegram: "@COM8XTEL",
  role: "admin",
  suspended: false,
  credit_limit: null,
  created_at: "2025-01-01T00:00:00Z",
};

export async function getSession() {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("nexatelix_demo_role")?.value;
  const demoEmail = cookieStore.get("nexatelix_demo_email")?.value;

  if (demoRole === "admin") {
    return {
      user: { id: DEMO_ADMIN.id, email: demoEmail || DEMO_ADMIN.email, user_metadata: { full_name: DEMO_ADMIN.full_name } } as any,
      profile: DEMO_ADMIN,
    };
  }

  if (demoRole === "customer") {
    return {
      user: { id: DEMO_CUSTOMER.id, email: demoEmail || DEMO_CUSTOMER.email, user_metadata: { full_name: DEMO_CUSTOMER.full_name } } as any,
      profile: { ...DEMO_CUSTOMER, email: demoEmail || DEMO_CUSTOMER.email },
    };
  }

  if (!supabaseConfigured) {
    return {
      user: { id: DEMO_CUSTOMER.id, email: demoEmail || DEMO_CUSTOMER.email, user_metadata: { full_name: DEMO_CUSTOMER.full_name } } as any,
      profile: DEMO_CUSTOMER,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null as Profile | null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { user, profile: profile as Profile | null };
}

export async function requireUser() {
  const session = await getSession();
  const { user } = session;
  let { profile } = session;

  if (!user || !profile) {
    if (!supabaseConfigured) {
      return {
        user: { id: DEMO_CUSTOMER.id, email: DEMO_CUSTOMER.email, user_metadata: { full_name: DEMO_CUSTOMER.full_name } } as any,
        profile: DEMO_CUSTOMER,
      };
    }
    redirect("/login");
  }

  if (profile.suspended) redirect("/login?error=suspended");
  return { user, profile };
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("nexatelix_demo_role")?.value;

  if (demoRole === "admin" || (!supabaseConfigured && !demoRole)) {
    return {
      user: { id: DEMO_ADMIN.id, email: DEMO_ADMIN.email, user_metadata: { full_name: DEMO_ADMIN.full_name } } as any,
      profile: DEMO_ADMIN,
    };
  }

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

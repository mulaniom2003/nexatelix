import { NextResponse } from "next/server";
import { apiUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/server";

/** GET /api/client/v1/balance */
export async function GET(req: Request) {
  const auth = await apiUser(req);
  if ("res" in auth) return auth.res;
  const db = createAdminClient();
  const [{ data }, { data: p }] = await Promise.all([
    db.from("wallets").select("balance, rcs_balance").eq("user_id", auth.userId).single(),
    db.from("profiles").select("credit_limit").eq("id", auth.userId).single(),
  ]);
  return NextResponse.json({ balance: Number(data?.balance ?? 0).toFixed(2), rcs_balance: Number(data?.rcs_balance ?? 0).toFixed(2), credit_limit: String(Number(p?.credit_limit ?? 0)), currency: "USD" });
}

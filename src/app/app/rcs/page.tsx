import type { Metadata } from "next";
import { PageHead } from "@/components/panel/PanelShell";
import { RcsForm } from "@/components/panel/RcsForm";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { routesFor } from "@/lib/routing";

export const metadata: Metadata = { title: "Send RCS" };
export const maxDuration = 300;

export default async function SendRcs() {
  const { user } = await requireUser();
  const db = createAdminClient();
  const [routes, { data: senders }, { data: w }] = await Promise.all([
    routesFor(user.id, "rcs"),
    db.from("sender_ids").select("sender").eq("user_id", user.id).eq("channel", "rcs").eq("status", "approved").order("sender"),
    db.from("wallets").select("balance").eq("user_id", user.id).single(),
  ]);
  return (
    <>
      <PageHead title="Send RCS" sub="Text, rich card or carousel · single, bulk or file" />
      <RcsForm
        routes={routes.map((r) => ({ dial_code: r.dial_code, price: r.price, country: r.country, iso: r.iso, assigned: r.assigned }))}
        senders={(senders ?? []).map((s) => s.sender)}
        balance={Number(w?.balance ?? 0)}
      />
    </>
  );
}

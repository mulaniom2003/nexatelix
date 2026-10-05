import type { Metadata } from "next";
import { PageHead } from "@/components/panel/PanelShell";
import { SmsForm } from "@/components/panel/SmsForm";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { routesFor } from "@/lib/routing";

export const metadata: Metadata = { title: "Send SMS" };
export const maxDuration = 300;

export default async function SendSms() {
  const { user } = await requireUser();
  const db = createAdminClient();
  const [routes, { data: senders }, { data: w }] = await Promise.all([
    routesFor(user.id, "sms"),
    db.from("sender_ids").select("sender").eq("user_id", user.id).eq("channel", "sms").eq("status", "approved").order("sender"),
    db.from("wallets").select("balance").eq("user_id", user.id).single(),
  ]);
  return (
    <>
      <PageHead title="Send SMS" sub="Single, bulk or file upload · live parts and cost preview" />
      <SmsForm
        routes={routes.map((r) => ({ dial_code: r.dial_code, price: r.price, country: r.country, iso: r.iso, assigned: r.assigned }))}
        senders={(senders ?? []).map((s) => s.sender)}
        balance={Number(w?.balance ?? 0)}
      />
    </>
  );
}

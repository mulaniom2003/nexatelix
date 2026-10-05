import type { Metadata } from "next";
import { PanelShell } from "@/components/panel/PanelShell";
import type { NavItem } from "@/components/panel/PanelNav";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: { default: "Overview", template: "%s — NexaTelix" }, robots: { index: false } };

const items: NavItem[] = [
  { href: "/app", label: "Overview", icon: "grid", exact: true },
  { href: "/app/sms", label: "Send SMS", icon: "message" },
  { href: "/app/rcs", label: "Send RCS", icon: "image", exact: true },
  { href: "/app/rcs/history", label: "RCS History", icon: "history" },
  { href: "/app/coverage", label: "Coverage", icon: "globe" },
  { href: "/app/reports", label: "Reports", icon: "chart" },
  { href: "/app/invoices", label: "Invoices", icon: "file" },
  { href: "/app/api", label: "API", icon: "code" },
  { href: "/app/wallet", label: "Wallet", icon: "wallet" },
  { href: "/app/support", label: "Support", icon: "life" },
  { href: "/app/settings", label: "Settings", icon: "settings" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireUser();
  const { data: w } = await (await createClient()).from("wallets").select("balance, rcs_balance").eq("user_id", user.id).single();
  return (
    <PanelShell area="client" items={items} name={profile.full_name ?? ""} email={profile.email} balance={{ sms: Number(w?.balance ?? 0), rcs: Number(w?.rcs_balance ?? 0) }} isAdmin={profile.role === "admin"}>
      {children}
    </PanelShell>
  );
}

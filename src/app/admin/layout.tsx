import type { Metadata } from "next";
import { PanelShell } from "@/components/panel/PanelShell";
import type { NavItem } from "@/components/panel/PanelNav";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: { default: "Admin", template: "%s — NexaTelix admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const [topups, senders, tickets] = await Promise.all([
    db.from("topups").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("sender_ids").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  const items: NavItem[] = [
    { href: "/admin", label: "Overview", icon: "grid", exact: true },
    { href: "/admin/messages", label: "Messages", icon: "message" },
    { href: "/admin/topups", label: "Top-ups", icon: "wallet", count: topups.count ?? 0 },
    { href: "/admin/senders", label: "Sender IDs", icon: "tag", count: senders.count ?? 0 },
    { href: "/admin/routes", label: "Routes", icon: "globe" },
    { href: "/admin/users", label: "Clients", icon: "users" },
    { href: "/admin/tickets", label: "Tickets", icon: "inbox", count: tickets.count ?? 0 },
    { href: "/admin/pricing", label: "Website prices", icon: "chart" },
    { href: "/admin/settings", label: "Settings", icon: "settings" },
  ];
  return (
    <PanelShell area="admin" items={items} name={profile.full_name ?? ""} email={profile.email}>
      {children}
    </PanelShell>
  );
}

import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { PortalSoon } from "@/components/site/PortalSoon";
import { supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Log in" };

const notices: Record<string, string> = {
  link: "That link has expired or was already used. Log in, or request a new reset link.",
  suspended: "This account is suspended. Message us on Telegram if you think this is a mistake.",
  profile: "Your account isn't fully set up yet. Message us on Telegram and we'll fix it.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  if (!supabaseConfigured) return <PortalSoon mode="login" />;
  const { next, error } = await searchParams;
  return (
    <AuthShell eyebrow="Client panel" title={<>Welcome <em>back.</em></>} lead="Send campaigns, top up your wallet and download delivery reports.">
      <LoginForm next={next} notice={error ? notices[error] : undefined} />
    </AuthShell>
  );
}

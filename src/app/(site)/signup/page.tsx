import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/AuthForms";
import { PortalSoon } from "@/components/site/PortalSoon";
import { supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create account" };

export default function Signup() {
  if (!supabaseConfigured) return <PortalSoon mode="signup" />;
  return (
    <AuthShell eyebrow="Get started" title={<>Open an <em>account.</em></>} lead="Free to create. Add credit when you're ready to send, and pay only for what you use.">
      <SignupForm />
    </AuthShell>
  );
}

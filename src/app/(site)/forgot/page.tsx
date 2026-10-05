import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "@/components/auth/AuthForms";
import { PortalSoon } from "@/components/site/PortalSoon";
import { supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reset password" };

export default function Forgot() {
  if (!supabaseConfigured) return <PortalSoon mode="login" />;
  return (
    <AuthShell eyebrow="Password" title={<>Reset your <em>password.</em></>} lead="Enter the email you signed up with and we'll send you a link to choose a new password.">
      <ForgotForm />
    </AuthShell>
  );
}

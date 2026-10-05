"use server";
import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { originFrom } from "@/lib/format";
import { site } from "@/lib/site";

export type AuthState = { ok?: boolean; message?: string } | null;

const safeNext = (n: FormDataEntryValue | null) => {
  const s = typeof n === "string" ? n : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/app";
};

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { message: "The client panel isn't connected yet." };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { message: "Enter your email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/confirm/i.test(error.message)) return { message: "Please confirm your email first. Check your inbox for the link we sent." };
    return { message: "That email and password don't match. Try again or reset your password." };
  }
  redirect(safeNext(form.get("next")));
}

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name."),
  company: z.string().trim().max(120).optional(),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters for your password."),
});

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { message: "The client panel isn't connected yet." };
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: parsed.error.issues[0]?.message };
  const { full_name, company, email, password } = parsed.data;
  const origin = originFrom(await headers(), site.url);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, company: company ?? "" }, emailRedirectTo: `${origin}/auth/callback?next=/app` },
  });
  if (error) {
    if (/registered|exists/i.test(error.message)) return { message: "An account with this email already exists. Log in instead." };
    return { message: error.message };
  }
  if (data.session) redirect("/app");
  return { ok: true, message: `Almost done. We sent a confirmation link to ${email}. Open it to activate your account.` };
}

export async function sendReset(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { message: "The client panel isn't connected yet." };
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { message: "Enter your email address." };
  const origin = originFrom(await headers(), site.url);
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/app/settings%23password` });
  return { ok: true, message: "If an account exists for that email, a reset link is on its way. Check your inbox." };
}

export async function signOut() {
  if (supabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

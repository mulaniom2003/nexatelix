import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient, supabaseConfigured } from "./supabase/server";

export const apiError = (status: number, error: string) => NextResponse.json({ error }, { status });

/** Resolve the user behind an `Authorization: Bearer nx_live_…` header, or return an error response. */
export async function apiUser(req: Request): Promise<{ userId: string } | { res: NextResponse }> {
  if (!supabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { res: apiError(503, "The API is not available yet.") };
  const token = ((req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim() || new URL(req.url).searchParams.get("api_key") || "").trim();
  if (!token.startsWith("nx_live_")) return { res: apiError(401, "Missing API key. Send it as: Authorization: Bearer <key> (or ?api_key=)") };
  const db = createAdminClient();
  const hash = createHash("sha256").update(token).digest("hex");
  const { data: key } = await db.from("api_keys").select("id, user_id, revoked, profiles(suspended)").eq("key_hash", hash).maybeSingle();
  if (!key || key.revoked) return { res: apiError(401, "This API key is invalid or has been revoked.") };
  if ((key.profiles as unknown as { suspended: boolean } | null)?.suspended) return { res: apiError(403, "This account is suspended.") };
  await db.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id);
  return { userId: key.user_id };
}

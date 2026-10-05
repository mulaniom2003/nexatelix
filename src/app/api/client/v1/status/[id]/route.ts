import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { messageStatus } from "@/lib/upstream";
import { applyDlr } from "@/lib/messaging";

/** GET /api/client/v1/status/:id — delivery status of one message. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiUser(req);
  if ("res" in auth) return auth.res;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError(404, "Message not found.");
  const db = createAdminClient();
  const sel = "id, client_ref, sender, recipient, status, error, segments, price, created_at, updated_at, delivered_at, upstream_id";
  let { data: m } = await db.from("messages").select(sel).eq("id", id).eq("user_id", auth.userId).maybeSingle();
  if (!m) return apiError(404, "Message not found.");
  if (["submitted", "accepted", "queued"].includes(m.status) && m.upstream_id && !m.upstream_id.includes(":")) {
    const s = await messageStatus(m.upstream_id);
    if (s?.status && s.status !== m.status) {
      await applyDlr(m.upstream_id, s.status, undefined, s.error);
      m = (await db.from("messages").select(sel).eq("id", id).single()).data ?? m;
    }
  }
  return NextResponse.json({
    message: {
      id: m.id,
      source: m.sender,
      destination: m.recipient,
      status: m.status === "queued" || m.status === "accepted" ? "submitted" : m.status,
      error_code: m.error ?? null,
      submit_time: m.created_at,
      dlr_time: m.delivered_at ?? (["submitted", "accepted", "queued"].includes(m.status) ? null : m.updated_at),
      segments: m.segments,
      cost: Number(m.price),
    },
  });
}

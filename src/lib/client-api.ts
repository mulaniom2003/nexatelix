import "server-only";
import { NextResponse } from "next/server";
import { apiError } from "./api-auth";
import { sendMessages, type SendInput } from "./messaging";

/** Shared response shape for the public client API. */
export async function apiSend(input: SendInput, single: boolean) {
  const r = await sendMessages(input);
  if (!r.ok) return apiError(r.code, r.error);
  if (single) {
    const m = r.messages[0];
    if (!m) return apiError(400, r.unroutable.length ? "This number isn't covered by your routes." : "Nothing to send.");
    if (m.status === "failed") return apiError(502, m.error ?? "The message couldn't be submitted.");
    return NextResponse.json({ id: m.id, client_msg_id: input.clientRef ?? null, to: m.to, status: m.status === "queued" ? "submitted" : m.status }, { status: 202 });
  }
  return NextResponse.json(
    {
      accepted: r.accepted,
      invalid: [...r.unroutable, ...r.messages.filter((m) => m.status === "failed").map((m) => m.to)],
      messages: r.messages.filter((m) => m.status !== "failed").map((m) => ({ to: m.to, id: m.id })),
      batch_id: r.campaignId,
      charged: r.charged,
    },
    { status: 202 }
  );
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const isUrl = (u: unknown) => typeof u === "string" && /^https?:\/\/\S+$/i.test(u);

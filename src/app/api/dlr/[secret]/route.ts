import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { applyDlr } from "@/lib/messaging";

/** Delivery reports from the delivery platform: { message_id, status, ts }. */
export async function POST(req: Request, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  const expected = process.env.DLR_SECRET ?? "";
  const a = Buffer.from(decodeURIComponent(secret));
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) return new NextResponse("Not found", { status: 404 });

  let body: Record<string, unknown> = {};
  const type = req.headers.get("content-type") ?? "";
  try {
    body = type.includes("json") ? await req.json() : Object.fromEntries(new URLSearchParams(await req.text()));
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const items = Array.isArray(body) ? (body as Record<string, unknown>[]) : [body];
  for (const it of items) {
    const id = String(it.message_id ?? it.id ?? "");
    const status = String(it.status ?? "");
    if (!id || !status) continue;
    const hit = await applyDlr(id, status, it.ts ? String(it.ts) : undefined, (it.error as string) ?? null);
    if (!hit && it.to) await applyDlr(`${id}:${it.to}`, status, it.ts ? String(it.ts) : undefined, (it.error as string) ?? null);
  }
  return NextResponse.json({ ok: true });
}

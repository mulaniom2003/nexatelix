import { NextResponse, type NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { invoiceNumber, monthLabel } from "@/lib/invoice";
import { site } from "@/lib/site";

const INK = rgb(0.043, 0.043, 0.047);
const MUTE = rgb(0.45, 0.45, 0.43);
const LINE = rgb(0.86, 0.85, 0.82);
const LIME = rgb(0.776, 1, 0.239);

/** Monthly invoice PDF for the signed-in client (admins may pass ?user=). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ month: string }> }) {
  const { user, profile } = await getSession();
  if (!user || !profile) return NextResponse.redirect(new URL("/login", req.url));
  const { month } = await params;
  if (!/^\d{4}-\d{2}$/.test(month)) return new NextResponse("Not found", { status: 404 });
  const owner = profile.role === "admin" && req.nextUrl.searchParams.get("user") ? req.nextUrl.searchParams.get("user")! : user.id;

  const db = createAdminClient();
  const [{ data: who }, { data: usage }] = await Promise.all([
    db.from("profiles").select("full_name, company, email, phone").eq("id", owner).single(),
    db.rpc("msg_monthly_usage", { p_user: owner }),
  ]);
  const row = ((usage ?? []) as { month: string; sms_count: number; rcs_count: number; sms_cost: number; rcs_cost: number }[]).find((r) => String(r.month).startsWith(month));
  if (!row || !who) return new NextResponse("No invoice for this month", { status: 404 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const M = 56;
  const text = (t: string, x: number, y: number, o: { size?: number; f?: typeof font; color?: typeof INK; right?: boolean } = {}) => {
    const size = o.size ?? 10;
    const f = o.f ?? font;
    const w = f.widthOfTextAtSize(t, size);
    page.drawText(t, { x: o.right ? x - w : x, y, size, font: f, color: o.color ?? INK });
  };

  // Brand mark: single-line N with a lime dot.
  page.drawRectangle({ x: M, y: 770, width: 30, height: 30, color: INK });
  page.drawLine({ start: { x: M + 9, y: 778 }, end: { x: M + 9, y: 792 }, thickness: 2.6, color: rgb(0.95, 0.94, 0.9) });
  page.drawLine({ start: { x: M + 9, y: 792 }, end: { x: M + 21, y: 778 }, thickness: 2.6, color: rgb(0.95, 0.94, 0.9) });
  page.drawLine({ start: { x: M + 21, y: 778 }, end: { x: M + 21, y: 785 }, thickness: 2.6, color: rgb(0.95, 0.94, 0.9) });
  page.drawCircle({ x: M + 21, y: 792, size: 2.6, color: LIME });
  text(site.name, M + 40, 780, { size: 16, f: bold });
  text("INVOICE", width - M, 784, { size: 20, f: bold, right: true });
  text(invoiceNumber(owner, month), width - M, 768, { size: 10, color: MUTE, right: true });

  page.drawLine({ start: { x: M, y: 745 }, end: { x: width - M, y: 745 }, thickness: 0.8, color: LINE });

  text("BILLED TO", M, 720, { size: 8, f: bold, color: MUTE });
  let y = 704;
  for (const l of [who.full_name || who.email, who.company, who.email, who.phone].filter(Boolean) as string[]) {
    text(l, M, y, { size: 10.5 });
    y -= 15;
  }
  text("PERIOD", 340, 720, { size: 8, f: bold, color: MUTE });
  text(monthLabel(month), 340, 704, { size: 10.5 });
  text("ISSUED BY", 340, 680, { size: 8, f: bold, color: MUTE });
  text(site.legalName, 340, 664, { size: 10.5 });
  text(site.url.replace(/^https?:\/\//, ""), 340, 649, { size: 10.5, color: MUTE });

  // Lines
  y = 600;
  text("DESCRIPTION", M, y, { size: 8, f: bold, color: MUTE });
  text("QTY", 360, y, { size: 8, f: bold, color: MUTE, right: true });
  text("AVG. RATE", 450, y, { size: 8, f: bold, color: MUTE, right: true });
  text("AMOUNT (USD)", width - M, y, { size: 8, f: bold, color: MUTE, right: true });
  page.drawLine({ start: { x: M, y: y - 8 }, end: { x: width - M, y: y - 8 }, thickness: 0.8, color: LINE });
  y -= 30;
  const lines = [
    { d: "SMS messages", q: Number(row.sms_count), a: Number(row.sms_cost) },
    { d: "RCS messages", q: Number(row.rcs_count), a: Number(row.rcs_cost) },
  ].filter((l) => l.q > 0);
  for (const l of lines) {
    text(l.d, M, y, { size: 10.5 });
    text(l.q.toLocaleString("en-IN"), 360, y, { size: 10.5, right: true });
    text((l.a / l.q).toFixed(5), 450, y, { size: 10.5, right: true });
    text(l.a.toFixed(2), width - M, y, { size: 10.5, right: true });
    y -= 24;
  }
  page.drawLine({ start: { x: 340, y: y + 6 }, end: { x: width - M, y: y + 6 }, thickness: 0.8, color: LINE });
  const total = lines.reduce((s, l) => s + l.a, 0);
  y -= 14;
  text("TOTAL", 340, y, { size: 10, f: bold });
  text(`$${total.toFixed(2)}`, width - M, y, { size: 14, f: bold, right: true });
  y -= 22;
  text("Paid in advance from your prepaid wallet.", 340, y, { size: 9, color: MUTE });

  text(`${site.name} · ${site.contact.supportEmail} · ${site.url.replace(/^https?:\/\//, "")}`, M, 50, { size: 8.5, color: MUTE });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${invoiceNumber(owner, month)}.pdf"`, "Cache-Control": "no-store" },
  });
}

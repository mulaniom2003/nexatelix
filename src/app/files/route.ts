import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/** Short-lived download link for a campaign's recipient list or delivery report (owner or admin only). */
export async function GET(request: NextRequest) {
  const { user, profile } = await getSession();
  if (!user || !profile) return NextResponse.redirect(new URL("/login", request.url));
  const id = request.nextUrl.searchParams.get("c") ?? "";
  const which = request.nextUrl.searchParams.get("f") === "report" ? "report_path" : "recipients_path";

  const db = createAdminClient();
  const { data: c } = await db.from("campaigns").select("user_id, recipients_path, report_path").eq("id", id).maybeSingle();
  if (!c || (c.user_id !== user.id && profile.role !== "admin")) return new NextResponse("Not found", { status: 404 });
  const path = c[which];
  if (!path) return new NextResponse("No file yet", { status: 404 });

  const { data } = await db.storage.from("campaign-files").createSignedUrl(path, 60, { download: true });
  if (!data?.signedUrl) return new NextResponse("File unavailable", { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}

import type { Metadata } from "next";
import { PageHead } from "@/components/panel/PanelShell";
import { CoverageTable } from "@/components/panel/CoverageTable";
import { requireUser } from "@/lib/auth";
import { routesFor } from "@/lib/routing";

export const metadata: Metadata = { title: "Coverage" };

export default async function Coverage() {
  const { user } = await requireUser();
  const routes = await routesFor(user.id);
  return (
    <>
      <PageHead title="Coverage & rates" sub="Routes you can send on (assigned + global) · prices in USD, per SMS part or per RCS message" />
      <CoverageTable routes={routes.map((r) => ({ id: r.id, name: r.name, channel: r.channel, country: r.country, iso: r.iso, dial_code: r.dial_code, price: r.price, assigned: r.assigned }))} />
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { legal } from "@/lib/legal";

export function generateStaticParams() {
  return Object.keys(legal).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: legal[slug]?.title ?? "Legal" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = legal[slug];
  if (!doc) notFound();
  return (
    <section className="phero">
      <div className="wrap">
        <p className="eyebrow" style={{ marginBottom: 32 }}>
          <span className="dot" /> Legal · Updated {doc.updated}
        </p>
        <h1 className="h1" style={{ marginBottom: 48 }}>{doc.title}</h1>
        <div className="prose">{doc.body}</div>
      </div>
    </section>
  );
}

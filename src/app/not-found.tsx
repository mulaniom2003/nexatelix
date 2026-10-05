import Link from "next/link";

export default function NotFound() {
  return (
    <section className="center-page">
      <div className="gridlines" />
      <div className="center-card">
        <p className="eyebrow">
          <span className="dot" /> 404 · Undelivered
        </p>
        <h1 className="display" style={{ fontSize: "clamp(64px, 12vw, 160px)" }}>
          Lost in <em>transit.</em>
        </h1>
        <p className="lead">This page doesn&apos;t exist, or it moved. The homepage is a safe place to start.</p>
        <Link href="/" className="btn btn-primary" style={{ justifySelf: "start" }}>
          <span className="btn-label">
            <span>Back to home</span>
            <span aria-hidden>Back to home</span>
          </span>
        </Link>
      </div>
    </section>
  );
}

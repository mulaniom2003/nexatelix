import type { ReactNode } from "react";

/** Two-column auth page: message on the left, form card on the right. */
export function AuthShell({ eyebrow, title, lead, children }: { eyebrow: string; title: ReactNode; lead: string; children: ReactNode }) {
  return (
    <section className="auth-page">
      <div className="gridlines" />
      <div className="wrap auth-grid">
        <div className="auth-copy">
          <p className="eyebrow">
            <span className="dot" /> {eyebrow}
          </p>
          <h1 className="h1">{title}</h1>
          <p className="lead">{lead}</p>
        </div>
        <div className="auth-card">{children}</div>
      </div>
    </section>
  );
}

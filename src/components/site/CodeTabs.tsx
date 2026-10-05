"use client";
import { useState } from "react";

export function CodeTabs({ tabs }: { tabs: { label: string; code: string }[] }) {
  const [i, setI] = useState(0);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tabs[i].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="seg" role="tablist">
        {tabs.map((t, k) => (
          <button key={t.label} type="button" role="tab" aria-selected={i === k} className={i === k ? "on" : ""} onClick={() => setI(k)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="code-wrap">
        <pre className="code">{tabs[i].code}</pre>
        <button type="button" className="tag copy" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

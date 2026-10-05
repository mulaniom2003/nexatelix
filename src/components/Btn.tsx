import Link from "next/link";
import { Arrow } from "./icons";

type Props = {
  href: string;
  children: string;
  variant?: "primary" | "ghost" | "signal";
  size?: "sm" | "md";
  arrow?: boolean;
  external?: boolean;
  className?: string;
};

/** Pill button with a rolling-label hover. */
export function Btn({ href, children, variant = "primary", size = "md", arrow = true, external, className = "" }: Props) {
  const cls = `btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`;
  const inner = (
    <>
      <span className="btn-label">
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
      {arrow && <Arrow />}
    </>
  );
  if (external || href.startsWith("http") || href.startsWith("mailto:")) {
    return (
      <a href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" data-cursor="big">
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} data-cursor="big">
      {inner}
    </Link>
  );
}

export function SubmitBtn({ children, pending, variant = "primary", block }: { children: string; pending?: boolean; variant?: "primary" | "signal" | "ghost"; block?: boolean }) {
  return (
    <button type="submit" className={`btn btn-${variant} ${block ? "btn-block" : ""}`} disabled={pending}>
      <span className="btn-label">
        <span>{pending ? "Working…" : children}</span>
        <span aria-hidden>{pending ? "Working…" : children}</span>
      </span>
      <Arrow />
    </button>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../icons";

export type NavItem = { href: string; label: string; icon: keyof typeof Icon; exact?: boolean; count?: number };

export function PanelNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="pnav" aria-label="Panel">
      {items.map((it) => {
        const I = Icon[it.icon];
        const active = it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/");
        return (
          <Link key={it.href} href={it.href} className={`pnav-link ${active ? "on" : ""}`} aria-current={active ? "page" : undefined}>
            <I /> <span>{it.label}</span>
            {!!it.count && <em className="pnav-count">{it.count}</em>}
          </Link>
        );
      })}
    </nav>
  );
}

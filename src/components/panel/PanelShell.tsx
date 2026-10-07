import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, Icon } from "../icons";
import { PanelNav, type NavItem } from "./PanelNav";
import { MobileNav } from "./MobileNav";
import { signOut } from "@/app/auth/actions";
import { money } from "@/lib/format";

export function PanelShell({
  area,
  items,
  name,
  email,
  balance,
  isAdmin,
  children,
}: {
  area: "client" | "admin";
  items: NavItem[];
  name: string;
  email: string;
  balance?: number;
  isAdmin?: boolean;
  children: ReactNode;
}) {
  const initials = (name || email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("");
  return (
    <div className="panel">
      <aside className="pside">
        <Link href="/" className="wordmark pside-brand" aria-label="NexaTelix home">
          <Logo /> NexaTelix
          {area === "admin" && <span className="tag on" style={{ height: 22, fontSize: 10 }}>ADMIN</span>}
        </Link>
        <PanelNav items={items} />
        <div className="pside-foot">
          {area === "client" && isAdmin && (
            <Link href="/admin" className="pnav-link">
              <Icon.lock /> <span>Admin panel</span>
            </Link>
          )}
          {area === "admin" && (
            <Link href="/app" className="pnav-link">
              <Icon.user /> <span>Client view</span>
            </Link>
          )}
          <form action={signOut}>
            <button type="submit" className="pnav-link">
              <Icon.logout /> <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>
      <div className="pmain">
        <header className="ptop">
          <MobileNav items={items} isAdmin={isAdmin} area={area} />
          {balance != null ? (
            <Link href="/app/wallet" className="pbal" aria-label="Wallet">
              <span className="muted">Balance</span>
              <b className="tnum">{money(balance)}</b>
              <span className="pbal-add" aria-hidden>+</span>
            </Link>
          ) : (
            <span />
          )}
          <div className="puser">
            <span className="puser-av">{initials || "U"}</span>
            <span className="puser-txt">
              <b>{name || "Your account"}</b>
              <small>{email}</small>
            </span>
          </div>
        </header>
        <main className="pbody">{children}</main>
      </div>
    </div>
  );
}

export function PageHead({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="phead">
      <div>
        <h1 className="h3">{title}</h1>
        {sub && <p className="muted" style={{ marginTop: 6 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Status({ s }: { s: string }) {
  return <span className={`badge b-${s}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <b>{title}</b>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { Logo, Icon } from "../icons";
import { PanelNav, type NavItem } from "./PanelNav";
import { signOut } from "@/app/auth/actions";

export function MobileNav({ items, isAdmin, area }: { items: NavItem[]; isAdmin?: boolean; area: "client" | "admin" }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button className="mnav-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
      </button>
      <div className={`mnav-scrim ${open ? "open" : ""}`} hidden={!open} onClick={close} />
      <aside className={`mnav-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="mnav-head">
          <span className="wordmark"><Logo /> NexaTelix</span>
          <button className="mnav-x" aria-label="Close menu" onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div onClick={close}>
          <PanelNav items={items} />
        </div>
        <div className="mnav-foot" onClick={close}>
          {area === "client" && isAdmin && (
            <Link href="/admin" className="pnav-link"><Icon.lock /> <span>Admin panel</span></Link>
          )}
          {area === "admin" && (
            <Link href="/app" className="pnav-link"><Icon.user /> <span>Client view</span></Link>
          )}
          <form action={signOut}>
            <button type="submit" className="pnav-link"><Icon.logout /> <span>Sign out</span></button>
          </form>
        </div>
      </aside>
    </>
  );
}

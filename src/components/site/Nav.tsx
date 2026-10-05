"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { nav, site } from "@/lib/site";
import { Logo } from "../icons";
import { Btn } from "../Btn";

export function Nav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      setSolid(y > 24);
      setHidden(y > 400 && y > last);
      last = y;
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header className={`nav ${solid || open ? "solid" : ""} ${hidden && !open ? "hidden" : ""}`}>
        <div className="wrap nav-inner">
          <Link href="/" className="wordmark" aria-label={`${site.name} home`}>
            <Logo />
            {site.name}
          </Link>
          <ul className="nav-links">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className={pathname.startsWith(n.href) ? "active" : ""}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="nav-right">
            {signedIn ? (
              <Btn href="/app" size="sm" className="hide-m">
                Dashboard
              </Btn>
            ) : (
              <>
                <Link href="/login" className="link-u hide-m">
                  Log in
                </Link>
                <Btn href="/signup" size="sm" className="hide-m">
                  Start sending
                </Btn>
              </>
            )}
            <button className={`burger ${open ? "open" : ""}`} onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav>
              {nav.map((n, i) => (
                <motion.div key={n.href} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                  <Link href={n.href} className="big">
                    {n.label}
                    <small>0{i + 1}</small>
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <Btn href={signedIn ? "/app" : "/signup"}>{signedIn ? "Dashboard" : "Start sending"}</Btn>
              {!signedIn && (
                <Btn href="/login" variant="ghost" arrow={false}>
                  Log in
                </Btn>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

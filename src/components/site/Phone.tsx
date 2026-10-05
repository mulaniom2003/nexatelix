"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "framer-motion";
import { Verified } from "../icons";

export type PhoneItem =
  | { kind: "in"; text: ReactNode; time?: string }
  | { kind: "out"; text: ReactNode; time?: string }
  | { kind: "rich"; title: string; text: string; buttons: string[]; art: ArtKind; caption?: string }
  | { kind: "chips"; items: string[] }
  | { kind: "typing" };

export type ArtKind = "lime" | "dusk" | "mono" | "ocean";

export type PhoneTheme = "rcs" | "sms" | "wa" | "tg";

const HEAD: Record<PhoneTheme, { color: string; fg: string }> = {
  rcs: { color: "#c6ff3d", fg: "#0b0b0c" },
  sms: { color: "#2a2a30", fg: "#fff" },
  wa: { color: "#25d366", fg: "#0b141a" },
  tg: { color: "#2aa3e0", fg: "#fff" },
};

export function Art({ kind, label }: { kind: ArtKind; label?: string }) {
  const bg: Record<ArtKind, string> = {
    lime: "radial-gradient(120% 90% at 85% 10%, #c6ff3d 0 18%, transparent 19%), radial-gradient(80% 120% at 10% 100%, #1d3a08 0 40%, transparent 41%), linear-gradient(135deg,#0f1a06,#26410b)",
    dusk: "radial-gradient(70% 70% at 80% 20%, #ff9a5a 0 20%, transparent 50%), linear-gradient(160deg,#2b1440,#0d0b1f 60%)",
    mono: "repeating-linear-gradient(90deg, #f2efe6 0 1px, transparent 1px 14px), linear-gradient(135deg,#18181b,#0b0b0c)",
    ocean: "radial-gradient(90% 80% at 20% 20%, #4cc3ff 0 12%, transparent 40%), linear-gradient(150deg,#06263a,#04121c)",
  };
  return (
    <div className="media" style={{ background: bg[kind] }}>
      {label && (
        <div style={{ position: "absolute", left: 14, bottom: 10, fontFamily: "var(--f-serif)", fontSize: 30, lineHeight: 0.9, color: "#fff", letterSpacing: "-0.02em" }}>
          {label}
        </div>
      )}
    </div>
  );
}

/** Animated phone that plays a scripted conversation, looping while visible. */
export function Phone({
  theme = "rcs",
  name,
  sub,
  initials,
  items,
  input = "Text message",
  verified,
  loop = true,
  style,
}: {
  theme?: PhoneTheme;
  name: string;
  sub?: string;
  initials: string;
  items: PhoneItem[];
  input?: string;
  verified?: boolean;
  loop?: boolean;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  // Start with the full conversation so the phone is never empty (no-JS, slow phones, screenshots).
  const [count, setCount] = useState(items.length);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    // Keep the earlier messages on screen and replay only the last two, so the phone never looks empty.
    const start = Math.max(1, items.length - 2);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = (i: number) => {
      if (cancelled) return;
      if (i >= items.length) {
        if (loop) timers.push(setTimeout(() => { setCount(start); run(start); }, 5200));
        return;
      }
      const it = items[i];
      const incoming = it.kind !== "out" && it.kind !== "chips";
      if (incoming && i > 0) {
        setTyping(true);
        timers.push(
          setTimeout(() => {
            setTyping(false);
            setCount(i + 1);
            timers.push(setTimeout(() => run(i + 1), 900));
          }, 1100)
        );
      } else {
        setCount(i + 1);
        timers.push(setTimeout(() => run(i + 1), i === 0 ? 700 : 1000));
      }
    };
    // Replay the conversation from the first message once the phone is on screen.
    timers.push(setTimeout(() => { setCount(start); run(start); }, 900));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, items, loop]);

  const h = HEAD[theme];
  const shown = items.slice(0, count);

  return (
    <div ref={ref} className={`phone ${theme}`} style={style}>
      <div className="phone-screen">
        <div className="phone-island" />
        <div className="phone-status">
          <span>9:41</span>
          <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <svg width="17" height="11" viewBox="0 0 17 11" fill="#fff"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x=".5" y=".5" width="21" height="11" rx="3.5" stroke="#fff" opacity=".4" /><rect x="2" y="2" width="16" height="8" rx="2" fill="#fff" /><rect x="23" y="4" width="1.5" height="4" rx=".75" fill="#fff" opacity=".4" /></svg>
          </span>
        </div>
        <div className="phone-head">
          <div className="pav" style={{ background: h.color, color: h.fg }}>
            {initials}
          </div>
          <div>
            <div className="pname">
              {name} {verified && <Verified />}
            </div>
            {sub && <div className="psub">{sub}</div>}
          </div>
        </div>
        <div className="phone-body">
          <AnimatePresence initial={false}>
            {shown.map((it, i) => (
              <motion.div
                key={`${i}-${count > i}`}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: "flex", flexDirection: "column", alignItems: it.kind === "out" ? "flex-end" : "flex-start" }}
              >
                {it.kind === "in" && (
                  <div className="bubble">
                    {it.text}
                    {it.time && <span className="time">{it.time}</span>}
                  </div>
                )}
                {it.kind === "out" && (
                  <div className="bubble me">
                    {it.text}
                    {it.time && <span className="time">{it.time}</span>}
                  </div>
                )}
                {it.kind === "rich" && (
                  <div className="rich">
                    <Art kind={it.art} label={it.caption} />
                    <div className="rbody">
                      <div className="rtitle">{it.title}</div>
                      <div className="rtext">{it.text}</div>
                    </div>
                    {it.buttons.map((b) => (
                      <span className="rbtn" key={b}>
                        {b}
                      </span>
                    ))}
                  </div>
                )}
                {it.kind === "chips" && (
                  <div className="chips">
                    {it.items.map((c) => (
                      <span key={c}>{c}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
            {typing && (
              <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="typing">
                  <i />
                  <i />
                  <i />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="phone-input">{input}</div>
      </div>
    </div>
  );
}

"use client";
import { motion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/** Masked line-by-line text reveal. Pass lines as array; supports JSX per line. */
export function RevealLines({ lines, className, as = "h2", delay = 0 }: { lines: ReactNode[]; className?: string; as?: "h1" | "h2" | "h3" | "p" | "div"; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const Tag = motion[as];
  return (
    <Tag ref={ref} className={className}>
      {lines.map((l, i) => (
        <span key={i} className="reveal-line">
          <motion.span initial={{ y: "110%" }} animate={inView ? { y: "0%" } : {}} transition={{ duration: 1.1, ease, delay: delay + i * 0.08 }}>
            {l}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

export function FadeUp({ children, delay = 0, className, y = 28 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Adds `.in` class once visible — used for CSS-driven effects (e.g. step progress line). */
export function InViewClass({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  return (
    <Tag ref={ref as never} className={`${className} ${inView ? "in" : ""}`}>
      {children}
    </Tag>
  );
}

export function Counter({ to, decimals = 0, suffix = "", prefix = "" }: { to: number; decimals?: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 2.2, ease: [0.16, 1, 0.3, 1], onUpdate: setV });
    return () => c.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className="tnum">
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
}

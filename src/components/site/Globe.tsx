"use client";
import { useEffect, useRef } from "react";

/**
 * Dotted, rotating orthographic globe with animated message arcs.
 * Pure canvas 2D — light, crisp, no WebGL dependency.
 */

// Coarse land mask: [latMin, latMax, lonMin, lonMax] rectangles approximating continents.
const LAND: [number, number, number, number][] = [
  // North America
  [50, 70, -165, -60], [30, 50, -125, -70], [15, 30, -110, -80], [8, 15, -92, -78], [60, 82, -75, -20],
  // South America
  [-5, 12, -80, -50], [-20, -5, -78, -36], [-35, -20, -72, -45], [-55, -35, -75, -63],
  // Europe
  [36, 44, -10, 3], [43, 55, -5, 30], [55, 70, 5, 40], [36, 46, 10, 28],
  // Africa
  [15, 35, -17, 35], [0, 15, -17, 50], [-15, 0, 10, 42], [-35, -15, 14, 35],
  // Middle East / Asia
  [12, 38, 35, 60], [38, 55, 40, 90], [55, 75, 40, 180], [20, 40, 60, 90], [8, 30, 68, 90],
  [20, 45, 90, 122], [30, 45, 122, 145], [0, 20, 95, 110], [-8, 6, 95, 141],
  // Oceania
  [-38, -12, 114, 153], [-46, -35, 166, 178],
];

const isLand = (lat: number, lon: number) => LAND.some(([a, b, c, d]) => lat >= a && lat <= b && lon >= c && lon <= d);

// Hubs [lat, lon]
const HUBS: [number, number][] = [
  [28.6, 77.2], [19.1, 72.9], [51.5, -0.1], [25.2, 55.3], [1.35, 103.8], [-23.5, -46.6], [40.7, -74], [14.6, 121],
  [52.5, 13.4], [50.4, 30.5], [35.7, 139.7], [-33.9, 151.2], [6.5, 3.4], [-26.2, 28.0], [19.4, -99.1], [41, 29],
];

export function Globe({ className = "globe" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = 0, h = 0, dpr = 1, raf = 0;
    let rot = -60; // degrees
    let tilt = -18;
    let targetTilt = tilt;
    let pointerX = 0;

    // Dot field: an even fibonacci sphere. Land dots are bright, ocean dots faint,
    // so the globe reads as a solid sphere instead of scattered fragments.
    const dots: { lat: number; lon: number; land: boolean }[] = [];
    const N = 7000;
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const lat = (Math.asin(y) * 180) / Math.PI;
      const lon = ((i * 137.508) % 360) - 180;
      const land = isLand(lat, lon);
      if (land || i % 3 === 0) dots.push({ lat, lon, land });
    }

    // Pre-rendered round dot sprite: crisp circles at any screen density.
    const sprite = document.createElement("canvas");
    const SP = 32;
    sprite.width = sprite.height = SP;
    const sctx = sprite.getContext("2d")!;
    sctx.fillStyle = "#f2efe6";
    sctx.beginPath();
    sctx.arc(SP / 2, SP / 2, SP / 2 - 1, 0, Math.PI * 2);
    sctx.fill();

    type Arc = { a: number; b: number; t: number; speed: number };
    const arcs: Arc[] = [];
    const spawn = () => {
      const a = Math.floor(Math.random() * HUBS.length);
      let b = Math.floor(Math.random() * HUBS.length);
      if (b === a) b = (b + 1) % HUBS.length;
      arcs.push({ a, b, t: 0, speed: 0.004 + Math.random() * 0.004 });
    };
    for (let i = 0; i < 7; i++) {
      spawn();
      arcs[i].t = Math.random();
    }

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetTilt = -18 + (e.clientY / window.innerHeight - 0.5) * -14;
    };
    window.addEventListener("pointermove", onMove);

    const toRad = Math.PI / 180;
    const project = (lat: number, lon: number, R: number, cx: number, cy: number) => {
      const la = lat * toRad;
      const lo = (lon + rot) * toRad;
      const x = Math.cos(la) * Math.sin(lo);
      const y = Math.sin(la);
      const z = Math.cos(la) * Math.cos(lo);
      // tilt around x axis
      const t = tilt * toRad;
      const y2 = y * Math.cos(t) - z * Math.sin(t);
      const z2 = y * Math.sin(t) + z * Math.cos(t);
      return { x: cx + x * R, y: cy - y2 * R, z: z2 };
    };

    const slerp = (A: [number, number], B: [number, number], t: number): [number, number] => {
      const [la1, lo1] = [A[0] * toRad, A[1] * toRad];
      const [la2, lo2] = [B[0] * toRad, B[1] * toRad];
      const v1 = [Math.cos(la1) * Math.cos(lo1), Math.cos(la1) * Math.sin(lo1), Math.sin(la1)];
      const v2 = [Math.cos(la2) * Math.cos(lo2), Math.cos(la2) * Math.sin(lo2), Math.sin(la2)];
      const dot = Math.min(1, Math.max(-1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]));
      const om = Math.acos(dot) || 1e-6;
      const s1 = Math.sin((1 - t) * om) / Math.sin(om);
      const s2 = Math.sin(t * om) / Math.sin(om);
      const v = [s1 * v1[0] + s2 * v2[0], s1 * v1[1] + s2 * v2[1], s1 * v1[2] + s2 * v2[2]];
      return [Math.asin(v[2]) / toRad, Math.atan2(v[1], v[0]) / toRad];
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      rot += reduce ? 0 : 0.06 + pointerX * 0.05;
      tilt += (targetTilt - tilt) * 0.04;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.42;
      const cx = w * 0.5;
      const cy = h * 0.5;

      // atmosphere
      const g = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.25);
      g.addColorStop(0, "rgba(198,255,61,0.05)");
      g.addColorStop(1, "rgba(198,255,61,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // outline
      ctx.strokeStyle = "rgba(242,239,230,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // dots
      for (const d of dots) {
        const p = project(d.lat, d.lon, R, cx, cy);
        if (p.z < 0) continue;
        const r = d.land ? 0.9 + p.z * 0.75 : 0.7 + p.z * 0.35;
        ctx.globalAlpha = d.land ? 0.18 + p.z * 0.7 : 0.05 + p.z * 0.12;
        ctx.drawImage(sprite, p.x - r, p.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      // arcs
      for (let i = arcs.length - 1; i >= 0; i--) {
        const arc = arcs[i];
        arc.t += reduce ? 0 : arc.speed;
        const A = HUBS[arc.a];
        const B = HUBS[arc.b];
        const head = Math.min(arc.t, 1);
        const tail = Math.max(0, arc.t - 0.45);
        ctx.beginPath();
        let started = false;
        const steps = 48;
        for (let s = 0; s <= steps; s++) {
          const tt = tail + ((head - tail) * s) / steps;
          const [la, lo] = slerp(A, B, tt);
          const lift = 1 + Math.sin(tt * Math.PI) * 0.18;
          const p = project(la, lo, R * lift, cx, cy);
          if (p.z < -0.15) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else ctx.lineTo(p.x, p.y);
        }
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, "rgba(198,255,61,0.9)");
        grad.addColorStop(1, "rgba(198,255,61,0.5)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.lineCap = "round";
        ctx.stroke();

        // head
        if (arc.t <= 1) {
          const [la, lo] = slerp(A, B, head);
          const p = project(la, lo, R * (1 + Math.sin(head * Math.PI) * 0.18), cx, cy);
          if (p.z > -0.15) {
            ctx.fillStyle = "#c6ff3d";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (arc.t > 1.45) {
          arcs.splice(i, 1);
          spawn();
        }
      }

      // hubs
      const time = performance.now() / 1000;
      HUBS.forEach(([la, lo], i) => {
        const p = project(la, lo, R, cx, cy);
        if (p.z < 0.05) return;
        const pulse = (time * 0.6 + i * 0.37) % 1;
        ctx.strokeStyle = `rgba(198,255,61,${(1 - pulse) * 0.6 * p.z})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + pulse * 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(242,239,230,${0.9 * p.z})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    // pause when off-screen
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(draw);
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}

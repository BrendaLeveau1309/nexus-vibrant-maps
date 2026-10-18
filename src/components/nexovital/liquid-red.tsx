import { useEffect, useRef } from "react";

type Blob = { x: number; y: number; r: number; vx: number; vy: number; a: number };

/** Animated crimson fluid cells reacting to the pointer (Canvas 2D). */
export function LiquidRed() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let w = 0, h = 0, raf = 0;
    const mouse = { x: -9999, y: -9999 };
    const blobs: Blob[] = [];
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    for (let i = 0; i < 26; i++) blobs.push({ x: Math.random() * w, y: Math.random() * h, r: 30 + Math.random() * 90, vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2, a: 0.12 + Math.random() * 0.25 });
    const phases = blobs.map(() => Math.random() * Math.PI * 2);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let t = 0;
    const tick = () => {
      t += 0.016;
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#7a0614"); g.addColorStop(0.5, "#b3101f"); g.addColorStop(1, "#5c030e");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      blobs.forEach((b, i) => {
        const p = phases[i] ?? 0;
        const dx = b.x - mouse.x, dy = b.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 180 && d > 0) { b.vx += (dx / d) * 0.35; b.vy += (dy / d) * 0.35; }
        // autonomous swirling drift
        b.vx += Math.cos(t * 0.6 + p) * 0.02; b.vy += Math.sin(t * 0.5 + p) * 0.02;
        b.vx *= 0.99; b.vy *= 0.99;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp < 0.35) { b.vx += (b.vx / (sp || 1)) * 0.05 || 0.05; b.vy += (b.vy / (sp || 1)) * 0.05; }
        if (sp > 3) { b.vx *= 0.9; b.vy *= 0.9; }
        b.x += b.vx; b.y += b.vy;
        if (b.x < -b.r) b.x = w + b.r; if (b.x > w + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = h + b.r; if (b.y > h + b.r) b.y = -b.r;
        const r = b.r * (1 + Math.sin(t * 1.2 + p) * 0.08);
        const rg = ctx.createRadialGradient(b.x - r * 0.3, b.y - r * 0.3, r * 0.1, b.x, b.y, r);
        rg.addColorStop(0, `rgba(255,120,130,${b.a})`); rg.addColorStop(0.7, `rgba(220,20,45,${b.a * 0.7})`); rg.addColorStop(1, "rgba(120,0,20,0)");
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
      });
      if (!reduce) raf = requestAnimationFrame(tick);
    };
    tick();
    const move = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const leave = () => { mouse.x = mouse.y = -9999; };
    canvas.parentElement?.addEventListener("pointermove", move);
    canvas.parentElement?.addEventListener("pointerleave", leave);
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); canvas.parentElement?.removeEventListener("pointermove", move); canvas.parentElement?.removeEventListener("pointerleave", leave); };
  }, []);
  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}

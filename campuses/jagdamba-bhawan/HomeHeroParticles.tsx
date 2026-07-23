'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
  tw: number;
  tws: number;
  soft: boolean;
};

/** Soft cyan dust motes — visible but light (canvas, pauses off-screen). */
const COUNT_DESKTOP = 68;
const COUNT_MOBILE = 38;

export function HomeHeroParticles() {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const host = canvas.parentElement;
    if (!host) return;

    let particles: Particle[] = [];
    let raf = 0;
    let running = true;
    let visible = true;
    let w = 0;
    let h = 0;

    const count = () =>
      window.matchMedia('(max-width: 640px)').matches ? COUNT_MOBILE : COUNT_DESKTOP;

    const make = (): Particle => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() < 0.18 ? 2.2 + Math.random() * 2.8 : 1.1 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.28,
      vy: -0.12 - Math.random() * 0.35,
      a: 0.35 + Math.random() * 0.45,
      tw: Math.random() * Math.PI * 2,
      tws: 0.012 + Math.random() * 0.02,
      soft: Math.random() > 0.35,
    });

    const seed = () => {
      particles = Array.from({ length: count() }, make);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0 || particles.length !== count()) seed();
    };

    const drawMote = (p: Particle, alpha: number) => {
      if (p.soft) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.4);
        g.addColorStop(0, `rgba(200, 236, 246, ${alpha})`);
        g.addColorStop(0.45, `rgba(124, 190, 218, ${alpha * 0.55})`);
        g.addColorStop(1, `rgba(112, 188, 211, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 224, 240, ${alpha})`;
        ctx.fill();
      }
    };

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx + Math.sin(p.tw) * 0.08;
        p.y += p.vy;
        p.tw += p.tws;

        if (p.y < -12) {
          p.y = h + 8;
          p.x = Math.random() * w;
        }
        if (p.x < -12) p.x = w + 8;
        if (p.x > w + 12) p.x = -8;

        const alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw));
        drawMote(p, alpha);
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
      },
      { threshold: 0.05 }
    );
    io.observe(host);

    const onResize = () => resize();
    resize();
    window.addEventListener('resize', onResize, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      io.disconnect();
    };
  }, [reduce]);

  if (reduce) return null;

  return <canvas ref={canvasRef} className="jb-hero-particles" aria-hidden />;
}

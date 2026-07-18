'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function BackgroundBeams({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const beams = Array.from({ length: 8 }, (_, i) => ({
      x: (i + 1) * 12,
      speed: 0.15 + i * 0.04,
      opacity: 0.08 + (i % 3) * 0.03,
      w: 1 + (i % 2),
    }));

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      t += 0.008;
      for (const b of beams) {
        const x = ((b.x + t * b.speed * 40) % 140) - 20;
        const g = ctx.createLinearGradient(0, 0, width, height);
        g.addColorStop(0, `rgba(99,102,241,0)`);
        g.addColorStop(0.5, `rgba(129,140,248,${b.opacity})`);
        g.addColorStop(1, `rgba(99,102,241,0)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = b.w;
        ctx.beginPath();
        ctx.moveTo((x / 100) * width, 0);
        ctx.lineTo((x / 100) * width + width * 0.25, height);
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full opacity-70',
        className,
      )}
      aria-hidden
    />
  );
}

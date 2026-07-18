'use client';

import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';

export function SparklesCore({
  className,
  particleDensity = 40,
  particleColor = '#818cf8',
}: {
  className?: string;
  particleDensity?: number;
  particleColor?: string;
}) {
  const id = useId();
  const [particles, setParticles] = useState<
    Array<{ x: number; y: number; r: number; o: number; d: number }>
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: particleDensity }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 1.5 + 0.4,
        o: Math.random() * 0.6 + 0.2,
        d: Math.random() * 3 + 2,
      })),
    );
  }, [particleDensity]);

  return (
    <div className={cn('absolute inset-0', className)} aria-hidden>
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={`g-${id}`}>
            <stop offset="0%" stopColor={particleColor} stopOpacity="1" />
            <stop offset="100%" stopColor={particleColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        {particles.map((p, i) => (
          <circle
            key={i}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.r}
            fill={`url(#g-${id})`}
            opacity={p.o}
            className="animate-pulse"
            style={{ animationDuration: `${p.d}s` }}
          />
        ))}
      </svg>
    </div>
  );
}

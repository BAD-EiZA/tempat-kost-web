'use client';

import { useId } from 'react';
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
  const particles = Array.from({ length: particleDensity }, (_, index) => ({
    x: (index * 47 + 11) % 100,
    y: (index * 71 + 23) % 100,
    r: ((index * 13) % 15) / 10 + 0.4,
    o: ((index * 7) % 6) / 10 + 0.2,
    d: (index * 17) % 3 + 2,
  }));

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

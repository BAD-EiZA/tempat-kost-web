'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function Meteors({
  number = 20,
  className,
}: {
  number?: number;
  className?: string;
}) {
  const [styles, setStyles] = useState<
    Array<{ top: string; left: string; delay: string; duration: string }>
  >([]);

  useEffect(() => {
    setStyles(
      Array.from({ length: number }, () => ({
        top: '-5%',
        left: `${Math.floor(Math.random() * 100)}%`,
        delay: `${Math.random() * 1.5}s`,
        duration: `${Math.floor(Math.random() * 8 + 2)}s`,
      })),
    );
  }, [number]);

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {styles.map((s, idx) => (
        <span
          key={idx}
          className="animate-meteor-effect absolute h-0.5 w-0.5 rotate-[215deg] rounded-full bg-indigo-400 shadow-[0_0_0_1px_#ffffff10]"
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        >
          <span className="absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-indigo-400 to-transparent" />
        </span>
      ))}
    </div>
  );
}

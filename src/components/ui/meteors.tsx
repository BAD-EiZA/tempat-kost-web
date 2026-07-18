'use client';

import { cn } from '@/lib/utils';

export function Meteors({
  number = 20,
  className,
}: {
  number?: number;
  className?: string;
}) {
  const styles = Array.from({ length: number }, (_, index) => ({
    top: '-5%',
    left: `${(index * 47 + 13) % 100}%`,
    delay: `${((index * 37) % 15) / 10}s`,
    duration: `${(index * 29) % 8 + 2}s`,
  }));

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

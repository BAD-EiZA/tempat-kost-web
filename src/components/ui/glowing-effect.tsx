'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function GlowingEffect({
  children,
  className,
  glowClassName,
}: {
  children: ReactNode;
  className?: string;
  glowClassName?: string;
}) {
  return (
    <div className={cn('group relative rounded-2xl p-px', className)}>
      <div
        className={cn(
          'absolute -inset-px rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-0 blur transition duration-500 group-hover:opacity-70',
          glowClassName,
        )}
      />
      <div className="relative rounded-2xl bg-white dark:bg-zinc-950">
        {children}
      </div>
    </div>
  );
}

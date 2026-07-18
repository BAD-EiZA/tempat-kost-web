'use client';

import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function ShimmerButton({
  children,
  className,
  shimmerColor = '#ffffff',
  background = 'rgba(24,24,27,1)',
  ...props
}: {
  children: ReactNode;
  className?: string;
  shimmerColor?: string;
  background?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      style={
        {
          '--shimmer-color': shimmerColor,
          '--bg': background,
        } as React.CSSProperties
      }
      className={cn(
        'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-white whitespace-nowrap [background:var(--bg)]',
        'transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px',
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="animate-shimmer absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] opacity-20" />
      </div>
      <span className="relative z-10">{children}</span>
    </button>
  );
}

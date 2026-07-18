import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/** Ops card — Aceternity-styled shell for dashboard forms/lists */
export function AceCard({
  children,
  className,
  title,
  description,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.03),0_8px_24px_-12px_rgba(0,0,0,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950/80',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'mx-auto grid max-w-6xl grid-cols-1 gap-4 md:auto-rows-[16rem] md:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | ReactNode;
  description?: string | ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition duration-200 hover:shadow-xl dark:border-white/[0.1] dark:bg-zinc-950',
        className,
      )}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-1">
        {icon}
        <div className="mt-2 mb-1 font-sans font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </div>
        <div className="font-sans text-xs font-normal text-zinc-600 dark:text-zinc-400">
          {description}
        </div>
      </div>
    </div>
  );
}

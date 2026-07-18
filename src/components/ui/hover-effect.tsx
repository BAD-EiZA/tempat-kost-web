'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function HoverEffect({
  items,
  className,
}: {
  items: Array<{
    title: string;
    description: string;
    link?: string;
    icon?: ReactNode;
  }>;
  className?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 py-6 md:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          key={item.title + idx}
          href={item.link ?? '#'}
          className="group relative block h-full w-full p-2"
          onMouseEnter={() => setHovered(idx)}
          onMouseLeave={() => setHovered(null)}
        >
          <AnimatePresence>
            {hovered === idx && (
              <motion.span
                className="absolute inset-0 block h-full w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800/80"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.1 },
                }}
              />
            )}
          </AnimatePresence>
          <Card>
            {item.icon}
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </Card>
        </a>
      ))}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative z-20 h-full w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 group-hover:border-zinc-300 dark:border-white/[0.15] dark:bg-zinc-950',
        className,
      )}
    >
      <div className="relative z-50">
        <div className="p-1">{children}</div>
      </div>
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <h4
      className={cn(
        'mt-2 font-semibold tracking-wide text-zinc-900 dark:text-zinc-100',
        className,
      )}
    >
      {children}
    </h4>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        'mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400',
        className,
      )}
    >
      {children}
    </p>
  );
}

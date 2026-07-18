'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function LampContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative z-0 flex min-h-[28rem] w-full flex-col items-center justify-center overflow-hidden rounded-md bg-zinc-950',
        className,
      )}
    >
      <div className="relative isolate z-0 flex w-full flex-1 scale-y-125 items-center justify-center">
        <motion.div
          initial={{ opacity: 0.4, width: '12rem' }}
          whileInView={{ opacity: 1, width: '28rem' }}
          transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-48 w-[28rem] overflow-visible bg-gradient-conic from-indigo-500 via-transparent to-transparent [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute bottom-0 left-0 z-20 h-32 w-full bg-zinc-950 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute bottom-0 left-0 z-20 h-full w-32 bg-zinc-950 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.4, width: '12rem' }}
          whileInView={{ opacity: 1, width: '28rem' }}
          transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-48 w-[28rem] bg-gradient-conic from-transparent via-transparent to-indigo-500 [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute bottom-0 right-0 z-20 h-full w-32 bg-zinc-950 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute bottom-0 right-0 z-20 h-32 w-full bg-zinc-950 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        <div className="absolute top-1/2 h-40 w-full translate-y-10 scale-x-150 bg-zinc-950 blur-2xl" />
        <div className="absolute top-1/2 z-50 h-40 w-full bg-transparent opacity-10 backdrop-blur-md" />
        <div className="absolute inset-auto z-50 h-28 w-[24rem] -translate-y-1/2 rounded-full bg-indigo-500 opacity-50 blur-3xl" />
        <motion.div
          initial={{ width: '6rem' }}
          whileInView={{ width: '14rem' }}
          transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-auto z-30 h-28 w-56 -translate-y-[5rem] rounded-full bg-indigo-400 blur-2xl"
        />
        <motion.div
          initial={{ width: '12rem' }}
          whileInView={{ width: '28rem' }}
          transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-auto z-50 h-0.5 w-[28rem] -translate-y-[6rem] bg-indigo-400"
        />
        <div className="absolute inset-auto z-40 h-36 w-full -translate-y-[10.5rem] bg-zinc-950" />
      </div>
      <div className="relative z-50 flex -translate-y-40 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
}

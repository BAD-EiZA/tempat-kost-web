'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function FloatingNav({
  navItems,
  className,
  rightSlot,
}: {
  navItems: Array<{ name: string; link: string; icon?: ReactNode }>;
  className?: string;
  rightSlot?: ReactNode;
}) {
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) setVisible(true);
      else if (y > lastY) setVisible(false);
      else setVisible(true);
      setLastY(y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastY]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 1, y: -100 }}
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'fixed inset-x-0 top-4 z-[5000] mx-auto flex max-w-fit items-center justify-center space-x-3 rounded-full border border-white/20 bg-white/80 px-4 py-2 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] backdrop-blur-md dark:border-white/[0.1] dark:bg-zinc-950/80',
          className,
        )}
      >
        {navItems.map((item) => (
          <a
            key={item.link}
            href={item.link}
            className="relative flex items-center space-x-1 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-200"
          >
            {item.icon}
            <span className="hidden sm:block">{item.name}</span>
          </a>
        ))}
        {rightSlot}
      </motion.div>
    </AnimatePresence>
  );
}

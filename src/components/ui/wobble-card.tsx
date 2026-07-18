'use client';

import { motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function WobbleCard({
  children,
  containerClassName,
  className,
}: {
  children: ReactNode;
  containerClassName?: string;
  className?: string;
}) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  return (
    <motion.section
      onMouseMove={(e) => {
        const { clientX, clientY } = e;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (clientX - (rect.left + rect.width / 2)) / 25;
        const y = (clientY - (rect.top + rect.height / 2)) / 25;
        setMouse({ x, y });
      }}
      onMouseLeave={() => setMouse({ x: 0, y: 0 })}
      style={{
        transform: `perspective(800px) rotateY(${mouse.x}deg) rotateX(${-mouse.y}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
      className={cn(
        'relative mx-auto h-full w-full overflow-hidden rounded-2xl bg-indigo-800',
        containerClassName,
      )}
    >
      <div
        className="relative h-full [background-image:radial-gradient(88%_100%_at_top,rgba(255,255,255,0.5),rgba(255,255,255,0))] sm:mx-0 sm:rounded-2xl"
        style={{
          boxShadow:
            '0 10px 32px rgba(34,42,53,0.12), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.05), 0 4px 6px rgba(34,42,53,0.08), 0 24px 68px rgba(47,48,55,0.05), 0 2px 3px rgba(0,0,0,0.05)',
        }}
      >
        <motion.div
          style={{
            transform: `translateX(${mouse.x * 2}px) translateY(${mouse.y * 2}px)`,
          }}
          className={cn('h-full px-4 py-6 sm:px-8', className)}
        >
          {children}
        </motion.div>
      </div>
    </motion.section>
  );
}

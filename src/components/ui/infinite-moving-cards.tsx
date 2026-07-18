'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function InfiniteMovingCards({
  items,
  direction = 'left',
  speed = 'fast',
  pauseOnHover = true,
  className,
}: {
  items: Array<{ quote: string; name: string; title: string }>;
  direction?: 'left' | 'right';
  speed?: 'fast' | 'normal' | 'slow';
  pauseOnHover?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return;
    const scroller = scrollerRef.current;
    const children = Array.from(scroller.children);
    children.forEach((el) => {
      const clone = el.cloneNode(true);
      scroller.appendChild(clone);
    });
    containerRef.current.style.setProperty(
      '--animation-direction',
      direction === 'left' ? 'forwards' : 'reverse',
    );
    const dur =
      speed === 'fast' ? '20s' : speed === 'normal' ? '40s' : '80s';
    containerRef.current.style.setProperty('--animation-duration', dur);
    setStart(true);
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'scroller relative z-20 max-w-6xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]',
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          'flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4',
          start && 'animate-scroll',
          pauseOnHover && 'hover:[animation-play-state:paused]',
        )}
      >
        {items.map((item, idx) => (
          <li
            key={item.name + idx}
            className="relative w-[320px] max-w-full shrink-0 rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm md:w-[380px] dark:border-zinc-700 dark:bg-zinc-900"
          >
            <blockquote>
              <span className="relative z-20 text-sm leading-relaxed font-normal text-zinc-700 dark:text-zinc-100">
                {item.quote}
              </span>
              <div className="relative z-20 mt-4 flex flex-row items-center">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {item.name}
                  </span>
                  <span className="text-xs text-zinc-500">{item.title}</span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
}

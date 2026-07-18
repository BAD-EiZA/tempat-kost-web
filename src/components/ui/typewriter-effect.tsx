'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function TypewriterEffectSmooth({
  words,
  className,
  cursorClassName,
}: {
  words: Array<{ text: string; className?: string }>;
  className?: string;
  cursorClassName?: string;
}) {
  const wordsArray = words.map((w) => ({
    ...w,
    text: w.text.split(''),
  }));

  const renderWords = () => (
    <div>
      {wordsArray.map((word, idx) => (
        <div key={`word-${idx}`} className="inline-block">
          {word.text.map((char, i) => (
            <span
              key={`char-${i}`}
              className={cn('text-zinc-900 dark:text-white', word.className)}
            >
              {char}
            </span>
          ))}
          &nbsp;
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn('my-4 flex space-x-1', className)}>
      <motion.div
        className="overflow-hidden"
        initial={{ width: '0%' }}
        whileInView={{ width: 'fit-content' }}
        transition={{ duration: 1.6, ease: 'linear', delay: 0.3 }}
      >
        <div
          className="text-xl font-bold whitespace-nowrap sm:text-3xl md:text-4xl lg:text-5xl"
          style={{ whiteSpace: 'nowrap' }}
        >
          {renderWords()}
        </div>
      </motion.div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className={cn(
          'block h-6 w-[3px] rounded-sm bg-indigo-500 sm:h-8 md:h-10 lg:h-12',
          cursorClassName,
        )}
      />
    </div>
  );
}

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-10 text-center',
        className,
      )}
    >
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      {body ? (
        <div className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">{body}</div>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

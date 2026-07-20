'use client';

import { useFormStatus } from 'react-dom';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: string;
};

export function PendingSubmitButton({
  children,
  disabled,
  pendingLabel = 'Memproses...',
  className,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      className={cn('tk-btn', className)}
      {...props}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

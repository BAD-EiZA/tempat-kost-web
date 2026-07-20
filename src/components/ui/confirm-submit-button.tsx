'use client';

import { useId, useRef } from 'react';
import { cn } from '@/lib/utils';
import { PendingSubmitButton } from './pending-submit-button';

type ConfirmSubmitButtonProps = {
  children: string;
  title: string;
  description: string;
  className?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  danger?: boolean;
};

export function ConfirmSubmitButton({
  children,
  title,
  description,
  className,
  confirmLabel = 'Konfirmasi',
  pendingLabel,
  danger = false,
}: ConfirmSubmitButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <button
        type="button"
        className={cn(danger ? 'tk-btn-danger' : 'tk-btn-secondary', className)}
        onClick={() => dialogRef.current?.showModal()}
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        className="tk-dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-zinc-600">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="tk-btn-secondary"
            onClick={() => dialogRef.current?.close()}
          >
            Batal
          </button>
          <PendingSubmitButton
            className={danger ? 'tk-btn-danger' : 'tk-btn'}
            pendingLabel={pendingLabel}
          >
            {confirmLabel}
          </PendingSubmitButton>
        </div>
      </dialog>
    </>
  );
}

'use client';

import { useId, useRef } from 'react';
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
      <button type="button" className={className} onClick={() => dialogRef.current?.showModal()}>
        {children}
      </button>
      <dialog ref={dialogRef} className="tk-dialog" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
        <p id={descriptionId} className="mt-2 text-sm text-zinc-600">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm" onClick={() => dialogRef.current?.close()}>
            Batal
          </button>
          <PendingSubmitButton
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${danger ? 'bg-danger' : 'bg-zinc-900'}`}
            pendingLabel={pendingLabel}
          >
            {confirmLabel}
          </PendingSubmitButton>
        </div>
      </dialog>
    </>
  );
}

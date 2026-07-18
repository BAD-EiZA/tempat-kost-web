import type { ReactNode } from 'react';

type AlertProps = {
  children: ReactNode;
  className?: string;
  variant?: 'error' | 'success' | 'warning' | 'info';
};

export function Alert({ children, className = '', variant = 'info' }: AlertProps) {
  const isError = variant === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`tk-alert ${className}`}
      data-variant={variant}
    >
      {children}
    </div>
  );
}

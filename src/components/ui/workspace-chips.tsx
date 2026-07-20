import Link from 'next/link';
import { cn } from '@/lib/utils';

export type WorkspaceChipItem = {
  id: string;
  name: string;
};

export function WorkspaceChips({
  workspaces,
  workspaceId,
  hrefFor,
  className,
}: {
  workspaces: ReadonlyArray<WorkspaceChipItem>;
  workspaceId: string;
  hrefFor: (workspaceId: string) => string;
  className?: string;
}) {
  if (workspaces.length === 0) return null;

  return (
    <div className={cn('mt-3 flex flex-wrap gap-2', className)}>
      {workspaces.map((ws) => {
        const active = ws.id === workspaceId;
        return (
          <Link
            key={ws.id}
            href={hrefFor(ws.id)}
            className={cn('tk-chip', active && 'tk-chip-active')}
            data-active={active ? 'true' : undefined}
            aria-current={active ? 'page' : undefined}
          >
            {ws.name}
          </Link>
        );
      })}
    </div>
  );
}

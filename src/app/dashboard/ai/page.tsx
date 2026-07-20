import { requireAuth } from '@/lib/auth';
import { listRooms, listWorkspaces } from '@/lib/api';
import { AiActions } from './ai-actions';
import { WorkspaceChips, PageHeader } from '@/components/ui';

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let workspaceId = qWs ?? '';
  let rooms: Awaited<ReturnType<typeof listRooms>> = [];
  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) rooms = await listRooms(workspaceId);
  } catch {
    /* empty */
  }

  return (
    <>
      <PageHeader
        title="AI Assistant"
        description="Saran AI dengan human review. Model: Gemini Flash."
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/ai?workspaceId=${id}`}
        />
      )}
      {workspaceId ? (
        <AiActions
          workspaceId={workspaceId}
          rooms={rooms.map((room) => ({
            id: room.id,
            name: `${room.property?.name ?? 'Properti'} · ${room.name}`,
          }))}
        />
      ) : null}
    </>
  );
}

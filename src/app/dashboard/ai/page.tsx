import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { listRooms, listWorkspaces } from '@/lib/api';
import { AiActions } from './ai-actions';

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
      <h1 className="text-2xl font-semibold">AI Assistant</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Hasil ditampilkan di bawah · human review · Gemini Flash
      </p>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/ai?workspaceId=${ws.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                ws.id === workspaceId ? 'bg-zinc-900 text-white' : 'bg-zinc-100'
              }`}
            >
              {ws.name}
            </Link>
          ))}
        </div>
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

const KEY = 'tk_offline_drafts_v1';

export type OfflineDraft = {
  id: string;
  kind: 'meter' | 'inspection' | 'maintenance';
  payload: Record<string, unknown>;
  createdAt: string;
};

export function listDrafts(): OfflineDraft[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as OfflineDraft[];
  } catch {
    return [];
  }
}

export function saveDraft(
  kind: OfflineDraft['kind'],
  payload: Record<string, unknown>,
) {
  const drafts = listDrafts();
  const d: OfflineDraft = {
    id: crypto.randomUUID(),
    kind,
    payload,
    createdAt: new Date().toISOString(),
  };
  drafts.unshift(d);
  localStorage.setItem(KEY, JSON.stringify(drafts.slice(0, 100)));
  return d;
}

export function removeDraft(id: string) {
  const drafts = listDrafts().filter((d) => d.id !== id);
  localStorage.setItem(KEY, JSON.stringify(drafts));
}

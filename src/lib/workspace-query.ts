import { normalizeHref } from '@/lib/nav-taxonomy';

/** Append workspaceId when present; preserves existing query on href. */
export function withWorkspace(
  href: string,
  workspaceId: string | null | undefined,
): string {
  if (!workspaceId) return href;
  const [pathAndQuery, hash = ''] = href.split('#');
  const [path, query = ''] = pathAndQuery.split('?');
  const params = new URLSearchParams(query);
  if (!params.has('workspaceId')) {
    params.set('workspaceId', workspaceId);
  }
  const q = params.toString();
  const base = normalizeHref(path);
  return `${base}${q ? `?${q}` : ''}${hash ? `#${hash}` : ''}`;
}

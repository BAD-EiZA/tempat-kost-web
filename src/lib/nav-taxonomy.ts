export type MenuItem = { href: string; label: string };

export type NavSection = {
  id: string;
  label: string;
  items: MenuItem[];
};

export type GroupedMenu = {
  primary: MenuItem[];
  sections: NavSection[];
};

/** Ordered primary rail; only shown if present in me.menu */
export const PRIMARY_HREFS = [
  '/dashboard',
  '/dashboard/properties',
  '/dashboard/rooms',
  '/dashboard/tenants',
  '/dashboard/leases',
  '/dashboard/billing',
  '/dashboard/payments',
] as const;

type GroupDef = {
  id: string;
  label: string;
  /** Longer / more specific prefixes first within group matching */
  prefixes: string[];
};

const GROUPS: GroupDef[] = [
  {
    id: 'finance',
    label: 'Keuangan',
    prefixes: [
      '/dashboard/billing',
      '/dashboard/payments',
      '/dashboard/expenses',
      '/dashboard/deposits',
      '/dashboard/utilities',
      '/dashboard/reports',
    ],
  },
  {
    id: 'ops',
    label: 'Operasional',
    prefixes: [
      '/dashboard/maintenance',
      '/dashboard/meters',
      '/dashboard/inventory',
      '/dashboard/inspections',
      '/dashboard/ops/offline',
      '/dashboard/ops',
      '/dashboard/import',
    ],
  },
  {
    id: 'growth',
    label: 'Pertumbuhan',
    prefixes: [
      '/dashboard/crm/bookings',
      '/dashboard/crm',
      '/dashboard/surveys',
      '/dashboard/publish',
    ],
  },
  {
    id: 'ai',
    label: 'AI & data',
    prefixes: [
      '/dashboard/ai',
      '/dashboard/search',
      '/dashboard/insights',
      '/dashboard/notifications',
    ],
  },
  {
    id: 'setup',
    label: 'Pengaturan',
    prefixes: [
      '/dashboard/structure',
      '/dashboard/team',
      '/dashboard/roles',
      '/dashboard/settings',
      '/dashboard/approvals',
      '/dashboard/flags',
      '/dashboard/audit-log',
    ],
  },
];

const PRIMARY_SET = new Set<string>(PRIMARY_HREFS);

export function normalizeHref(href: string): string {
  try {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return new URL(href).pathname.replace(/\/$/, '') || '/';
    }
  } catch {
    /* ignore */
  }
  const path = href.split('?')[0].split('#')[0];
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

function matchPrefix(pathname: string, prefix: string): boolean {
  if (prefix === '/dashboard') return pathname === '/dashboard';
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

export function groupIdForHref(href: string): string {
  const path = normalizeHref(href);
  if (PRIMARY_SET.has(path) || path === '/dashboard') {
    // primary items may also appear only in primary rail
    if (PRIMARY_SET.has(path)) return 'primary';
  }
  for (const g of GROUPS) {
    for (const p of g.prefixes) {
      if (matchPrefix(path, p)) return g.id;
    }
  }
  return 'other';
}

export function groupLabelForHref(href: string): string {
  const id = groupIdForHref(href);
  if (id === 'primary') return 'Utama';
  if (id === 'other') return 'Lainnya';
  return GROUPS.find((g) => g.id === id)?.label ?? 'Lainnya';
}

/** Active nav link: overview exact; others by prefix (longer wins handled by callers). */
export function isNavActive(pathname: string, href: string): boolean {
  const path = normalizeHref(href);
  const current = normalizeHref(pathname);
  if (path === '/dashboard') return current === '/dashboard';
  return current === path || current.startsWith(path + '/');
}

function sortByPrefixOrder(items: MenuItem[], prefixes: string[]): MenuItem[] {
  const rank = (href: string) => {
    const path = normalizeHref(href);
    const i = prefixes.findIndex((p) => matchPrefix(path, p));
    return i === -1 ? 999 : i;
  };
  return [...items].sort((a, b) => {
    const d = rank(a.href) - rank(b.href);
    if (d !== 0) return d;
    return a.label.localeCompare(b.label, 'id');
  });
}

export function groupMenuItems(menu: MenuItem[]): GroupedMenu {
  const byPath = new Map<string, MenuItem>();
  for (const item of menu) {
    const path = normalizeHref(item.href);
    if (!byPath.has(path)) {
      byPath.set(path, { href: path, label: item.label });
    }
  }

  const primary: MenuItem[] = [];
  for (const href of PRIMARY_HREFS) {
    const item = byPath.get(href);
    if (item) {
      primary.push(item);
      byPath.delete(href);
    }
  }

  const sections: NavSection[] = [];
  for (const g of GROUPS) {
    const items: MenuItem[] = [];
    for (const [path, item] of [...byPath.entries()]) {
      if (g.prefixes.some((p) => matchPrefix(path, p))) {
        items.push(item);
        byPath.delete(path);
      }
    }
    if (items.length > 0) {
      sections.push({
        id: g.id,
        label: g.label,
        items: sortByPrefixOrder(items, g.prefixes),
      });
    }
  }

  const leftover = [...byPath.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'id'),
  );
  if (leftover.length > 0) {
    sections.push({ id: 'other', label: 'Lainnya', items: leftover });
  }

  return { primary, sections };
}

export function paletteItemsFromMenu(
  menu: MenuItem[],
): Array<MenuItem & { group: string }> {
  return menu.map((item) => ({
    href: normalizeHref(item.href),
    label: item.label,
    group: groupLabelForHref(item.href),
  }));
}

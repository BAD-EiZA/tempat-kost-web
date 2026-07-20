export function formatIdr(n: number | string) {
  const v = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(v)) return String(n);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);
}

export function formatDateId(value: string | Date | null | undefined) {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) {
    return String(value).slice(0, 10);
  }
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

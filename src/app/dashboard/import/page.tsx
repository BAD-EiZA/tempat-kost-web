'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmptyState, PageHeader } from '@/components/ui';

type Kind = 'rooms' | 'tenants' | 'leases' | 'payments' | 'expenses';

type Preview = {
  jobId: string;
  mapping: Record<string, string | null>;
  preview: string[][];
  targetFields: string[];
  dryRun?: {
    valid: number;
    invalid: number;
    sampleErrors: Array<{ row: number; message: string }>;
  };
};

type Property = { id: string; name: string };

const KIND_LABEL: Record<Kind, string> = {
  rooms: 'Kamar',
  tenants: 'Penghuni',
  leases: 'Kontrak',
  payments: 'Pembayaran',
  expenses: 'Pengeluaran',
};

function parseDelimited(text: string): { headers: string[]; rows: string[][] } {
  const raw = text.replace(/^\uFEFF/, '').trim();
  if (!raw) return { headers: [], rows: [] };
  const firstLine = raw.split(/\r?\n/, 1)[0] ?? '';
  const delim =
    (firstLine.match(/;/g) ?? []).length > (firstLine.match(/,/g) ?? []).length
      ? ';'
      : ',';

  function splitLine(line: string) {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = !inQ;
      } else if (ch === delim && !inQ) {
        out.push(cur.trim());
        cur = '';
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  }

  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length);
  const headers = splitLine(lines[0] ?? '');
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

/** Minimal xlsx sheet1 → CSV-like via shared strings (no dependency). */
async function parseXlsx(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Use browser-side unzip via DecompressionStream not available for zip;
  // fall back: instruct CSV. For real xlsx use simple regex extract on shared strings if present.
  // Lightweight approach: if FileReader text fails, try sheetjs-free XML from zip via JSZip-less parse.
  try {
    // Dynamic import only if package exists; otherwise throw to CSV path
    // ponytail: full xlsx via SheetJS when volume justifies; now: TSV from Excel "Save as CSV" + simple table paste
    const text = await file.text();
    if (text.includes(',') || text.includes(';') || text.includes('\t')) {
      return parseDelimited(text.replace(/\t/g, ','));
    }
  } catch {
    /* binary */
  }
  // Binary xlsx: extract sheet1 XML with naive zip local file headers
  const cells = extractXlsxSheetCells(bytes);
  if (cells.length < 1) {
    throw new Error(
      'File xlsx tidak terbaca. Simpan sebagai CSV (UTF-8) lalu unggah ulang.',
    );
  }
  return { headers: cells[0] ?? [], rows: cells.slice(1) };
}

function extractXlsxSheetCells(bytes: Uint8Array): string[][] {
  // Find sharedStrings + sheet1.xml inside zip (local file headers)
  const files = unzipLocal(bytes);
  const sharedXml = files['xl/sharedStrings.xml'] ?? '';
  const sheetXml =
    files['xl/worksheets/sheet1.xml'] ??
    Object.entries(files).find(([k]) => k.includes('worksheets/sheet'))?.[1] ??
    '';
  if (!sheetXml) return [];
  const shared: string[] = [];
  if (sharedXml) {
    const re = /<si[^>]*>([\s\S]*?)<\/si>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sharedXml))) {
      const texts = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) =>
        decodeXml(x[1]),
      );
      shared.push(texts.join(''));
    }
  }
  const rows: string[][] = [];
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(sheetXml))) {
    const rowXml = rm[1];
    const cells: string[] = [];
    const cRe = /<c([^>]*)>([\s\S]*?)<\/c>|<c([^>]*)\/>/g;
    let cm: RegExpExecArray | null;
    let col = 0;
    while ((cm = cRe.exec(rowXml))) {
      const attrs = cm[1] ?? cm[3] ?? '';
      const body = cm[2] ?? '';
      const ref = /r="([A-Z]+)(\d+)"/.exec(attrs);
      if (ref) {
        const idx = colLettersToIndex(ref[1]);
        while (col < idx) {
          cells.push('');
          col++;
        }
      }
      const t = /t="([^"]+)"/.exec(attrs)?.[1];
      let val = '';
      if (t === 's') {
        const v = /<v>(\d+)<\/v>/.exec(body)?.[1];
        val = shared[Number(v)] ?? '';
      } else if (t === 'inlineStr') {
        val = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
          .map((x) => decodeXml(x[1]))
          .join('');
      } else {
        val = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? '';
        val = decodeXml(val);
      }
      cells.push(val);
      col++;
    }
    if (cells.some((c) => c.trim())) rows.push(cells);
  }
  return rows;
}

function colLettersToIndex(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function decodeXml(s: string) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function unzipLocal(bytes: Uint8Array): Record<string, string> {
  const out: Record<string, string> = {};
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let i = 0;
  const td = new TextDecoder('utf-8');
  while (i + 30 < bytes.length) {
    if (view.getUint32(i, true) !== 0x04034b50) break;
    const method = view.getUint16(i + 8, true);
    const compSize = view.getUint32(i + 18, true);
    const nameLen = view.getUint16(i + 26, true);
    const extraLen = view.getUint16(i + 28, true);
    const name = td.decode(bytes.subarray(i + 30, i + 30 + nameLen));
    const dataStart = i + 30 + nameLen + extraLen;
    const data = bytes.subarray(dataStart, dataStart + compSize);
    if (method === 0) {
      out[name] = td.decode(data);
    } else if (method === 8 && typeof DecompressionStream !== 'undefined') {
      // sync inflate not available; skip compressed entries unless store
    }
    i = dataStart + compSize;
  }
  // Fallback: many xlsx use deflate; try inflateSync-like via Response if available
  // If empty, return {}
  if (Object.keys(out).length === 0) {
    // try find uncompressed XML snippets in raw bytes for sharedStrings
    const asText = td.decode(bytes);
    if (asText.includes('sharedStrings') || asText.includes('<worksheet')) {
      /* not useful */
    }
  }
  return out;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ImportInner() {
  const sp = useSearchParams();
  const workspaceId = sp.get('workspaceId') ?? '';
  const [kind, setKind] = useState<Kind>('rooms');
  const [propertyId, setPropertyId] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [errorCsv, setErrorCsv] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState<'preview' | 'commit' | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    let ignore = false;
    void fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: `/v1/properties?workspaceId=${encodeURIComponent(workspaceId)}`,
        method: 'GET',
      }),
    })
      .then((res) => res.json())
      .then((data: unknown) => {
        if (!ignore && Array.isArray(data)) setProperties(data as Property[]);
      });
    return () => {
      ignore = true;
    };
  }, [workspaceId]);

  async function onFile(f: File) {
    setFileName(f.name);
    setPreview(null);
    setConfirmed(false);
    setError(null);
    setErrorCsv(null);
    try {
      const lower = f.name.toLowerCase();
      let parsed: { headers: string[]; rows: string[][] };
      if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
        parsed = await parseXlsx(f);
      } else {
        parsed = parseDelimited(await f.text());
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parse gagal');
      setHeaders([]);
      setRows([]);
    }
  }

  async function doPreview() {
    setError(null);
    setResult(null);
    setErrorCsv(null);
    setConfirmed(false);
    setBusy('preview');
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/v1/imports/preview',
          body: { workspaceId, kind, headers, rows },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Preview gagal');
      const p = data as Preview;
      setPreview(p);
      setMapping({ ...p.mapping });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(null);
    }
  }

  async function doCommit() {
    if (!preview) return;
    setError(null);
    setBusy('commit');
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/v1/imports/commit',
          body: {
            workspaceId,
            jobId: preview.jobId,
            propertyId:
              kind === 'rooms' || kind === 'leases' ? propertyId : undefined,
            mapping,
            headers,
            rows,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Commit gagal');
      setResult(`${data.created} data berhasil diimpor, ${data.errors} gagal.`);
      if (typeof data.errorCsv === 'string' && data.errors > 0) {
        setErrorCsv(data.errorCsv);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(null);
    }
  }

  const step = !headers.length
    ? 1
    : !preview
      ? 2
      : !confirmed
        ? 3
        : 4;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Import data"
        description="Unggah, validasi, petakan kolom, lalu konfirmasi impor."
      />
      {!workspaceId && (
        <EmptyState
          className="mt-4"
          title="Workspace belum dipilih"
          body="Buka halaman ini dari menu workspace atau pilih workspace dulu."
        />
      )}

      <ol className="mt-6 flex flex-wrap gap-2 text-xs">
        {[
          [1, 'Unggah'],
          [2, 'Validasi'],
          [3, 'Pemetaan'],
          [4, 'Konfirmasi'],
        ].map(([n, label]) => (
          <li
            key={String(n)}
            className={
              step >= Number(n)
                ? 'tk-chip tk-chip-active'
                : 'tk-chip'
            }
          >
            {n}. {label}
          </li>
        ))}
      </ol>

      <div className="tk-card mt-4 space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="tk-field">
            <span className="tk-label">Jenis data</span>
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as Kind);
                setPreview(null);
                setConfirmed(false);
              }}
              className="tk-select"
            >
              {Object.entries(KIND_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {(kind === 'rooms' || kind === 'leases') && (
            <label className="tk-field">
              <span className="tk-label">Properti tujuan</span>
              <select
                value={propertyId}
                required
                onChange={(e) => setPropertyId(e.target.value)}
                className="tk-select"
              >
                <option value="">Pilih properti</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <label className="tk-field">
          <span className="tk-label">Berkas sumber</span>
          <span className="text-xs text-zinc-500">
            CSV atau TSV disarankan. XLSX sederhana didukung terbatas.
          </span>
          <input
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
            className="mt-1 text-sm"
          />
        </label>
        {headers.length > 0 && (
          <p className="text-xs text-zinc-500">
            {fileName} · {headers.length} kolom · {rows.length} baris
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void doPreview()}
            disabled={!workspaceId || !rows.length || busy !== null}
            className="tk-btn disabled:opacity-50"
          >
            {busy === 'preview' ? 'Memvalidasi…' : '1. Periksa data'}
          </button>
          <button
            type="button"
            onClick={() => void doCommit()}
            disabled={
              !preview ||
              !confirmed ||
              busy !== null ||
              ((kind === 'rooms' || kind === 'leases') && !propertyId) ||
              (preview.dryRun?.invalid ?? 0) === rows.length
            }
            className="tk-btn-secondary disabled:opacity-50"
          >
            {busy === 'commit' ? 'Mengimpor…' : '2. Impor data'}
          </button>
          {errorCsv && (
            <button
              type="button"
              onClick={() =>
                downloadCsv(`import-errors-${kind}.csv`, errorCsv)
              }
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800"
            >
              Unduh error CSV
            </button>
          )}
        </div>

        {preview?.dryRun && (
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs">
            <p>
              Hasil validasi: <b>{preview.dryRun.valid}</b> valid ·{' '}
              <b>{preview.dryRun.invalid}</b> tidak valid
            </p>
            {preview.dryRun.sampleErrors.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-red-700">
                {preview.dryRun.sampleErrors.map((e) => (
                  <li key={e.row}>
                    Baris {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {preview && (
          <div className="space-y-3 border-t border-zinc-100 pt-4">
            <p className="text-sm font-semibold text-zinc-900">
              Pemetaan kolom
            </p>
            {preview.targetFields.map((field) => (
              <label key={field} className="flex items-center gap-2 text-xs">
                <span className="w-28 font-mono text-zinc-600">{field}</span>
                <select
                  value={mapping[field] ?? ''}
                  onChange={(e) =>
                    setMapping((m) => ({
                      ...m,
                      [field]: e.target.value || null,
                    }))
                  }
                  className="tk-select flex-1 !py-1 !text-xs"
                >
                  <option value="">Jangan impor kolom ini</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <div className="overflow-auto rounded-xl border border-zinc-200">
              <table className="min-w-full text-xs">
                <caption className="sr-only">
                  Pratinjau data yang akan diimpor
                </caption>
                <thead>
                  <tr className="bg-zinc-100">
                    {headers.map((h) => (
                      <th
                        scope="col"
                        key={h}
                        className="px-2 py-1 text-left font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="border-t border-zinc-100">
                      {row.map((c, j) => (
                        <td key={j} className="px-2 py-1">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label
              className="tk-alert flex items-start gap-2 text-sm"
              data-variant="warning"
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Saya sudah memeriksa pemetaan. Impor akan membuat hingga{' '}
                <b>{preview.dryRun?.valid ?? rows.length} data</b> dan tidak
                dapat dibatalkan dari halaman ini.
              </span>
            </label>
          </div>
        )}
        {result && (
          <div className="tk-alert" data-variant="success" role="status">
            {result}
          </div>
        )}
        {error && (
          <div className="tk-alert" data-variant="error" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Memuat…</p>}>
      <ImportInner />
    </Suspense>
  );
}

'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

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
    // Dynamic import only if package exists — otherwise throw to CSV path
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
  // Fallback: many xlsx use deflate — try inflateSync-like via Response if available
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

  async function onFile(f: File) {
    setFileName(f.name);
    setPreview(null);
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
    }
  }

  async function doCommit() {
    if (!preview) return;
    setError(null);
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
      setResult(`Created ${data.created}, errors ${data.errors}`);
      if (typeof data.errorCsv === 'string' && data.errors > 0) {
        setErrorCsv(data.errorCsv);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Import data</h1>
      <p className="mt-1 text-sm text-zinc-600">
        CSV / TSV / xlsx (sederhana) → AI mapping → dry-run → commit. Error CSV
        bisa diunduh.
      </p>
      {!workspaceId && (
        <p className="mt-4 text-sm text-amber-700">
          Buka dari dashboard dengan ?workspaceId=
        </p>
      )}
      <div className="mt-6 space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as Kind);
              setPreview(null);
            }}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="rooms">Rooms</option>
            <option value="tenants">Tenants</option>
            <option value="leases">Leases</option>
            <option value="payments">Payments</option>
            <option value="expenses">Expenses</option>
          </select>
          {(kind === 'rooms' || kind === 'leases') && (
            <input
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="propertyId (wajib)"
              className="min-w-[12rem] flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          )}
        </div>
        <input
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
          className="text-sm"
        />
        {headers.length > 0 && (
          <p className="text-xs text-zinc-500">
            {fileName} · {headers.length} kolom · {rows.length} baris
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void doPreview()}
            disabled={!workspaceId || !rows.length}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Preview + dry-run
          </button>
          <button
            type="button"
            onClick={() => void doCommit()}
            disabled={
              !preview ||
              ((kind === 'rooms' || kind === 'leases') && !propertyId) ||
              (preview.dryRun?.invalid ?? 0) === rows.length
            }
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm disabled:opacity-50"
          >
            Commit import
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
              Dry-run: <b>{preview.dryRun.valid}</b> valid ·{' '}
              <b>{preview.dryRun.invalid}</b> invalid
            </p>
            {preview.dryRun.sampleErrors.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-red-700">
                {preview.dryRun.sampleErrors.map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {preview && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Mapping (bisa diubah)</p>
            {preview.targetFields.map((field) => (
              <label key={field} className="flex items-center gap-2 text-xs">
                <span className="w-28 font-mono">{field}</span>
                <select
                  value={mapping[field] ?? ''}
                  onChange={(e) =>
                    setMapping((m) => ({
                      ...m,
                      [field]: e.target.value || null,
                    }))
                  }
                  className="flex-1 rounded-lg border border-zinc-200 px-2 py-1"
                >
                  <option value="">— skip —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <div className="overflow-auto rounded-xl border">
              <table className="min-w-full text-[10px]">
                <thead>
                  <tr className="bg-zinc-100">
                    {headers.map((h) => (
                      <th key={h} className="px-2 py-1 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="border-t">
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
          </div>
        )}
        {result && <p className="text-sm text-emerald-700">{result}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
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

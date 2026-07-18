import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { DocUpload } from './doc-upload';

const OCR_FIELDS = [
  { key: 'fullName', label: 'Nama' },
  { key: 'nik', label: 'NIK' },
  { key: 'dateOfBirth', label: 'Tgl lahir' },
  { key: 'gender', label: 'JK' },
  { key: 'hometownAddress', label: 'Alamat' },
  { key: 'phone', label: 'Telepon' },
  { key: 'email', label: 'Email' },
] as const;

async function addDoc(formData: FormData) {
  'use server';
  await requireAuth();
  const tenantId = String(formData.get('tenantId') ?? '');
  const fileUrl = String(formData.get('fileUrl') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!tenantId || !fileUrl) return;
  const runOcr = formData.get('runOcr') === 'on';
  const consent = formData.get('consent') === 'on';
  await apiFetch(`/v1/tenants/${tenantId}/documents`, {
    method: 'POST',
    body: JSON.stringify({
      kind: String(formData.get('kind') ?? 'ktp'),
      fileUrl,
      runOcr,
      consent: runOcr ? consent : false,
    }),
  });
  redirect(`/dashboard/tenants/${tenantId}?workspaceId=${workspaceId}`);
}

async function applyOcr(formData: FormData) {
  'use server';
  await requireAuth();
  const documentId = String(formData.get('documentId') ?? '');
  const tenantId = String(formData.get('tenantId') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!documentId) return;
  const fields = OCR_FIELDS.map((f) => f.key).filter(
    (k) => formData.get(`field_${k}`) === 'on',
  );
  await apiFetch(`/v1/tenants/documents/${documentId}/apply-ocr`, {
    method: 'POST',
    body: JSON.stringify({ fields: fields.length ? fields : undefined }),
  });
  redirect(`/dashboard/tenants/${tenantId}?workspaceId=${workspaceId}`);
}

export default async function TenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const { workspaceId = '' } = await searchParams;
  type TenantRow = {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    status: string;
    nik?: string | null;
    gender?: string | null;
    hometownAddress?: string | null;
    dateOfBirth?: string | null;
  };
  type DocRow = {
    id: string;
    kind: string;
    fileUrl: string;
    status: string;
    ocrJson: Record<string, unknown> | null;
    consentAt?: string | null;
    appliedFields?: string[] | null;
  };
  let tenant: TenantRow | null = null;
  let docs: DocRow[] = [];
  let error: string | null = null;

  try {
    tenant = await apiFetch<TenantRow>(`/v1/tenants/${id}`);
    docs = await apiFetch<DocRow[]>(`/v1/tenants/${id}/documents`);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <>
      <Link
        href={`/dashboard/tenants?workspaceId=${workspaceId}`}
        className="text-sm text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900"
      >
        ← Penyewa
      </Link>
      {error && (
        <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50 p-3 text-sm text-amber-900">
          {error}
        </div>
      )}
      {tenant && (
        <>
          <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">
              {tenant.fullName}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              {tenant.status}
              {tenant.nik ? ` · NIK ${tenant.nik}` : ''}
              {tenant.gender ? ` · ${tenant.gender}` : ''}
            </p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-zinc-500">Telepon</dt>
                <dd>{tenant.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Email</dt>
                <dd>{tenant.email ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-zinc-500">Alamat KTP</dt>
                <dd>{tenant.hometownAddress ?? '—'}</dd>
              </div>
            </dl>
          </div>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Dokumen
          </h2>
          <ul className="mt-2 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            {docs.length === 0 ? (
              <li className="p-4 text-sm text-zinc-500">Belum ada dokumen.</li>
            ) : (
              docs.map((d) => {
                const ocr = d.ocrJson ?? {};
                return (
                  <li key={d.id} className="px-4 py-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline decoration-zinc-300 underline-offset-2"
                      >
                        {d.kind}
                      </a>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-600">
                        {d.status}
                      </span>
                      {d.consentAt && (
                        <span className="text-[10px] text-emerald-700">
                          consent ✓
                        </span>
                      )}
                    </div>
                    {d.ocrJson != null && (
                      <div className="mt-3 space-y-2 rounded-xl bg-zinc-50 p-3">
                        <p className="text-xs font-medium text-zinc-700">
                          Hasil OCR (review)
                        </p>
                        <dl className="grid gap-1 text-xs sm:grid-cols-2">
                          {OCR_FIELDS.map((f) => {
                            const v =
                              ocr[f.key] ??
                              (f.key === 'fullName' ? ocr.name : undefined) ??
                              (f.key === 'hometownAddress'
                                ? ocr.address
                                : undefined) ??
                              (f.key === 'dateOfBirth'
                                ? ocr.birthDate
                                : undefined);
                            if (v == null || v === '') return null;
                            return (
                              <div key={f.key}>
                                <dt className="text-zinc-500">{f.label}</dt>
                                <dd className="font-medium">{String(v)}</dd>
                              </div>
                            );
                          })}
                        </dl>
                        {d.status !== 'applied' && (
                          <form action={applyOcr} className="mt-2 space-y-2">
                            <input
                              type="hidden"
                              name="documentId"
                              value={d.id}
                            />
                            <input type="hidden" name="tenantId" value={id} />
                            <input
                              type="hidden"
                              name="workspaceId"
                              value={workspaceId}
                            />
                            <div className="flex flex-wrap gap-2">
                              {OCR_FIELDS.map((f) => (
                                <label
                                  key={f.key}
                                  className="flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-[10px]"
                                >
                                  <input
                                    type="checkbox"
                                    name={`field_${f.key}`}
                                    defaultChecked
                                  />
                                  {f.label}
                                </label>
                              ))}
                            </div>
                            <button
                              type="submit"
                              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                            >
                              Apply terpilih → profil
                            </button>
                          </form>
                        )}
                        {Array.isArray(d.appliedFields) &&
                          d.appliedFields.length > 0 && (
                            <p className="text-[10px] text-zinc-500">
                              Applied: {d.appliedFields.join(', ')}
                            </p>
                          )}
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          <form
            action={addDoc}
            className="mt-6 space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
          >
            <h3 className="font-medium">Upload dokumen + OCR KTP</h3>
            <input type="hidden" name="tenantId" value={id} />
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <select
              name="kind"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="ktp">KTP</option>
              <option value="kk">KK</option>
              <option value="other">Lainnya</option>
            </select>
            <DocUpload workspaceId={workspaceId} />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="runOcr" defaultChecked /> Jalankan
              OCR
            </label>
            <label className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-xs text-amber-950">
              <input type="checkbox" name="consent" className="mt-0.5" />
              <span>
                Consent: penyewa/operator setuju pemrosesan data KTP untuk
                administrasi kos. Wajib dicentang jika OCR diaktifkan (API
                menolak tanpa ini).
              </span>
            </label>
            <button
              type="submit"
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Simpan
            </button>
          </form>
        </>
      )}
    </>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { DocUpload } from './doc-upload';
import { PageHeader, StatusBadge } from '@/components/ui';
import { formatDateId } from '@/lib/format';

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

  const description = tenant
    ? [
        tenant.nik ? `NIK ${tenant.nik}` : null,
        tenant.gender,
        tenant.dateOfBirth ? formatDateId(tenant.dateOfBirth) : null,
      ]
        .filter(Boolean)
        .join(' · ') || 'Profil penyewa'
    : undefined;

  return (
    <>
      <PageHeader
        title={tenant?.fullName ?? 'Detail penyewa'}
        description={description}
        actions={
          <Link
            href={`/dashboard/tenants?workspaceId=${workspaceId}`}
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Kembali
          </Link>
        }
      />
      {tenant ? (
        <div className="mt-2">
          <StatusBadge status={tenant.status} kind="tenant" />
        </div>
      ) : null}

      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}

      {tenant && (
        <>
          <div className="tk-card mt-4 p-6">
            <h2 className="text-sm font-semibold text-zinc-900">Kontak</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-zinc-500">Telepon</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">
                  {tenant.phone ?? '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Email</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">
                  {tenant.email ?? '-'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-zinc-500">Alamat KTP</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">
                  {tenant.hometownAddress ?? '-'}
                </dd>
              </div>
            </dl>
          </div>

          <h2 className="mt-8 text-sm font-semibold text-zinc-900">Dokumen</h2>
          <ul className="tk-list mt-2">
            {docs.length === 0 ? (
              <li className="p-6 text-center text-sm text-zinc-500">
                Belum ada dokumen. Unggah di form bawah.
              </li>
            ) : (
              docs.map((d) => {
                const ocr = d.ocrJson ?? {};
                return (
                  <li key={d.id} className="px-4 py-4 text-sm sm:px-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-emerald-800 underline-offset-2 hover:underline"
                      >
                        {d.kind}
                      </a>
                      <StatusBadge status={d.status} kind="invoice" />
                      {d.consentAt ? (
                        <span className="text-[10px] font-medium text-emerald-800">
                          Consent OK
                        </span>
                      ) : null}
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
                                <dd className="font-medium text-zinc-900">
                                  {String(v)}
                                </dd>
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
                                  className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px]"
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
                            <button type="submit" className="tk-btn-sm">
                              Apply terpilih ke profil
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

          <form action={addDoc} className="tk-card mt-6 space-y-3 p-6">
            <h3 className="text-base font-semibold text-zinc-900">
              Upload dokumen + OCR KTP
            </h3>
            <input type="hidden" name="tenantId" value={id} />
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <label className="tk-field">
              <span className="tk-label">Jenis</span>
              <select name="kind" className="tk-select">
                <option value="ktp">KTP</option>
                <option value="kk">KK</option>
                <option value="other">Lainnya</option>
              </select>
            </label>
            <DocUpload workspaceId={workspaceId} />
            <label className="flex items-center gap-2 text-xs text-zinc-700">
              <input type="checkbox" name="runOcr" defaultChecked /> Jalankan
              OCR
            </label>
            <label className="tk-alert flex items-start gap-2 text-xs" data-variant="warning">
              <input type="checkbox" name="consent" className="mt-0.5" />
              <span>
                Consent: penyewa/operator setuju pemrosesan data KTP untuk
                administrasi kos. Wajib dicentang jika OCR diaktifkan.
              </span>
            </label>
            <button type="submit" className="tk-btn">
              Simpan
            </button>
          </form>
        </>
      )}
    </>
  );
}

/**
 * ContractReview.jsx — Revisión, aprobación y exportación (RF07 / RF08).
 *
 * - Hoja A4 con el documento oficial guardado (editable mientras no esté aprobado).
 * - ASSISTANT solo puede editar y enviar a revisión; ve el aviso de supervisión letrada.
 * - LAWYER / ADMIN pueden aprobar formalmente (PATCH /contracts/:id/approve);
 *   al aprobarse se estampa el sello digital con nombre y matrícula.
 * - Exportación: Imprimir / PDF (@media print) y descarga .doc.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  Printer,
  Pencil,
  Save,
  X,
  AlertTriangle,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'
import api, { getErrorMessage } from '../api/axiosConfig.js'
import { useAuth } from '../context/AuthContext.jsx'
import StatusBadge from '../components/common/StatusBadge.jsx'
import { documentToHtml, downloadAsDoc } from '../utils/document.js'

const TYPE_LABELS = {
  PRESTACION_SERVICIOS: 'Contrato de Prestación de Servicios',
  EXPEDIENTE_JURIDICO: 'Expediente Jurídico',
}

const fecha = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—'

const slug = (texto) =>
  (texto || 'documento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

export default function ContractReview() {
  const { id } = useParams()
  const { user } = useAuth()

  const [contract, setContract] = useState(null)
  const [content, setContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const cargar = () =>
    api
      .get(`/contracts/${id}`)
      .then(({ data }) => {
        setContract(data.contract)
        setContent(data.contract.content ?? '')
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const puedeAprobar = user?.role === 'LAWYER' || user?.role === 'ADMIN'
  const aprobado = contract?.status === 'APPROVED'
  const esAsistente = user?.role === 'ASSISTANT'
  const esExpediente = contract?.type === 'EXPEDIENTE_JURIDICO'

  const guardarContenido = async () => {
    setBusy('save')
    setError('')
    setNotice('')
    try {
      const { data } = await api.put(`/contracts/${id}`, { content })
      setContract(data.contract)
      setEditing(false)
      setNotice('Contenido actualizado correctamente.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy('')
    }
  }

  const enviarARevision = async () => {
    setBusy('review')
    setError('')
    setNotice('')
    try {
      const { data } = await api.put(`/contracts/${id}`, { status: 'UNDER_REVIEW' })
      setContract(data.contract)
      setNotice('El documento fue enviado a revisión legal.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy('')
    }
  }

  const aprobar = async () => {
    if (
      !window.confirm(
        '¿Confirmás la aprobación formal del documento? Quedará firmado digitalmente con tu nombre y matrícula.',
      )
    ) {
      return
    }
    setBusy('approve')
    setError('')
    setNotice('')
    try {
      const { data } = await api.patch(`/contracts/${id}/approve`)
      setContract(data.contract)
      setNotice('Documento aprobado formalmente.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy('')
    }
  }

  const datos = useMemo(() => {
    if (!contract?.extractedData) return []
    return Object.entries(contract.extractedData).filter(
      ([, v]) => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0),
    )
  }, [contract])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando documento…
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || 'No se encontró el contrato.'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* --- Encabezado --- */}
      <div className="flex flex-wrap items-start justify-between gap-3 no-print">
        <div>
          <Link
            to="/contracts"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Repositorio de Contratos
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
            {contract.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <StatusBadge status={contract.status} />
            <span>{TYPE_LABELS[contract.type] ?? contract.type}</span>
            <span>·</span>
            <span>Creado por {contract.createdBy?.name ?? '—'}</span>
            <span>·</span>
            <span>{fecha(contract.createdAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" /> Imprimir / PDF
          </button>
          <button
            type="button"
            onClick={() => downloadAsDoc(content, `${slug(contract.title)}.doc`)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Descargar .doc
          </button>
          {!aprobado &&
            (editing ? (
              <>
                <button
                  type="button"
                  onClick={guardarContenido}
                  disabled={busy === 'save'}
                  className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {busy === 'save' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContent(contract.content ?? '')
                    setEditing(false)
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" /> Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" /> Editar
              </button>
            ))}

          {contract.status === 'DRAFT' && (
            <button
              type="button"
              onClick={enviarARevision}
              disabled={busy === 'review'}
              className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {busy === 'review' && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar a Revisión Legal
            </button>
          )}

          {puedeAprobar && !aprobado && (
            <button
              type="button"
              onClick={aprobar}
              disabled={busy === 'approve'}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy === 'approve' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BadgeCheck className="h-4 w-4" />
              )}
              Aprobar Formalmente Documento
            </button>
          )}
        </div>
      </div>

      {/* --- Avisos --- */}
      {esAsistente && !aprobado && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 no-print">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Este documento requiere la aprobación formal de un Abogado Matriculado para ser
          definitivo.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 no-print">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 no-print">
          <ShieldCheck className="h-4 w-4" /> {notice}
        </div>
      )}

      {/* --- Partes --- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 no-print">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <p className="text-[11px] tracking-wide text-slate-500 uppercase">
            {esExpediente ? 'Parte solicitante' : 'Contratante'}
          </p>
          <p className="font-semibold text-slate-900">{contract.contractor?.legalName ?? '—'}</p>
          <p className="text-xs text-slate-500">CUIT {contract.contractor?.taxId ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <p className="text-[11px] tracking-wide text-slate-500 uppercase">
            {esExpediente ? 'Contraparte' : 'Prestadora'}
          </p>
          <p className="font-semibold text-slate-900">{contract.contractee?.legalName ?? '—'}</p>
          <p className="text-xs text-slate-500">DNI/CUIT {contract.contractee?.taxId ?? '—'}</p>
        </div>
      </div>

      {/* --- Documento (A4) --- */}
      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={28}
          className="w-full rounded-lg border border-amber-300 bg-white px-4 py-3 font-serif text-sm leading-relaxed text-slate-800 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none no-print"
        />
      ) : (
        <article className="a4-sheet">
          <div dangerouslySetInnerHTML={{ __html: documentToHtml(content) }} />

          {aprobado && contract.approvedBy && (
            <div className="mt-10 border-t-2 border-emerald-700 pt-4 text-center">
              <p className="font-display text-xs font-bold tracking-widest text-emerald-800 uppercase">
                Documento aprobado formalmente
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {contract.approvedBy.name}
              </p>
              {contract.approvedBy.licenseNumber && (
                <p className="text-xs text-slate-600">
                  Matrícula {contract.approvedBy.licenseNumber}
                </p>
              )}
              <p className="text-xs text-slate-500">
                Acosta &amp; Asociados · {fecha(contract.updatedAt)}
              </p>
            </div>
          )}
        </article>
      )}

      {/* --- Datos estructurados extraídos por la IA --- */}
      {datos.length > 0 && (
        <details className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm no-print">
          <summary className="cursor-pointer text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Datos estructurados del documento ({datos.length})
          </summary>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {datos.map(([campo, valor]) => (
              <div key={campo} className="border-b border-slate-100 pb-1">
                <dt className="text-[11px] text-slate-400">{campo}</dt>
                <dd className="text-xs break-words text-slate-700">
                  {Array.isArray(valor) ? `${valor.length} registro(s)` : String(valor)}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </div>
  )
}

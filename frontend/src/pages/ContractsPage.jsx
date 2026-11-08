/**
 * ContractsPage.jsx — Repositorio de Contratos (RF06).
 *
 * Listado de todos los contratos con sus partes, estado, creador y
 * aprobador. Filtro por estado en el cliente y acceso a la vista de
 * revisión/aprobación de cada documento.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScrollText, Plus, ArrowRight, AlertCircle } from 'lucide-react'
import api, { getErrorMessage } from '../api/axiosConfig.js'
import StatusBadge from '../components/common/StatusBadge.jsx'

const FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'DRAFT', label: 'Borradores' },
  { value: 'UNDER_REVIEW', label: 'En Revisión' },
  { value: 'APPROVED', label: 'Aprobados' },
  { value: 'CANCELLED', label: 'Cancelados' },
]

const fecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export default function ContractsPage() {
  const [contracts, setContracts] = useState([])
  const [filtro, setFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/contracts')
      .then(({ data }) => setContracts(data.contracts))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const visibles = filtro ? contracts.filter((c) => c.status === filtro) : contracts

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Repositorio de Contratos</h1>
          <p className="text-sm text-slate-500">
            Listado, revisión y aprobación de los instrumentos del estudio.
          </p>
        </div>
        <Link
          to="/contracts/new"
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" /> Nuevo Contrato
        </Link>
      </div>

      {/* Filtro por estado */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltro(f.value)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              filtro === f.value
                ? 'border-amber-500 bg-amber-50 text-amber-800'
                : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Contratante</th>
              <th className="px-4 py-3">Prestadora</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Creado por</th>
              <th className="px-4 py-3">Aprobado por</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Cargando…</td></tr>
            )}
            {!loading && visibles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  <ScrollText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  No hay contratos para este filtro.
                </td>
              </tr>
            )}
            {visibles.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="max-w-xs truncate px-4 py-3">
                  <p className="font-medium text-slate-800">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.type} · {fecha(c.createdAt)}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.contractor?.legalName ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{c.contractee?.legalName ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-slate-600">{c.createdBy?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  {c.approvedBy?.name ? `${c.approvedBy.name}${c.approvedBy.licenseNumber ? ` (Mat. ${c.approvedBy.licenseNumber})` : ''}` : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/contracts/${c.id}`}
                    className="inline-flex items-center gap-1 font-medium text-amber-700 hover:underline"
                  >
                    Ver <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

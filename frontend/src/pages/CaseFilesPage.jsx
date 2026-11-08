/**
 * CaseFilesPage.jsx — Listado de Expedientes Jurídicos.
 *
 * Permite buscar y filtrar por estado los expedientes del estudio y abrir
 * cualquiera de ellos (/case-files/:id). El botón superior abre el Asistente
 * con la plantilla EXPEDIENTE preseleccionada para generar uno nuevo con IA.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderArchive, Sparkles, Search, ArrowRight, User } from 'lucide-react'
import { CASE_FILES } from '../data/caseFiles.js'
import { estadoStyle, prioridadStyle } from '../utils/caseFileStyles.js'

const FILTROS = ['Todos', 'En trámite', 'En espera', 'Cerrado']

export default function CaseFilesPage() {
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState('Todos')

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CASE_FILES.filter((c) => {
      if (filtro !== 'Todos' && c.estado !== filtro) return false
      if (!q) return true
      return [c.numero, c.caratula, c.tipo, c.area, c.profesional, c.solicitante.nombre]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [query, filtro])

  const contar = (f) =>
    f === 'Todos' ? CASE_FILES.length : CASE_FILES.filter((c) => c.estado === f).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-amber-700 uppercase">
            <FolderArchive className="h-4 w-4" /> Expedientes del estudio
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
            Expedientes Jurídicos
          </h1>
          <p className="text-sm text-slate-500">
            Seleccioná un expediente para ver su detalle completo.
          </p>
        </div>
        <Link
          to="/contracts/new?type=EXPEDIENTE"
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          <Sparkles className="h-4 w-4" /> Nuevo expediente con IA
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número, carátula, cliente o profesional…"
            className="w-full rounded-md border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                filtro === f
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f} ({contar(f)})
            </button>
          ))}
        </div>
      </div>

      {resultados.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No hay expedientes que coincidan con la búsqueda.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {resultados.map((c) => (
            <li key={c.id}>
              <Link
                to={`/case-files/${c.id}`}
                className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-amber-400 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-xs font-semibold text-amber-700">{c.numero}</p>
                  <div className="flex gap-1.5">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${estadoStyle(c.estado)}`}
                    >
                      {c.estado}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${prioridadStyle(c.prioridad)}`}
                    >
                      {c.prioridad}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{c.caratula}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {c.tipo} · {c.area}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> {c.profesional}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700 group-hover:text-amber-700">
                    Abrir <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

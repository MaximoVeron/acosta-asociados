/**
 * HomeDashboard.jsx — Página Home del estudio.
 *
 * Cabecera de bienvenida personalizada, KPIs calculados desde la API
 * (contratos + partes), acciones rápidas y tabla de actividad reciente
 * con acceso directo a la vista de revisión.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ScrollText,
  Clock,
  BadgeCheck,
  UsersRound,
  Sparkles,
  UserPlus,
  ArrowRight,
} from 'lucide-react'
import api from '../api/axiosConfig.js'
import { useAuth } from '../context/AuthContext.jsx'
import StatusBadge from '../components/common/StatusBadge.jsx'

const fecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function HomeDashboard() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState([])
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        // Ambos listados en paralelo: el dashboard solo los cuenta/muestra
        const [c, p] = await Promise.all([api.get('/contracts'), api.get('/parties')])
        setContracts(c.data.contracts)
        setParties(p.data.parties)
      } catch {
        // Sin API no hay métricas; la vista igualmente se renderiza
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  // KPIs según los estados del ENUM del backend
  const activos = contracts.filter((c) => c.status !== 'CANCELLED').length
  const enRevision = contracts.filter((c) => c.status === 'UNDER_REVIEW').length
  const aprobados = contracts.filter((c) => c.status === 'APPROVED').length
  const recientes = [...contracts]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const kpis = [
    { label: 'Contratos Activos', value: activos, icon: ScrollText, color: 'text-blue-900 bg-blue-50' },
    { label: 'Pendientes de Revisión Letrada', value: enRevision, icon: Clock, color: 'text-amber-700 bg-amber-50' },
    { label: 'Contratos Aprobados', value: aprobados, icon: BadgeCheck, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Clientes y Partes', value: parties.length, icon: UsersRound, color: 'text-slate-700 bg-slate-100' },
  ]

  return (
    <div className="space-y-6">
      {/* --- Bienvenida personalizada --- */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          {user?.role === 'LAWYER' && user?.name?.startsWith('Dra.')
            ? `Bienvenida, ${user.name}`
            : `Bienvenido, ${user?.name}`}
          {user?.licenseNumber && (
            <span className="ml-2 text-base font-normal text-slate-500">
              — Matrícula {user.licenseNumber}
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Panel general del estudio · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* --- Tarjetas de indicadores --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {loading ? '…' : value}
                </p>
              </div>
              <span className={`rounded-full p-3 ${color}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* --- Acciones rápidas --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/contracts/new"
          className="flex items-center gap-4 rounded-lg border border-amber-300 bg-amber-50 p-5 transition-colors hover:bg-amber-100"
        >
          <Sparkles className="h-8 w-8 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">Redactar Contrato con Asistente</p>
            <p className="text-xs text-amber-700">Generación guiada por IA con plantilla oficial</p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 text-amber-600" />
        </Link>
        <Link
          to="/parties"
          className="flex items-center gap-4 rounded-lg border border-slate-300 bg-white p-5 transition-colors hover:bg-slate-50"
        >
          <UserPlus className="h-8 w-8 text-blue-900" />
          <div>
            <p className="font-semibold text-slate-900">Registrar Nueva Parte / Cliente</p>
            <p className="text-xs text-slate-500">Personas físicas y jurídicas del directorio</p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 text-slate-400" />
        </Link>
      </div>

      {/* --- Actividad reciente --- */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-slate-900">Actividad Reciente</h2>
          <Link to="/contracts" className="text-sm font-medium text-amber-700 hover:underline">
            Ver repositorio →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
              <th className="px-5 py-3">Documento</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3">Creado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-400">Cargando…</td></tr>
            )}
            {!loading && recientes.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-400">Todavía no hay contratos registrados.</td></tr>
            )}
            {recientes.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="max-w-md truncate px-5 py-3 font-medium text-slate-800">{c.title}</td>
                <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-3 text-slate-500">{fecha(c.createdAt)}</td>
                <td className="px-5 py-3 text-right">
                  <Link
                    to={`/contracts/${c.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:underline"
                  >
                    Revisar <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
            {/* El expediente del estudio, con acceso directo */}
            <tr className="border-b border-slate-100 hover:bg-slate-50">
              <td className="max-w-md truncate px-5 py-3 font-medium text-slate-800">
                EXP-2026-0147 · Distribuidora del Litoral S.R.L. c/ Transportes Río Paraná S.A.
              </td>
              <td className="px-5 py-3">
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-blue-900">
                  En trámite
                </span>
              </td>
              <td className="px-5 py-3 text-slate-500">12 feb 2026</td>
              <td className="px-5 py-3 text-right">
                <Link
                  to="/case-files"
                  className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:underline"
                >
                  Ver <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

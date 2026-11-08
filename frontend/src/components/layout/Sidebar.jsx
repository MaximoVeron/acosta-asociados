/**
 * Sidebar.jsx — Navegación lateral institucional.
 *
 * bg-slate-900 con acentos dorados (amber) en el ítem activo.
 * "Personal del Estudio" solo se renderiza si user.role === 'ADMIN'.
 */
import { NavLink } from 'react-router-dom'
import {
  Scale,
  LayoutDashboard,
  Sparkles,
  ScrollText,
  UsersRound,
  FolderArchive,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio / Resumen', icon: LayoutDashboard, end: true },
  { to: '/contracts/new', label: 'Asistente de Documentos', icon: Sparkles },
  { to: '/contracts', label: 'Repositorio de Contratos', icon: ScrollText },
  { to: '/parties', label: 'Clientes y Partes', icon: UsersRound },
  { to: '/case-files', label: 'Expedientes Jurídicos', icon: FolderArchive },
  { to: '/users', label: 'Personal del Estudio', icon: ShieldCheck, adminOnly: true },
]

export default function Sidebar() {
  const { user } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN',
  )

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-900 text-slate-100 md:flex">
      {/* Identidad institucional */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <Scale className="h-8 w-8 shrink-0 text-amber-500" />
        <div>
          <p className="font-display text-sm leading-tight font-bold tracking-wide text-white">
            ACOSTA &amp; ASOCIADOS
          </p>
          <p className="text-[11px] tracking-widest text-slate-400 uppercase">
            Estudio Jurídico
          </p>
        </div>
      </div>

      {/* Menú de secciones */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {visibleItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 border-l-2 px-5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'border-amber-500 bg-slate-800/80 font-semibold text-amber-400'
                      : 'border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Pie institucional */}
      <div className="border-t border-slate-800 px-5 py-4">
        <p className="text-[10px] leading-relaxed text-slate-500">
          Sistema de Gestión Documental Legal.
          <br />
          Todo instrumento requiere supervisión letrada.
        </p>
      </div>
    </aside>
  )
}

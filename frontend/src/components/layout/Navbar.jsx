/**
 * Navbar.jsx — Barra superior: identidad del usuario (nombre, rol,
 * matrícula) y botón Logout siempre visible.
 */
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth, ROLE_LABELS } from '../../context/AuthContext.jsx'

/** Colores del badge de rol (sobrio, coherente con la paleta institucional). */
const ROLE_BADGE_STYLES = {
  ADMIN: 'bg-amber-50 text-amber-800 border-amber-300',
  LAWYER: 'bg-blue-50 text-blue-900 border-blue-200',
  ASSISTANT: 'bg-slate-100 text-slate-700 border-slate-300',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout() // limpia cookie (backend) y estado (contexto)
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
      {/* En mobile, identidad mínima del estudio (el sidebar está oculto) */}
      <p className="font-display text-sm font-bold tracking-wide text-slate-900 md:hidden">
        ACOSTA &amp; ASOCIADOS
      </p>
      <div className="hidden md:block" />

      {/* Usuario autenticado */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm leading-tight font-semibold text-slate-900">
            {user?.name}
          </p>
          <p className="text-xs text-slate-500">
            <span
              className={`mr-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                ROLE_BADGE_STYLES[user?.role] ?? ROLE_BADGE_STYLES.ASSISTANT
              }`}
            >
              {ROLE_LABELS[user?.role] ?? user?.role}
            </span>
            {/* La matrícula solo aplica a abogados */}
            {user?.licenseNumber && (
              <span className="text-slate-500">Mat. {user.licenseNumber}</span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar sesión"
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  )
}

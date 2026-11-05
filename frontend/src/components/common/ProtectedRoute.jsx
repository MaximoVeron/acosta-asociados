/**
 * ProtectedRoute.jsx — Guardián de rutas privadas + filtro por roles.
 *
 * Uso:
 *   <Route element={<ProtectedRoute />}>            → cualquier usuario autenticado
 *   <Route element={<ProtectedRoute roles={['ADMIN']} />}> → solo ADMIN
 *
 * Mientras checkAuth está en curso muestra un splash institucional;
 * sin sesión redirige a /login; con rol no permitido muestra un 403.
 */
import { Navigate, Outlet } from 'react-router-dom'
import { Scale, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <Scale className="h-10 w-10 animate-pulse text-amber-600" />
        <p className="text-sm font-medium tracking-wide text-slate-500">
          ACOSTA &amp; ASOCIADOS — Verificando sesión…
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Acceso restringido
        </h1>
        <p className="max-w-md text-sm text-slate-600">
          Su rol no tiene permisos para acceder a esta sección del sistema.
          Si cree que es un error, contacte al administrador del estudio.
        </p>
        <Navigate to="/" replace />
      </div>
    )
  }

  return children ? children : <Outlet />
}

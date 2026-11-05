/**
 * UsersAdminPage.jsx — STUB (Entrega 1). Ruta protegida: solo ADMIN.
 * Se reemplaza en la Entrega 2 con la gestión de personal interno
 * (alta, edición de roles y desactivación vía /api/v1/users).
 */
import { ShieldCheck } from 'lucide-react'

export default function UsersAdminPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <ShieldCheck className="h-10 w-10 text-slate-300" />
      <h1 className="font-display text-xl font-bold text-slate-700">
        Personal del Estudio
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        Gestión de usuarios internos (exclusivo ADMIN) — disponible en la Entrega 2.
      </p>
    </div>
  )
}

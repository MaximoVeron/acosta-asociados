/**
 * PartiesPage.jsx — STUB (Entrega 1).
 * Se reemplaza en la Entrega 2 con el directorio CRUD de clientes,
 * contratantes y prestadores (búsqueda + modal de alta/edición).
 */
import { UsersRound } from 'lucide-react'

export default function PartiesPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <UsersRound className="h-10 w-10 text-slate-300" />
      <h1 className="font-display text-xl font-bold text-slate-700">
        Clientes y Partes
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        Directorio de personas físicas y jurídicas — disponible en la Entrega 2.
      </p>
    </div>
  )
}

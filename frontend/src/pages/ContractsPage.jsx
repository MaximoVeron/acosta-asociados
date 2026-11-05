/**
 * ContractsPage.jsx — STUB (Entrega 1).
 * Se reemplaza en la Entrega 2 con el repositorio: listado de contratos
 * con estados, filtros y acceso a la vista de revisión.
 */
import { ScrollText } from 'lucide-react'

export default function ContractsPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <ScrollText className="h-10 w-10 text-slate-300" />
      <h1 className="font-display text-xl font-bold text-slate-700">
        Repositorio de Contratos
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        Listado, revisión y aprobación (RF06-RF08) — disponible en la Entrega 2.
      </p>
    </div>
  )
}

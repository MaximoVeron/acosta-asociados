/**
 * HomeDashboard.jsx — STUB (Entrega 1).
 * Se reemplaza en la Entrega 2 con métricas KPI, acciones rápidas
 * y tabla de actividad reciente.
 */
import { LayoutDashboard } from 'lucide-react'

export default function HomeDashboard() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <LayoutDashboard className="h-10 w-10 text-slate-300" />
      <h1 className="font-display text-xl font-bold text-slate-700">
        Inicio / Resumen
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        Dashboard con métricas y actividad reciente — disponible en la Entrega 2.
      </p>
    </div>
  )
}

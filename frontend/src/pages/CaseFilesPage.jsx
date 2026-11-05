/**
 * CaseFilesPage.jsx — STUB (Entrega 1).
 * Se reemplaza en la Entrega 2 con la gestión de expedientes jurídicos
 * (ej. EXP-2026-0147: carátula, partes, línea de tiempo y documentación).
 */
import { FolderArchive } from 'lucide-react'

export default function CaseFilesPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <FolderArchive className="h-10 w-10 text-slate-300" />
      <h1 className="font-display text-xl font-bold text-slate-700">
        Expedientes Jurídicos
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        Seguimiento de causas y documentación — disponible en la Entrega 2.
      </p>
    </div>
  )
}

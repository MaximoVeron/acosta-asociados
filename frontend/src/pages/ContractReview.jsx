/**
 * ContractReview.jsx — STUB (Entrega 1).
 * Se reemplaza en la Entrega 2 con el visor hoja A4, aprobación exclusiva
 * por rol (RF07) y exportación PDF/.doc (RF08).
 */
import { FileCheck2 } from 'lucide-react'

export default function ContractReview() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <FileCheck2 className="h-10 w-10 text-slate-300" />
      <h1 className="font-display text-xl font-bold text-slate-700">
        Revisión de Contrato
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        Visor A4 con aprobación letrada y exportación — disponible en la Entrega 2.
      </p>
    </div>
  )
}

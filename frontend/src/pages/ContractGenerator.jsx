/**
 * ContractGenerator.jsx — STUB (Entrega 1).
 * Se reemplaza en la Entrega 2 con el asistente inteligente (RF01-RF06):
 * instrucciones en lenguaje natural, panel de datos faltantes y hoja A4 en vivo.
 */
import { Sparkles } from 'lucide-react'

export default function ContractGenerator() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <Sparkles className="h-10 w-10 text-slate-300" />
      <h1 className="font-display text-xl font-bold text-slate-700">
        Asistente de Contratos
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        Generador inteligente con previsualización A4 — disponible en la Entrega 2.
      </p>
    </div>
  )
}

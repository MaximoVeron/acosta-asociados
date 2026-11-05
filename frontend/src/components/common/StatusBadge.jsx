/**
 * StatusBadge.jsx — Etiqueta visual semántica del estado de un contrato.
 *
 * Paleta acordada:
 *  - DRAFT          (Borrador):        slate
 *  - UNDER_REVIEW   (En Revisión):     ámbar
 *  - APPROVED       (Aprobado):        esmeralda
 *  - CANCELLED      (Cancelado):       rojo (extra, cubre el ENUM del backend)
 */
const STATUS_STYLES = {
  DRAFT: {
    label: 'Borrador',
    className: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  UNDER_REVIEW: {
    label: 'En Revisión',
    className: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  APPROVED: {
    label: 'Aprobado',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  CANCELLED: {
    label: 'Cancelado',
    className: 'bg-red-50 text-red-700 border-red-300',
  },
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? {
    label: status ?? '—',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${style.className}`}
    >
      {style.label}
    </span>
  )
}

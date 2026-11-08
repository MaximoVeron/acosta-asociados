/** Estilos (Tailwind) de los distintivos de estado y prioridad de expedientes. */

export const estadoStyle = (estado) =>
  ({
    'En trámite': 'border-blue-200 bg-blue-50 text-blue-900',
    'En espera': 'border-amber-200 bg-amber-50 text-amber-800',
    Cerrado: 'border-slate-200 bg-slate-100 text-slate-700',
  })[estado] ?? 'border-slate-200 bg-slate-50 text-slate-700'

export const prioridadStyle = (prioridad) =>
  ({
    Alta: 'border-red-200 bg-red-50 text-red-700',
    Media: 'border-orange-200 bg-orange-50 text-orange-700',
    Baja: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  })[prioridad] ?? 'border-slate-200 bg-slate-50 text-slate-700'

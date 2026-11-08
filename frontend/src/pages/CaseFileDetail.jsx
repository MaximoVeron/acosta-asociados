/**
 * CaseFileDetail.jsx — Detalle de un expediente jurídico (/case-files/:id).
 *
 * Muestra identificación, carátula, partes, antecedentes, línea de tiempo de
 * actuaciones y documentación del expediente seleccionado. Permite navegar al
 * anterior/siguiente sin volver al listado.
 */
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  FolderArchive,
  Sparkles,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { CASE_FILES, getCaseFile } from '../data/caseFiles.js'
import { estadoStyle, prioridadStyle } from '../utils/caseFileStyles.js'

const Dato = ({ label, value }) => (
  <div>
    <dt className="text-[11px] tracking-wide text-slate-500 uppercase">{label}</dt>
    <dd className="text-sm font-semibold text-slate-800">{value || '—'}</dd>
  </div>
)

export default function CaseFileDetail() {
  const { id } = useParams()
  const exp = getCaseFile(id)

  if (!exp) return <Navigate to="/case-files" replace />

  const index = CASE_FILES.findIndex((c) => c.id === exp.id)
  const prev = CASE_FILES[index - 1]
  const next = CASE_FILES[index + 1]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/case-files"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Todos los expedientes
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>
            {index + 1} de {CASE_FILES.length}
          </span>
          {prev ? (
            <Link
              to={`/case-files/${prev.id}`}
              title={prev.numero}
              className="rounded-md border border-slate-300 bg-white p-1.5 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <span className="rounded-md border border-slate-200 p-1.5 opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </span>
          )}
          {next ? (
            <Link
              to={`/case-files/${next.id}`}
              title={next.numero}
              className="rounded-md border border-slate-300 bg-white p-1.5 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="rounded-md border border-slate-200 p-1.5 opacity-40">
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-amber-700 uppercase">
            <FolderArchive className="h-4 w-4" /> Expediente del estudio
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">{exp.numero}</h1>
          <p className="max-w-3xl text-sm text-slate-600">{exp.caratula}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${estadoStyle(exp.estado)}`}
          >
            {exp.estado}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${prioridadStyle(exp.prioridad)}`}
          >
            Prioridad {exp.prioridad}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* --- Columna principal --- */}
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900">
              1. Identificación del expediente
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Dato label="Número" value={exp.numero} />
              <Dato label="Fecha de apertura" value={exp.fechaApertura} />
              <Dato label="Tipo" value={exp.tipo} />
              <Dato label="Área responsable" value={exp.area} />
              <Dato label="Profesional responsable" value={exp.profesional} />
              <Dato label="Matrícula" value={exp.matricula} />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900">2. Carátula y objeto</h2>
            <p className="mt-2 text-sm font-semibold text-slate-800">{exp.caratula}</p>
            <p className="mt-2 text-sm text-slate-600">{exp.objeto}</p>
            <p className="mt-2 text-sm text-slate-600">{exp.descripcion}</p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900">3. Partes involucradas</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] tracking-wide text-slate-500 uppercase">
                  Parte solicitante
                </p>
                <p className="text-sm font-semibold text-slate-900">{exp.solicitante.nombre}</p>
                <p className="text-xs text-slate-600">CUIT {exp.solicitante.taxId}</p>
                <p className="text-xs text-slate-600">{exp.solicitante.domicilio}</p>
                <p className="text-xs text-slate-600">{exp.solicitante.email}</p>
                <p className="text-xs text-slate-600">{exp.solicitante.telefono}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] tracking-wide text-slate-500 uppercase">Contraparte</p>
                <p className="text-sm font-semibold text-slate-900">{exp.contraparte.nombre}</p>
                <p className="text-xs text-slate-600">CUIT {exp.contraparte.taxId}</p>
                <p className="text-xs text-slate-600">{exp.contraparte.domicilio}</p>
                <p className="text-xs text-slate-600">{exp.contraparte.info}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900">4. Antecedentes</h2>
            <p className="mt-2 text-sm text-slate-600">{exp.antecedentes.descripcion}</p>
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Dato label="Hecho principal" value={exp.antecedentes.hecho} />
              <Dato label="Origen de la solicitud" value={exp.antecedentes.origen} />
            </dl>
            <p className="mt-2 text-xs text-slate-500">
              Documentación inicial: {exp.antecedentes.documentacion}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
              <Clock className="h-4 w-4 text-amber-600" /> 5. Actuaciones y movimientos
            </h2>
            <ol className="mt-4 space-y-4 border-l-2 border-slate-200 pl-4">
              {exp.actuaciones.map((a) => (
                <li key={a.fecha + a.actuacion} className="relative">
                  <span className="absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-500" />
                  <p className="text-xs font-semibold text-amber-700">{a.fecha}</p>
                  <p className="text-sm font-semibold text-slate-800">{a.actuacion}</p>
                  <p className="text-xs text-slate-500">
                    {a.responsable} · {a.observaciones}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900">
              6. Documentación asociada
            </h2>
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
                  <th className="py-2 pr-3">Identificador</th>
                  <th className="py-2 pr-3">Documento</th>
                  <th className="py-2 pr-3">Incorporado</th>
                  <th className="py-2">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {exp.documentacion.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs text-slate-600">{d.id}</td>
                    <td className="py-2 pr-3 font-medium text-slate-800">{d.nombre}</td>
                    <td className="py-2 pr-3 text-xs text-slate-500">{d.fecha}</td>
                    <td className="py-2 text-xs text-slate-600">{d.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* --- Columna lateral --- */}
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-bold text-slate-900">
              7. Observaciones pendientes
            </h2>
            <dl className="mt-3 space-y-3 text-xs">
              <div>
                <dt className="font-semibold text-slate-500">Observaciones generales</dt>
                <dd className="text-slate-700">{exp.observaciones.generales}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Información pendiente</dt>
                <dd className="text-slate-700">{exp.observaciones.infoPendiente}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Documentación pendiente</dt>
                <dd className="text-slate-700">{exp.observaciones.docPendiente}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Próximas acciones</dt>
                <dd className="text-slate-700">{exp.observaciones.proximas}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-bold text-slate-900">
              8. Estado y conclusiones
            </h2>
            <p className="mt-2 text-xs text-slate-500">Resumen de situación</p>
            <p className="text-sm text-slate-700">{exp.conclusiones.resumen}</p>
            <p className="mt-3 text-xs text-slate-500">Dictamen del profesional responsable</p>
            <p className="text-sm text-slate-700">{exp.conclusiones.dictamen}</p>
            <p className="mt-3 text-[11px] text-slate-400">
              Última actualización: {exp.conclusiones.actualizacion}
            </p>
          </section>

          <Link
            to="/contracts/new?type=EXPEDIENTE"
            className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 transition-colors hover:bg-amber-100"
          >
            <Sparkles className="h-6 w-6 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Generar un expediente nuevo</p>
              <p className="text-xs text-amber-700">
                El asistente IA completa la plantilla EXP-001 con los datos que le indiques.
              </p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-amber-600" />
          </Link>
        </div>
      </div>
    </div>
  )
}

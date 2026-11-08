/**
 * ContractGenerator.jsx — Asistente de redacción (RF01–RF06).
 *
 * Columna izquierda: selector de plantilla (RF02), partes desde GET /parties,
 * chat en lenguaje natural y panel de datos faltantes (RF04/RF06).
 * Columna derecha: hoja A4 con vista previa en vivo (RF05) y, cuando el
 * microservicio IA devuelve el documento completo, el texto oficial renderizado.
 *
 * Integración: cada mensaje va a POST {AI}/ai/process-contract con
 * { prompt, document_type, current_data }. El servicio acumula las ranuras y
 * responde INCOMPLETE (con missing_fields) o COMPLETE (con rendered_document).
 * El LLM NO redacta: solo extrae datos y Python rellena la plantilla oficial.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Sparkles,
  Send,
  FileText,
  FolderArchive,
  AlertCircle,
  CheckCircle2,
  Save,
  Loader2,
  ArrowRight,
  Bot,
  User as UserIcon,
  Users,
  Zap,
  RotateCcw,
  ListChecks,
  Circle,
} from 'lucide-react'
import api, { getErrorMessage } from '../api/axiosConfig.js'
import { documentToHtml } from '../utils/document.js'

/** Documentos oficiales que sabe generar el microservicio IA. */
const DOCUMENTOS = [
  {
    value: 'CONTRATO',
    title: 'Contrato de Prestación de Servicios Profesionales',
    subtitle: 'Modelo CONT-001 · cláusulas Primera a Novena',
    icon: FileText,
    contractType: 'PRESTACION_SERVICIOS',
    partyLabels: ['Parte Contratante (cliente)', 'Parte Prestadora (profesional)'],
    examples: [
      {
        label: 'Contrato completo — Distribuidora del Litoral',
        text: 'Contrato para Lucía Fernández, CUIL 35.678.901, con Distribuidora del Litoral S.R.L., CUIT 30-71234567-8, por 6 meses desde abril de 2026, honorarios $4.800.000 en 6 cuotas de $800.000',
      },
    ],
  },
  {
    value: 'EXPEDIENTE',
    title: 'Expediente Jurídico',
    subtitle: 'Modelo EXP-001 · secciones 1 a 9',
    icon: FolderArchive,
    contractType: 'EXPEDIENTE_JURIDICO',
    partyLabels: ['Parte solicitante', 'Contraparte'],
    examples: [
      {
        label: 'Expediente EXP-2026-0147 — incumplimiento contractual',
        text: 'Cargá el expediente EXP-2026-0147, abierto el 12 de febrero de 2026, reclamo por incumplimiento contractual, carátula Distribuidora del Litoral S.R.L. c/ Transportes Río Paraná S.A. s/ incumplimiento de contrato de transporte',
      },
    ],
  },
]

/** Etiquetas legibles de las ranuras obligatorias (para el panel RF04). */
const FIELD_LABELS = {
  CONTRATO: {
    contractor_name: 'Razón social de la parte contratante',
    contractor_tax_id: 'CUIT de la parte contratante',
    contractee_name: 'Nombre de la parte prestadora',
    contractee_tax_id: 'DNI/CUIT de la parte prestadora',
    service_object: 'Objeto del contrato (qué servicio se presta)',
    start_date: 'Fecha de inicio',
    duration_months: 'Duración en meses',
    total_fee: 'Monto total de honorarios',
    payment_terms: 'Modalidad de pago (cuotas, vencimientos)',
  },
  EXPEDIENTE: {
    numero_expediente: 'Número de expediente',
    fecha_apertura: 'Fecha de apertura',
    tipo_expediente: 'Tipo de expediente',
    caratula: 'Carátula del expediente',
    objeto: 'Objeto del expediente',
    solicitante_name: 'Nombre o razón social de la parte solicitante',
    solicitante_tax_id: 'DNI/CUIT de la parte solicitante',
    contraparte_name: 'Nombre o razón social de la contraparte',
    contraparte_tax_id: 'DNI/CUIT de la contraparte',
    profesional_responsable: 'Profesional responsable',
  },
}

/** Ranuras extra de la vista previa (las que no son obligatorias). */
const EXTRA_LABELS = {
  CONTRATO: {
    contractor_address: 'Domicilio de la parte contratante',
    contractor_representative: 'Representante de la parte contratante',
    contractee_address: 'Domicilio de la parte prestadora',
    end_date: 'Fecha de finalización',
    payment_method: 'Medio de pago',
    jurisdiction: 'Jurisdicción',
  },
  EXPEDIENTE: {
    area_responsable: 'Área responsable',
    matricula: 'Matrícula profesional',
    estado: 'Estado',
    prioridad: 'Prioridad',
    descripcion_general: 'Descripción general',
    solicitante_address: 'Domicilio de la solicitante',
    solicitante_email: 'Email de la solicitante',
    solicitante_phone: 'Teléfono de la solicitante',
    contraparte_address: 'Domicilio de la contraparte',
    contraparte_info: 'Información adicional de la contraparte',
  },
}

/** Convierte las partes elegidas en ranuras del documento. */
const partySlots = (documentType, contractor, contractee) => {
  const raw =
    documentType === 'CONTRATO'
      ? {
          contractor_name: contractor?.legalName,
          contractor_tax_id: contractor?.taxId,
          contractor_address: contractor?.address,
          contractor_representative: contractor?.representative,
          contractee_name: contractee?.legalName,
          contractee_tax_id: contractee?.taxId,
          contractee_address: contractee?.address,
        }
      : {
          solicitante_name: contractor?.legalName,
          solicitante_tax_id: contractor?.taxId,
          solicitante_address: contractor?.address,
          solicitante_email: contractor?.email,
          solicitante_phone: contractor?.phone,
          contraparte_name: contractee?.legalName,
          contraparte_tax_id: contractee?.taxId,
          contraparte_address: contractee?.address,
          contraparte_info: contractee?.representative,
        }
  // Solo ranuras con valor: no pisamos con null lo que cargó el chat
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => v))
}

/** Error legible del backend (que a su vez traduce los del microservicio IA). */
const errorText = (err) => getErrorMessage(err, 'No se pudo procesar la solicitud.')

/** Valor visible en la hoja A4. */
const showValue = (value) => {
  if (value === null || value === undefined || value === '') return null
  if (Array.isArray(value)) return value.length ? `${value.length} registro(s)` : null
  return String(value)
}

export default function ContractGenerator() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [documentType, setDocumentType] = useState(
    searchParams.get('type') === 'EXPEDIENTE' ? 'EXPEDIENTE' : 'CONTRATO',
  )
  const [parties, setParties] = useState([])
  const [contractorId, setContractorId] = useState('')
  const [contracteeId, setContracteeId] = useState('')
  const [title, setTitle] = useState('')

  const [messages, setMessages] = useState([])
  const [prompt, setPrompt] = useState('')
  const [data, setData] = useState({})
  const [missing, setMissing] = useState([])
  const [document, setDocument] = useState(null)
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const chatEnd = useRef(null)

  const doc = DOCUMENTOS.find((d) => d.value === documentType)
  const contractor = parties.find((p) => p.id === contractorId)
  const contractee = parties.find((p) => p.id === contracteeId)

  useEffect(() => {
    api
      .get('/parties')
      .then(({ data: res }) => setParties(res.parties))
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  // Segundos transcurridos mientras el modelo local trabaja (2–4 min por turno)
  useEffect(() => {
    if (!busy) return undefined
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [busy])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const slots = useMemo(
    () => partySlots(documentType, contractor, contractee),
    [documentType, contractor, contractee],
  )
  const fullData = useMemo(() => ({ ...data, ...slots }), [data, slots])

  const resetSession = (nextType) => {
    setDocumentType(nextType)
    setMessages([])
    setData({})
    setMissing([])
    setDocument(null)
    setTitle('')
    setError('')
  }

  // Cambiar una parte invalida el documento ya renderizado
  const changeContractor = (value) => {
    setContractorId(value)
    setDocument(null)
  }
  const changeContractee = (value) => {
    setContracteeId(value)
    setDocument(null)
  }

  const enviar = async (texto) => {
    const instruccion = (texto ?? prompt).trim()
    if (!instruccion || busy) return

    setMessages((m) => [...m, { role: 'user', text: instruccion }])
    setPrompt('')
    setError('')
    setElapsed(0)
    setBusy(true)
    try {
      // Proxy autenticado del backend hacia el microservicio IA. El timeout
      // es alto porque el LLM local con razonamiento tarda minutos por turno.
      // Queda 20 s por encima del timeout del backend (600 s) para alcanzar a
      // recibir su 504 con el mensaje explicativo en vez de un timeout de axios.
      const { data: res } = await api.post(
        '/ai/process',
        {
          prompt: instruccion,
          document_type: documentType,
          current_data: fullData,
        },
        { timeout: 620000 },
      )
      setData(res.current_data ?? {})
      setMissing(res.missing_fields ?? [])
      setDocument(res.rendered_document ?? null)
      setMessages((m) => [...m, { role: 'agent', text: res.agent_message }])
    } catch (err) {
      setError(errorText(err))
      setMessages((m) => [
        ...m,
        {
          role: 'agent',
          text: 'No pude procesar la instrucción. Verifique que el microservicio IA esté corriendo en http://localhost:8000.',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  const guardar = async (status) => {
    if (!document || !contractorId || !contracteeId) return
    setSaving(true)
    setError('')
    try {
      const { data: res } = await api.post('/contracts', {
        title: title.trim() || defaultTitle,
        type: doc.contractType,
        status,
        content: document,
        extractedData: fullData,
        contractorId,
        contracteeId,
      })
      navigate(`/contracts/${res.contract.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const defaultTitle =
    documentType === 'CONTRATO'
      ? `Contrato de Prestación de Servicios — ${fullData.contractee_name ?? 'borrador'}`
      : `Expediente ${fullData.numero_expediente ?? 'sin número'} — ${
          fullData.caratula ?? 'borrador'
        }`

  const canSave = Boolean(document && contractorId && contracteeId)
  const pendientes = missing.map((campo) => FIELD_LABELS[documentType]?.[campo] ?? campo)

  // Progreso de las ranuras obligatorias (lo ya cargado por chat o por partes)
  const requeridos = Object.keys(FIELD_LABELS[documentType])
  const completados = requeridos.filter((c) => showValue(fullData[c])).length
  const progreso = Math.round((completados / requeridos.length) * 100)

  const pasos = [
    { label: 'Plantilla', done: true },
    { label: 'Partes', done: Boolean(contractorId && contracteeId) },
    { label: 'Instrucciones', done: messages.length > 0 },
    { label: 'Revisión y guardado', done: Boolean(document) },
  ]
  const pasoActual = pasos.findIndex((p) => !p.done)

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* ================= COLUMNA IZQUIERDA: ASISTENTE ================= */}
      <div className="space-y-4 no-print">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-amber-700 uppercase">
            <Sparkles className="h-4 w-4" /> Asistente con IA
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
            Asistente de Documentos
          </h1>
          <p className="text-sm text-slate-500">
            Describí el documento en lenguaje natural. El asistente extrae los datos y
            completa la plantilla oficial del estudio.
          </p>
        </div>

        {/* --- Progreso por pasos --- */}
        <ol className="grid grid-cols-4 gap-2">
          {pasos.map((p, i) => {
            const activo = i === pasoActual
            return (
              <li key={p.label} className="min-w-0">
                <div
                  className={`h-1.5 rounded-full ${
                    p.done ? 'bg-emerald-500' : activo ? 'bg-amber-500' : 'bg-slate-200'
                  }`}
                />
                <p
                  className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold ${
                    p.done ? 'text-emerald-700' : activo ? 'text-amber-700' : 'text-slate-400'
                  }`}
                >
                  {p.done ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                  ) : (
                    <span className="shrink-0">{i + 1}.</span>
                  )}
                  <span className="truncate">{p.label}</span>
                </p>
              </li>
            )
          })}
        </ol>

        {/* --- Paso 1: selector de plantilla (RF02) --- */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTOS.map(({ value, title: nombre, subtitle, icon: Icon }) => {
            const activa = documentType === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => resetSession(value)}
                className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition-all ${
                  activa
                    ? 'border-amber-500 bg-amber-50 shadow-sm ring-1 ring-amber-400'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                    activa ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{nombre}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{subtitle}</span>
                </span>
              </button>
            )
          })}
        </div>

        {/* --- Paso 2: partes desde GET /parties --- */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Users className="h-4 w-4 text-slate-500" /> Partes intervinientes
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600">
              {doc.partyLabels[0]}
              <select
                value={contractorId}
                onChange={(e) => changeContractor(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">Seleccionar…</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.legalName} — {p.taxId}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              {doc.partyLabels[1]}
              <select
                value={contracteeId}
                onChange={(e) => changeContractee(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">Seleccionar…</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.legalName} — {p.taxId}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Las partes del directorio completan automáticamente los datos de identificación.
          </p>
        </div>

        {/* --- Paso 3: conversación con el asistente (RF01, RF03) --- */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-slate-900">
                <Bot className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-white">Asistente jurídico</h2>
                <p className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${busy ? 'animate-pulse bg-amber-400' : 'bg-emerald-400'}`}
                  />
                  {busy ? 'Analizando…' : 'Listo para recibir instrucciones'}
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => resetSession(documentType)}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" /> Reiniciar
              </button>
            )}
          </div>

          <div className="max-h-96 min-h-48 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4">
            {/* Mensaje de bienvenida + accesos rápidos (mockups de demostración) */}
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-amber-400">
                <Bot className="h-4 w-4" />
              </span>
              <div className="min-w-0 space-y-2">
                <div className="rounded-lg rounded-tl-none border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                  Hola, soy el asistente del estudio. Contame los datos del{' '}
                  <strong>{doc.title.toLowerCase()}</strong> y yo completo la plantilla oficial.
                  Si falta algo, te lo voy a pedir.
                </div>
                {messages.length === 0 && (
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                      <Zap className="h-3 w-3 text-amber-600" /> Acceso rápido
                    </p>
                    {doc.examples.map((ejemplo) => (
                      <button
                        key={ejemplo.label}
                        type="button"
                        onClick={() => setPrompt(ejemplo.text)}
                        className="block w-full rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-2.5 text-left transition-colors hover:border-amber-500 hover:bg-amber-50"
                      >
                        <span className="block text-xs font-semibold text-amber-900">
                          {ejemplo.label}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[11px] text-slate-600">
                          {ejemplo.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    m.role === 'user'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 text-amber-400'
                  }`}
                >
                  {m.role === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </span>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap shadow-sm ${
                    m.role === 'user'
                      ? 'rounded-tr-none bg-slate-900 text-slate-100'
                      : 'rounded-tl-none border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-amber-400">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="rounded-lg rounded-tl-none border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <span className="flex items-center gap-2 font-semibold">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analizando la instrucción… {elapsed}s
                  </span>
                  <span className="mt-0.5 block text-amber-700">
                    El modelo local puede tardar varios minutos por turno.
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    enviar()
                  }
                }}
                placeholder="Escribí o pegá los datos del documento…"
                className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => enviar()}
                disabled={busy || !prompt.trim()}
                aria-label="Enviar instrucción"
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Enter envía · Shift+Enter agrega línea
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* --- Panel de datos requeridos (RF04 / RF06) --- */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ListChecks className="h-4 w-4 text-slate-500" /> Datos requeridos
            </h2>
            <span className="text-xs font-semibold text-slate-600">
              {completados}/{requeridos.length} · {progreso}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${
                progreso === 100 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progreso}%` }}
            />
          </div>

          {document ? (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Documento completo: listo para guardar o enviar a revisión.
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              {missing.length > 0
                ? `El asistente aún necesita ${missing.length} dato(s) para generar el documento.`
                : 'El documento se genera al completar todos los campos obligatorios.'}
            </p>
          )}

          <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {requeridos.map((campo) => {
              const ok = Boolean(showValue(fullData[campo]))
              return (
                <li
                  key={campo}
                  className={`flex items-start gap-2 text-xs ${ok ? 'text-slate-700' : 'text-slate-500'}`}
                >
                  {ok ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                  )}
                  <span className={pendientes.includes(FIELD_LABELS[documentType][campo]) ? 'text-amber-800' : ''}>
                    {FIELD_LABELS[documentType][campo]}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* --- Paso 4: guardado (RF06) --- */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <label className="text-xs font-medium text-slate-600">
            Título del documento
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultTitle}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => guardar('DRAFT')}
              disabled={!canSave || saving}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar como Borrador (DRAFT)
            </button>
            <button
              type="button"
              onClick={() => guardar('UNDER_REVIEW')}
              disabled={!canSave || saving}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Enviar a Revisión Legal <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {!canSave && (
            <p className="mt-2 text-[11px] text-slate-400">
              Para guardar: elegí ambas partes y completá todas las ranuras obligatorias.
            </p>
          )}
        </div>
      </div>

      {/* ================= COLUMNA DERECHA: HOJA A4 ================= */}
      <div className="xl:sticky xl:top-20 xl:self-start">
        {document ? (
          <article className="a4-sheet">
            <div dangerouslySetInnerHTML={{ __html: documentToHtml(document) }} />
          </article>
        ) : (
          <article className="a4-sheet">
            <p className="text-center font-display text-sm font-bold tracking-widest text-slate-900">
              ACOSTA &amp; ASOCIADOS
            </p>
            <p className="mt-1 text-center text-[11px] tracking-wide text-slate-500 uppercase">
              {doc.title}
            </p>
            <hr className="my-5 border-slate-300" />

            <p className="text-[11px] tracking-wide text-slate-500 uppercase">
              Vista previa de datos
            </p>

            <dl className="mt-3 space-y-2">
              {Object.keys(FIELD_LABELS[documentType]).map((campo) => {
                const valor = showValue(fullData[campo])
                return (
                  <div key={campo} className="text-xs">
                    <dt className="text-slate-500">{FIELD_LABELS[documentType][campo]}</dt>
                    <dd className="mt-0.5">
                      {valor ? (
                        <span className="hl-field font-semibold">{valor}</span>
                      ) : (
                        <span className="hl-missing">pendiente</span>
                      )}
                    </dd>
                  </div>
                )
              })}
            </dl>

            {Object.keys(EXTRA_LABELS[documentType]).some((c) => showValue(fullData[c])) && (
              <>
                <p className="mt-5 text-[11px] tracking-wide text-slate-500 uppercase">
                  Datos complementarios
                </p>
                <dl className="mt-2 space-y-1.5">
                  {Object.entries(EXTRA_LABELS[documentType])
                    .filter(([campo]) => showValue(fullData[campo]))
                    .map(([campo, label]) => (
                      <div key={campo} className="text-xs">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="hl-field inline-block font-medium">
                          {showValue(fullData[campo])}
                        </dd>
                      </div>
                    ))}
                </dl>
              </>
            )}

            <p className="mt-6 border-t border-slate-200 pt-3 text-[10px] text-slate-400">
              Los datos resaltados en amarillo provienen del usuario. El texto legal se
              completa recién cuando todas las ranuras obligatorias están cargadas.
            </p>
          </article>
        )}
      </div>
    </div>
  )
}

/**
 * PartiesPage.jsx — Clientes y Partes (RF: directorio de entidades externas).
 *
 * Búsqueda en tiempo real contra GET /parties?search= (razón social o CUIT/DNI),
 * alta y edición de personas físicas (INDIVIDUAL) y jurídicas (COMPANY)
 * con su representante, y baja lógica (DELETE → isActive=false).
 */
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  UserX,
  UsersRound,
  Building2,
  User,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import api, { getErrorMessage } from '../api/axiosConfig.js'

const FORM_VACIO = {
  legalName: '',
  taxId: '',
  entityType: 'COMPANY',
  address: '',
  email: '',
  phone: '',
  representative: '',
}

export default function PartiesPage() {
  const [parties, setParties] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modal, setModal] = useState(null) // null | { mode:'create'|'edit', data }
  const [form, setForm] = useState(FORM_VACIO)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Búsqueda con debounce: evita una request por tecla
  useEffect(() => {
    const id = setTimeout(() => {
      setLoading(true)
      api
        .get('/parties', { params: search.trim() ? { search: search.trim() } : {} })
        .then(({ data }) => setParties(data.parties))
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false))
    }, 350)
    return () => clearTimeout(id)
  }, [search])

  const abrirCrear = () => {
    setForm(FORM_VACIO)
    setFormError('')
    setModal({ mode: 'create' })
  }

  const abrirEditar = (party) => {
    setForm({
      legalName: party.legalName ?? '',
      taxId: party.taxId ?? '',
      entityType: party.entityType ?? 'COMPANY',
      address: party.address ?? '',
      email: party.email ?? '',
      phone: party.phone ?? '',
      representative: party.representative ?? '',
    })
    setFormError('')
    setModal({ mode: 'edit', id: party.id })
  }

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      // Los campos vacíos se envían como null para que el validador los acepte
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v.trim() === '' ? null : v.trim()]),
      )
      const { data } =
        modal.mode === 'create'
          ? await api.post('/parties', payload)
          : await api.put(`/parties/${modal.id}`, payload)

      setParties((prev) =>
        modal.mode === 'create'
          ? [...prev, data.party]
          : prev.map((p) => (p.id === data.party.id ? data.party : p)),
      )
      setModal(null)
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const desactivar = async (party) => {
    if (!window.confirm(`¿Desactivar a "${party.legalName}"? No podrá usarse en nuevos documentos.`))
      return
    try {
      const { data } = await api.delete(`/parties/${party.id}`)
      setParties((prev) => prev.map((p) => (p.id === data.party.id ? data.party : p)))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const activas = useMemo(() => parties.filter((p) => p.isActive), [parties])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Clientes y Partes</h1>
          <p className="text-sm text-slate-500">
            Directorio de personas físicas y jurídicas que intervienen en los documentos.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCrear}
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" /> Nueva Parte
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por razón social o CUIT/DNI…"
            className="w-full rounded-md border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500">
          {loading ? 'Buscando…' : `${activas.length} parte(s) activa(s)`}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <th className="px-4 py-3">Nombre / Razón Social</th>
              <th className="px-4 py-3">CUIT / DNI</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Representante</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && parties.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && parties.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  <UsersRound className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  No se encontraron partes{search ? ` para "${search}"` : ''}.
                </td>
              </tr>
            )}
            {parties.map((p) => (
              <tr
                key={p.id}
                className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                  p.isActive ? '' : 'opacity-50'
                }`}
              >
                <td className="px-4 py-3 font-medium text-slate-800">{p.legalName}</td>
                <td className="px-4 py-3 text-slate-600">{p.taxId}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {p.entityType === 'COMPANY' ? (
                      <Building2 className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    {p.entityType === 'COMPANY' ? 'Jurídica' : 'Física'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {p.email || p.phone ? (
                    <>
                      {p.email && <div>{p.email}</div>}
                      {p.phone && <div>{p.phone}</div>}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{p.representative || '—'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => abrirEditar(p)}
                    className="mr-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  {p.isActive && (
                    <button
                      type="button"
                      onClick={() => desactivar(p)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                    >
                      <UserX className="h-3.5 w-3.5" /> Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Modal crear / editar --- */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
          <form
            onSubmit={guardar}
            className="mt-10 w-full max-w-lg rounded-lg bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-display text-lg font-bold text-slate-900">
                {modal.mode === 'create' ? 'Nueva Parte' : 'Editar Parte'}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              {formError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <label className="block text-xs font-medium text-slate-600">
                Nombre completo / Razón Social *
                <input
                  required
                  value={form.legalName}
                  onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-600">
                  CUIT / CUIL / DNI *
                  <input
                    required
                    value={form.taxId}
                    onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                    placeholder="30-71234567-8"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Tipo de entidad *
                  <select
                    value={form.entityType}
                    onChange={(e) => setForm({ ...form, entityType: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="COMPANY">Persona jurídica</option>
                    <option value="INDIVIDUAL">Persona física</option>
                  </select>
                </label>
              </div>

              <label className="block text-xs font-medium text-slate-600">
                Domicilio legal
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Av. San Martín 1250, Rosario, Santa Fe"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-600">
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Teléfono
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </label>
              </div>

              <label className="block text-xs font-medium text-slate-600">
                Representante legal
                <input
                  value={form.representative}
                  onChange={(e) => setForm({ ...form, representative: e.target.value })}
                  placeholder="Marcos Ezequiel Ibarra, DNI 28.456.789, socio gerente"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {modal.mode === 'create' ? 'Crear Parte' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

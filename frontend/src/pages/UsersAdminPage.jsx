/**
 * UsersAdminPage.jsx — Personal del Estudio (solo ADMIN).
 *
 * GET /users para listar; POST /users para crear, PUT /users/:id para editar
 * (rol, matrícula, estado y contraseña opcional) y DELETE /users/:id para la
 * baja lógica. El backend rechaza que el ADMIN se desactive a sí mismo.
 */
import { useEffect, useState } from 'react'
import { Plus, Pencil, UserX, X, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import api, { getErrorMessage } from '../api/axiosConfig.js'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLE_LABELS } from '../constants/roles.js'

const FORM_VACIO = {
  name: '',
  email: '',
  password: '',
  role: 'ASSISTANT',
  licenseNumber: '',
}

const ROLE_STYLES = {
  ADMIN: 'border-red-200 bg-red-50 text-red-700',
  LAWYER: 'border-blue-200 bg-blue-50 text-blue-900',
  ASSISTANT: 'border-slate-200 bg-slate-50 text-slate-600',
}

export default function UsersAdminPage() {
  const { user: yo } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modal, setModal] = useState(null) // null | { mode:'create'|'edit', id? }
  const [form, setForm] = useState(FORM_VACIO)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const cargar = () =>
    api
      .get('/users')
      .then(({ data }) => setUsers(data.users))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))

  useEffect(() => {
    cargar()
  }, [])

  const abrirCrear = () => {
    setForm(FORM_VACIO)
    setFormError('')
    setModal({ mode: 'create' })
  }

  const abrirEditar = (u) => {
    setForm({
      name: u.name ?? '',
      email: u.email ?? '',
      password: '',
      role: u.role ?? 'ASSISTANT',
      licenseNumber: u.licenseNumber ?? '',
      isActive: u.isActive,
    })
    setFormError('')
    setModal({ mode: 'edit', id: u.id })
  }

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      // La contraseña es obligatoria al crear; al editar solo si se cambia
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        licenseNumber: form.licenseNumber.trim() || null,
      }
      if (form.password) payload.password = form.password
      if (modal.mode === 'edit') payload.isActive = form.isActive !== false

      if (modal.mode === 'create') {
        const { data } = await api.post('/users', payload)
        setUsers((prev) => [...prev, data.user])
      } else {
        const { data } = await api.put(`/users/${modal.id}`, payload)
        setUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)))
      }
      setModal(null)
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const desactivar = async (u) => {
    if (!window.confirm(`¿Desactivar a ${u.name}? No podrá volver a iniciar sesión.`)) return
    try {
      const { data } = await api.delete(`/users/${u.id}`)
      setUsers((prev) => prev.map((x) => (x.id === data.user.id ? data.user : x)))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Personal del Estudio</h1>
          <p className="text-sm text-slate-500">
            Alta, roles, matrículas y estado del personal. Solo visible para ADMIN.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCrear}
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" /> Nuevo Usuario
        </button>
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
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr
                key={u.id}
                className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                  u.isActive ? '' : 'opacity-50'
                }`}
              >
                <td className="px-4 py-3 font-medium text-slate-800">
                  {u.name}
                  {u.id === yo?.id && (
                    <span className="ml-2 text-[10px] font-normal text-slate-400">(vos)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      ROLE_STYLES[u.role] ?? ROLE_STYLES.ASSISTANT
                    }`}
                  >
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{u.licenseNumber || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      u.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-100 text-slate-500'
                    }`}
                  >
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => abrirEditar(u)}
                    className="mr-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  {u.isActive && u.id !== yo?.id && (
                    <button
                      type="button"
                      onClick={() => desactivar(u)}
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
          <form onSubmit={guardar} className="mt-10 w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-display text-lg font-bold text-slate-900">
                {modal.mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
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
                Nombre completo *
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </label>

              <label className="block text-xs font-medium text-slate-600">
                Email *
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-600">
                  Rol *
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="ASSISTANT">Asistente</option>
                    <option value="LAWYER">Abogado/a</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Matrícula {form.role === 'LAWYER' ? '*' : '(opcional)'}
                  <input
                    value={form.licenseNumber}
                    onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                    placeholder="T.º 12 F.º 345"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </label>
              </div>

              <label className="block text-xs font-medium text-slate-600">
                {modal.mode === 'create' ? 'Contraseña *' : 'Nueva contraseña (opcional)'}
                <input
                  type="password"
                  required={modal.mode === 'create'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </label>

              {modal.mode === 'edit' && (
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.isActive !== false}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  Usuario activo
                </label>
              )}
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
                {modal.mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

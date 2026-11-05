/**
 * Register.jsx — Registro de nuevo personal del estudio.
 *
 * Consume POST /auth/register. Roles permitidos: ASSISTANT o LAWYER
 * (las cuentas ADMIN las crea el administrador desde /users).
 * Si elige LAWYER, el campo Matrícula Profesional es obligatorio
 * (campo condicional).
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  Scale,
  User,
  Mail,
  Lock,
  IdCard,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../api/axiosConfig.js'

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'ASSISTANT',
  licenseNumber: '',
}

export default function Register() {
  const { user, loading, register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  const isLawyer = form.role === 'LAWYER'

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors([])

    // Validaciones del lado cliente (la API revalida con express-validator)
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (isLawyer && !form.licenseNumber.trim()) {
      setError('La matrícula profesional es obligatoria para el rol Abogado/a.')
      return
    }

    setSubmitting(true)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        // Solo LAWYER lleva matrícula
        licenseNumber: isLawyer ? form.licenseNumber.trim() : null,
      })
      // El registro NO inicia sesión: redirijo al login con confirmación
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (err) {
      // 422 de validateRequest → lista de {field, message}
      const details = err?.response?.data?.errors
      if (Array.isArray(details) && details.length > 0) {
        setFieldErrors(details)
      } else {
        setError(getErrorMessage(err, 'No se pudo registrar la cuenta.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <Scale className="mx-auto h-9 w-9 text-amber-600" />
          <h1 className="font-display mt-2 text-2xl font-bold text-slate-900">
            ACOSTA &amp; ASOCIADOS
          </h1>
          <p className="text-xs tracking-widest text-slate-500 uppercase">
            Registro de Personal del Estudio
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-md">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {fieldErrors.length > 0 && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <p className="mb-1 flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Corrija los siguientes campos:
              </p>
              <ul className="list-inside list-disc space-y-0.5">
                {fieldErrors.map((fe, i) => (
                  <li key={i}>
                    <span className="font-medium">{fe.field}</span>: {fe.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                Nombre completo
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej.: María González"
                  className="w-full rounded-md border border-slate-300 py-2.5 pr-3 pl-9 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="nombre@estudio.com"
                  className="w-full rounded-md border border-slate-300 py-2.5 pr-3 pl-9 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 py-2.5 pr-3 pl-9 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 py-2.5 pr-3 pl-9 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">
                Rol en el estudio
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 bg-white py-2.5 px-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
              >
                <option value="ASSISTANT">Asistente (personal administrativo)</option>
                <option value="LAWYER">Abogado/a (matriculado, puede aprobar contratos)</option>
              </select>
            </div>

            {/* Campo condicional: matrícula solo para LAWYER */}
            {isLawyer && (
              <div>
                <label htmlFor="licenseNumber" className="mb-1 block text-sm font-medium text-slate-700">
                  Matrícula profesional <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <IdCard className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    required
                    value={form.licenseNumber}
                    onChange={handleChange}
                    placeholder="Ej.: T.º 12 F.º 345"
                    className="w-full rounded-md border border-slate-300 py-2.5 pr-3 pl-9 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {submitting ? 'Registrando…' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tiene cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold text-amber-700 hover:text-amber-800 hover:underline"
          >
            Volver al ingreso
          </Link>
        </p>
      </div>
    </div>
  )
}

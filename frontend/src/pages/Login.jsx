/**
 * Login.jsx — Inicio de sesión (pantalla dividida).
 *
 * Izquierda: panel institucional "ACOSTA & ASOCIADOS — Estudio Jurídico".
 * Derecha: formulario (email + password) contra POST /auth/login.
 * Debajo: 3 botones de "Acceso Rápido (Demo)" que autocompletan e inician
 * sesión con los usuarios del seeder del backend (contraseña "123").
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import {
  Scale,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  LogIn,
  ShieldCheck,
  Briefcase,
  UserRound,
  LoaderCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../api/axiosConfig.js'

/** Usuarios del seeder para el acceso rápido de demostración. */
const DEMO_ACCOUNTS = [
  {
    label: 'Ingresar como Abogada',
    detail: 'Dra. Valeria Acosta — Mat. T.º 12 F.º 345',
    email: 'abogado@gmail.com',
    icon: Briefcase,
  },
  {
    label: 'Ingresar como Asistente',
    detail: 'Marcos Asistente',
    email: 'asistente@gmail.com',
    icon: UserRound,
  },
  {
    label: 'Ingresar como Admin',
    detail: 'Administrador del Sistema',
    email: 'admin@gmail.com',
    icon: ShieldCheck,
  },
]

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Mensaje de éxito tras registrarse en Register.jsx
  const justRegistered = location.state?.registered === true

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Ya autenticado → no tiene sentido ver el login
  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const doLogin = async (email, password) => {
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesión.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    doLogin(form.email, form.password)
  }

  /** Acceso rápido demo: autocompleta y entra con 1 clic (password "123"). */
  const handleQuickLogin = (account) => {
    setForm({ email: account.email, password: '123' })
    doLogin(account.email, '123')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* --- Panel institucional (izquierda) --- */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-slate-900 p-12 text-slate-100 lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <Scale className="h-10 w-10 text-amber-500" />
            <div>
              <h1 className="font-display text-2xl font-bold tracking-wide text-white">
                ACOSTA &amp; ASOCIADOS
              </h1>
              <p className="text-xs tracking-[0.3em] text-slate-400 uppercase">
                Estudio Jurídico
              </p>
            </div>
          </div>

          <p className="mt-16 max-w-md font-serif text-xl leading-relaxed text-slate-200 italic">
            «Seguridad documental y supervisión profesional en cada acto
            jurídico: nada se aprueba sin la firma de un abogado
            matriculado.»
          </p>

          <ul className="mt-10 space-y-4 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              Redacción asistida con validación de datos obligatorios.
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              Aprobación formal exclusiva de letrados (control de supervisión humana).
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              Repositorio institucional con exportación a PDF y formato documental.
            </li>
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          © 2026 Acosta &amp; Asociados — Rosario, Santa Fe, Argentina.
        </p>
      </div>

      {/* --- Formulario de acceso (derecha) --- */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Identidad mínima en mobile (el panel izquierdo está oculto) */}
          <div className="mb-8 text-center lg:hidden">
            <Scale className="mx-auto h-9 w-9 text-amber-600" />
            <h1 className="font-display mt-2 text-xl font-bold text-slate-900">
              ACOSTA &amp; ASOCIADOS
            </h1>
            <p className="text-xs tracking-widest text-slate-500 uppercase">
              Estudio Jurídico
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-md">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Acceso al Sistema
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingrese con sus credenciales institucionales.
            </p>

            {justRegistered && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                Cuenta creada correctamente. Inicie sesión con sus nuevas credenciales.
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-slate-300 py-2.5 pr-10 pl-9 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {submitting ? 'Verificando…' : 'Iniciar Sesión'}
              </button>
            </form>

            {/* --- Acceso Rápido (Demo) con los usuarios del seeder --- */}
            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="mb-3 text-center text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                Acceso rápido (demostración)
              </p>
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map(({ label, detail, email, icon: Icon }) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => handleQuickLogin({ email })}
                    disabled={submitting}
                    className="flex w-full items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left transition-colors hover:border-amber-300 hover:bg-amber-50/60 disabled:opacity-60"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-700">
                        {label}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {detail} · {email}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Personal nuevo del estudio?{' '}
            <Link
              to="/register"
              className="font-semibold text-amber-700 hover:text-amber-800 hover:underline"
            >
              Registrar cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

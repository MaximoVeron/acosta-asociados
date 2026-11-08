/**
 * AuthContext.jsx — Estado global de sesión.
 *
 * Expone: user, loading, login, register, logout y checkAuth.
 * El JWT vive en una cookie HttpOnly: el frontend NUNCA lo ve ni lo
 * guarda en localStorage. `checkAuth` (GET /auth/me) al montar reconstruye
 * la sesión si la cookie sigue siendo válida (p. ej. al recargar la página).
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../api/axiosConfig.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // loading = todavía no sé si hay sesión válida (checkAuth en curso)
  const [loading, setLoading] = useState(true)

  /** Reconstruye la sesión desde la cookie HttpOnly vía GET /auth/me. */
  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
    } catch {
      // 401 u otro error → no hay sesión
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  /** POST /auth/login — el backend setea la cookie; acá solo guardo el user. */
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setUser(data.user)
    return data.user
  }, [])

  /** POST /auth/register — no inicia sesión; devuelve el usuario creado. */
  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    return data.user
  }, [])

  /** POST /auth/logout — limpia la cookie en el backend y el estado local. */
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      // Aunque falle la llamada, la sesión local se descarta
      setUser(null)
    }
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Hook de acceso al contexto de autenticación. */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return context
}

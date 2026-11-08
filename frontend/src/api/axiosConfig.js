/**
 * axiosConfig.js — Instancia Axios central de la aplicación.
 *
 * withCredentials: true es OBLIGATORIO: el JWT viaja en una cookie
 * HttpOnly (`token`) que el navegador solo envía/recibe en requests
 * cross-origin si las credenciales están habilitadas (y el backend
 * responde con Access-Control-Allow-Credentials: true, ya configurado).
 */
import axios from 'axios'

const api = axios.create({
  // Permite sobreescribir con VITE_API_URL en el entorno; default local
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Extrae un mensaje de error legible de cualquier respuesta de la API.
 * Útil para mostrar errores en formularios sin repetir lógica.
 */
export const getErrorMessage = (error, fallback = 'Ocurrió un error inesperado.') => {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.code === 'ERR_NETWORK')
    return 'No se pudo conectar con el servidor. Verifique que la API esté corriendo.'
  return error?.message || fallback
}

export default api

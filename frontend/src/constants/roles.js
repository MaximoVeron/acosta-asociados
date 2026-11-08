/**
 * constants/roles.js — Etiquetas legibles de los roles del sistema.
 *
 * Vive fuera de AuthContext para que el archivo de contexto solo exporte
 * componentes (regla react-refresh) y para reutilizarlo en toda la UI.
 */
export const ROLE_LABELS = {
  ADMIN: 'Administrador',
  LAWYER: 'Abogado/a',
  ASSISTANT: 'Asistente',
}

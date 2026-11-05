/**
 * AppLayout.jsx — Estructura general de la aplicación autenticada:
 * Sidebar fijo (institucional, slate-900) + Navbar superior + contenido (Outlet).
 */
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      {/* En desktop el contenido se desplaza el ancho del sidebar fijo */}
      <div className="flex min-h-screen flex-col md:pl-64">
        <Navbar />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

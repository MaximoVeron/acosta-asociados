/**
 * App.jsx — Definición de rutas con React Router.
 *
 * Rutas públicas: /login y /register.
 * Rutas privadas: envueltas en ProtectedRoute (+ filtro por rol para /users).
 * AppLayout aporta Sidebar + Navbar a todas las vistas autenticadas.
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import HomeDashboard from './pages/HomeDashboard.jsx'
import ContractGenerator from './pages/ContractGenerator.jsx'
import ContractsPage from './pages/ContractsPage.jsx'
import ContractReview from './pages/ContractReview.jsx'
import PartiesPage from './pages/PartiesPage.jsx'
import CaseFilesPage from './pages/CaseFilesPage.jsx'
import CaseFileDetail from './pages/CaseFileDetail.jsx'
import UsersAdminPage from './pages/UsersAdminPage.jsx'

export default function App() {
  return (
    <Routes>
      {/* --- Rutas públicas --- */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* --- Rutas privadas (sesión requerida) --- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeDashboard />} />
          <Route path="/contracts/new" element={<ContractGenerator />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/contracts/:id" element={<ContractReview />} />
          <Route path="/parties" element={<PartiesPage />} />
          <Route path="/case-files" element={<CaseFilesPage />} />
          <Route path="/case-files/:id" element={<CaseFileDetail />} />

          {/* Gestión de personal: exclusivo ADMIN */}
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/users" element={<UsersAdminPage />} />
          </Route>
        </Route>
      </Route>

      {/* Cualquier otra ruta vuelve al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

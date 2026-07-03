import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { Spinner } from './components/Spinner.tsx'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { CustomerDetail } from './pages/CustomerDetail.tsx'
import { Customers } from './pages/Customers.tsx'
import { Dashboard } from './pages/Dashboard.tsx'
import { Login } from './pages/Login.tsx'
import { NewSale } from './pages/NewSale.tsx'
import { Notifications } from './pages/Notifications.tsx'
import { Products } from './pages/Products.tsx'
import { Promissories } from './pages/Promissories.tsx'
import { SaleDetail } from './pages/SaleDetail.tsx'
import { Sales } from './pages/Sales.tsx'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Spinner label="Verificando sessão…" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, isLoading } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={!isLoading && user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/clientes/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
      <Route path="/produtos" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/vendas" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
      <Route path="/vendas/nova" element={<ProtectedRoute><NewSale /></ProtectedRoute>} />
      <Route path="/vendas/:id" element={<ProtectedRoute><SaleDetail /></ProtectedRoute>} />
      <Route path="/promissorias" element={<ProtectedRoute><Promissories /></ProtectedRoute>} />
      <Route path="/notificacoes" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  )
}

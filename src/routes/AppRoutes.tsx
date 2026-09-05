import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'

import PortalPage from '../portal/PortalPage'
import PortalLoginPage from '../portal/PortalLoginPage'
import { getProfile, isPortalAuthenticated } from '../lib/portalApi'
import '../portal/portal.css'

const DatalumeApp = lazy(() => import('../projects/datalume/App'))
const AdminPage = lazy(() => import('../portal/admin/AdminPage'))

function RequirePortalAuth({ children }: { children: React.ReactNode }) {
  if (!isPortalAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  if (isPortalAuthenticated()) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'admin' | 'denied'>('loading')

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((p) => {
        if (!cancelled) setStatus(p.role === 'admin' ? 'admin' : 'denied')
      })
      .catch(() => {
        if (!cancelled) setStatus('denied')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="portal-loading">
        <span className="portal-loading-spinner" aria-hidden="true" />
        <span>Verificando permisos…</span>
      </div>
    )
  }
  if (status === 'denied') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="portal-loading">
          <span className="portal-loading-spinner" aria-hidden="true" />
          <span>Cargando proyecto…</span>
        </div>
      }
    >
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <PortalLoginPage />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/"
          element={
            <RequirePortalAuth>
              <PortalPage />
            </RequirePortalAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequirePortalAuth>
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            </RequirePortalAuth>
          }
        />
        <Route
          path="/proyectos/datalume/*"
          element={
            <RequirePortalAuth>
              <DatalumeApp />
            </RequirePortalAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
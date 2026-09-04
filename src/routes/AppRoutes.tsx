import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import PortalPage from '../portal/PortalPage'
import PortalLoginPage from '../portal/PortalLoginPage'
import { isPortalAuthenticated } from '../lib/portalApi'

const DatalumeApp = lazy(() => import('../projects/datalume/App'))

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

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="portal-loading">Cargando proyecto…</div>}>
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
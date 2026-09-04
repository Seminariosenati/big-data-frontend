import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import PortalPage from '../portal/PortalPage'

const DatalumeApp = lazy(() => import('../projects/datalume/App'))

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="portal-loading">Cargando proyecto…</div>}>
      <Routes>
        <Route path="/" element={<PortalPage />} />
        <Route path="/proyectos/datalume/*" element={<DatalumeApp />} />
      </Routes>
    </Suspense>
  )
}
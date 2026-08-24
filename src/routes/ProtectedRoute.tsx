import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { clearSession, getSession, validateSession } from '../lib/api'

export default function ProtectedRoute() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (!getSession()) {
      setAuthorized(false)
      return
    }

    validateSession()
      .then(() => setAuthorized(true))
      .catch(() => {
        clearSession()
        setAuthorized(false)
      })
  }, [])

  if (authorized === null) {
    return <div className="route-loading">Validando sesión...</div>
  }

  return authorized ? <Outlet /> : <Navigate to="/login" replace />
}
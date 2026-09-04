const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const SESSION_KEY = 'portal_session'

export interface AuthSession {
  access_token: string
  refresh_token: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail || data.error || data.message || 'Ocurrió un error inesperado')
  }
  return data as T
}

export function portalLogin(email: string) {
  return request<{ message: string; email: string; requiresOtp: true; otpDestination: string }>(
    '/auth/portal/login',
    { method: 'POST', body: JSON.stringify({ email }) },
  )
}

export function portalVerifyOtp(email: string, code: string) {
  return request<{ message: string; session: AuthSession }>('/auth/portal/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
}

export function portalResendOtp(email: string) {
  return request<{ message: string }>('/auth/portal/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function savePortalSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.setItem('datalume_session', JSON.stringify(session))
}

export function getPortalSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY) || localStorage.getItem('datalume_session')
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as AuthSession
    return session.access_token && session.refresh_token ? session : null
  } catch {
    return null
  }
}

export function clearPortalSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('datalume_session')
}

export function isPortalAuthenticated(): boolean {
  return getPortalSession() !== null
}
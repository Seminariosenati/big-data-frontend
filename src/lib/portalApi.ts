const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const SESSION_KEY = 'portal_session'

export interface AuthSession {
  access_token: string
  refresh_token: string
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefreshPortalSession(): Promise<boolean> {
  const session = getPortalSession()
  if (!session) return false

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    })
      .then(async (res) => {
        if (!res.ok) return false
        const data = await res.json().catch(() => null)
        if (!data?.session?.access_token || !data?.session?.refresh_token) return false
        savePortalSession(data.session)
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 401 && !isRetry && getPortalSession() && path !== '/auth/refresh') {
    const refreshed = await tryRefreshPortalSession()
    if (refreshed) {
      return request<T>(path, { ...options, headers: { ...options.headers, ...authHeaders() } }, true)
    }
    clearPortalSession()
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail || data.error || data.message || 'Ocurrió un error inesperado')
  }
  return data as T
}

export interface PortalLoginResponse {
  message: string
  email: string
  requiresOtp: boolean
  otpDestination?: string
  session?: AuthSession
}

export function portalLogin(email: string) {
  return request<PortalLoginResponse>('/auth/portal/login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
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
  const raw = localStorage.getItem(SESSION_KEY)
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

export function authHeaders(): Record<string, string> {
  const session = getPortalSession()
  return session ? { Authorization: `Bearer ${session.access_token}` } : {}
}

export interface PortalProfile {
  id: string
  email: string
  full_name?: string | null
  role?: string | null
  company?: string | null
}

export function getProfile() {
  return request<PortalProfile>('/profile/me', {
    method: 'GET',
    headers: authHeaders(),
  })
}

export function isPortalAuthenticated(): boolean {
  return getPortalSession() !== null
}

export interface PortalProject {
  id: string
  slug: string
  name: string
  description: string
  path: string
  tag: string
  accent: 'primary' | 'secondary'
  sort_order: number
}

export function getProjects() {
  return request<PortalProject[]>('/projects', {
    method: 'GET',
    headers: authHeaders(),
  })
}

export interface ProjectRequestInput {
  name: string
  description?: string
  contact_email: string
}

export function requestNewProject(input: ProjectRequestInput) {
  return request<{ id: string }>('/projects/requests', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  })
}

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------
export interface AdminInvitation {
  id: string
  email: string
  project_id: string
  type: string
  expires_at: string
  used: boolean
  created_at: string
  projects?: { name: string }
}

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: string
  company: string | null
  project_access: { project_id: string; project_name: string | null; role: string }[]
}

export function getAdminUsers() {
  return request<AdminUser[]>('/admin/users', { method: 'GET', headers: authHeaders() })
}

export function updateAdminUser(
  userId: string,
  input: { role?: string; project_access?: { project_id: string; role: string }[] }
) {
  return request<{ message: string }>(`/admin/users/${userId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(input),
  })
}

export function deleteAdminUser(userId: string) {
  return request<void>(`/admin/users/${userId}`, { method: 'DELETE', headers: authHeaders() })
}

export function getAdminInvitations() {
  return request<AdminInvitation[]>('/admin/invitations', { method: 'GET', headers: authHeaders() })
}

export interface CreateInvitationInput {
  email: string
  project_ids: string[]
  expires_days?: number
}

export function createAdminInvitation(input: CreateInvitationInput) {
  return request<AdminInvitation[]>('/admin/invitations', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  })
}

export function revokeAdminInvitation(id: string) {
  return request<void>(`/admin/invitations/${id}`, { method: 'DELETE', headers: authHeaders() })
}
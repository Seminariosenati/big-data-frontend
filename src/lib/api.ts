const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

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

export interface AuthSession {
    access_token: string
    refresh_token: string
}

export function registerUser(input: {
    fullName: string
    email: string
    company?: string
    password: string
}) {
    return request<{ message: string; userId: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
    })
}

export function loginUser(input: { email: string; password: string }) {
    return request<{ message: string; email: string; requiresOtp: true }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
    })
}

export function verifyOtp(input: { email: string; code: string }) {
    return request<{ message: string; session: AuthSession }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify(input),
    })
}

export function resendOtp(input: { email: string }) {
    return request<{ message: string }>('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify(input),
    })
}

export function validateSession() {
    return request<{ id?: string; email?: string }>('/profile/me', { headers: authHeaders() })
}

export interface DatasetColumnSummary {
    name: string
    dtype: string
    null_count: number
    null_pct: number
    unique_count: number
    mean?: number
    std?: number
    min?: number
    max?: number
}

export interface Dataset {
    id: string
    file_name: string
    row_count: number
    column_count: number
    null_count: number
    duplicate_count: number
    quality_score: number
    status: 'processing' | 'ok' | 'warn' | 'error'
    columns_summary: DatasetColumnSummary[]
    created_at: string
}

function authHeaders(): Record<string, string> {
    const session = getSession()
    return session ? { Authorization: `Bearer ${session.access_token}` } : {}
}

export async function uploadDataset(file: File) {
    const session = getSession()
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${API_URL}/datasets/upload`, {
        method: 'POST',
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: formData,
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.detail || 'No se pudo subir el archivo')
    return data as { message: string; dataset: Dataset; analysis: unknown }
}

export function listDatasets() {
    return request<{ datasets: Dataset[] }>('/datasets', { headers: authHeaders() })
}

export function getDashboardStats() {
    return request<{
        totalRows: number
        totalFiles: number
        totalErrors: number
        qualityBreakdown: { ok: number; warn: number; error: number }
    }>('/datasets/stats', { headers: authHeaders() })
}

const SESSION_KEY = 'datalume_session'

export function saveSession(session: AuthSession) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSession(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null

    try {
        const session = JSON.parse(raw) as AuthSession
        return session.access_token && session.refresh_token ? session : null
    } catch {
        clearSession()
        return null
    }
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY)
}

export interface DatasetPreview {
    fileName: string
    columns: string[]
    totalRows: number
    rows: Record<string, unknown>[]
}

export function getDatasetPreview(id: string) {
    return request<DatasetPreview>(`/datasets/${id}/preview`, { headers: authHeaders() })
}
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

export interface Profile {
    id: string
    email: string
    full_name: string | null
    company: string | null
    phone: string | null
    role: string | null
}

export function getMyProfile() {
    return request<Profile>('/profile/me', { headers: authHeaders() })
}

export function updateMyProfile(input: { full_name?: string; company?: string; phone?: string; role?: string }) {
    return request<Profile>('/profile/me', {
        method: 'PUT',
        headers: authHeaders(),
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
    summary?: {
        duplicatesRemoved: number
        emptyRowsRemoved: number
        columnsRemoved: string[]
        nullsFilled: number
    }
}

export interface CleaningOptions {
    remove_duplicates: boolean
    null_strategy: 'ignore' | 'remove_row' | 'set_null' | 'zero' | 'average'
    convert_number: boolean
    convert_dates: boolean
    remove_empty_columns: boolean
}

export interface CleaningLog {
    id: string
    action: 'duplicate_removed' | 'empty_row_removed' | 'column_removed' | 'nulls_filled'
    row_data: Record<string, unknown>
    created_at: string
}

export function getCleaningLogs(id: string) {
    return request<{ logs: CleaningLog[] }>(`/datasets/${id}/cleaning-logs`, { headers: authHeaders() })
}

export function getDatasetPreview(id: string) {
    return request<DatasetPreview>(`/datasets/${id}/preview`, { headers: authHeaders() })
}

export function previewCleanDataset(id: string, options: CleaningOptions) {
    return request<DatasetPreview>(`/datasets/${id}/clean-preview`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(options),
    })
}

export function applyCleanDataset(id: string, options: CleaningOptions) {
    return request<DatasetPreview>(`/datasets/${id}/clean`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(options),
    })
}
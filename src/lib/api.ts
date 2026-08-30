const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

let refreshPromise: Promise<boolean> | null = null

// Intenta renovar el access token usando el refresh token guardado.
// Se comparte una sola promesa entre llamadas concurrentes para no
// disparar varios /auth/refresh en paralelo si varios requests fallan
// con 401 al mismo tiempo.
async function tryRefreshSession(): Promise<boolean> {
    const session = getSession()
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
                saveSession(data.session)
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

    if (res.status === 401 && !isRetry && getSession() && path !== '/auth/refresh') {
        const refreshed = await tryRefreshSession()
        if (refreshed) {
            return request<T>(path, { ...options, headers: { ...options.headers, ...authHeaders() } }, true)
        }
        clearSession()
    }

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

// Vista previa de la versión YA LIMPIA (no el archivo tal como se subió).
// La usa el Dashboard, que debe mostrar datos después de la limpieza.
export function getCleanedDatasetPreview(id: string) {
    return request<DatasetPreview>(`/datasets/${id}/cleaned-preview`, { headers: authHeaders() })
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

export interface ChartColumn {
    name: string
    type: 'numeric' | 'categorical'
}

export interface ChartColumnData {
    column: string
    type: 'numeric' | 'categorical'
    data: { label: string; value: number }[]
}

export function getChartColumns() {
    return request<{ columns: ChartColumn[] }>('/datasets/charts/columns', { headers: authHeaders() })
}

export function getChartColumnData(column: string) {
    return request<ChartColumnData>(`/datasets/charts/data?column=${encodeURIComponent(column)}`, {
        headers: authHeaders(),
    })
}

// Variantes "por dataset": el gráfico del dashboard usa estas para mostrar
// solo los datos del archivo que el usuario tiene seleccionado, en vez de
// agregar todos sus datasets limpios.
export function getChartColumnsForDataset(datasetId: string) {
    return request<{ columns: ChartColumn[] }>(`/datasets/${datasetId}/charts/columns`, {
        headers: authHeaders(),
    })
}

export function getChartColumnDataForDataset(datasetId: string, column: string) {
    return request<ChartColumnData>(`/datasets/${datasetId}/charts/data?column=${encodeURIComponent(column)}`, {
        headers: authHeaders(),
    })
}

export interface SalesSummary {
    sales_column: string
    date_column: string | null
    category_column: string | null
    total_sales: number
    avg_ticket: number
    row_count: number
    top_category: { name: string; total: number } | null
    monthly: { month: string; total: number }[]
    trend_pct: number | null
}

export function getSalesSummaryForDataset(datasetId: string) {
    return request<SalesSummary>(`/datasets/${datasetId}/sales-summary`, {
        headers: authHeaders(),
    })
}

// Variantes "sin limpiar": usan el archivo tal como se subió (con nulos,
// duplicados y valores mal formateados), para la pestaña de gráficos de
// "Cargar datos".
export function getRawChartColumnsForDataset(datasetId: string) {
    return request<{ columns: ChartColumn[] }>(`/datasets/${datasetId}/charts/raw/columns`, {
        headers: authHeaders(),
    })
}

export function getRawChartColumnDataForDataset(datasetId: string, column: string) {
    return request<ChartColumnData>(`/datasets/${datasetId}/charts/raw/data?column=${encodeURIComponent(column)}`, {
        headers: authHeaders(),
    })
}

// ---------------------------------------------------------------------
// Comparación con otra farmacia/botica (módulo Ventas)
// El CSV que se sube aquí NUNCA se guarda: el backend lo lee en memoria,
// lo compara contra tu dataset ya limpio, y descarta el archivo al
// responder. No aparece en "Cargar datos" ni en ningún listado.
// ---------------------------------------------------------------------
export interface CompareRecommendation {
    column: string
    impact_pct: number | null
    message: string
}

export interface CompareResult {
    own_columns: string[]
    other_columns: string[]
    extra_columns: string[]
    sales_column_detected: string | null
    recommendations: CompareRecommendation[]
    ownFileName: string
    comparedFileName: string
}

export async function compareDataset(datasetId: string, file: File) {
    const session = getSession()
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${API_URL}/datasets/${datasetId}/compare`, {
        method: 'POST',
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: formData,
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.detail || 'No se pudo comparar el archivo')
    return data as CompareResult
}

// ---------------------------------------------------------------------
// Permisos del rol "analyst" — qué secciones del panel puede ver.
// Se guardan en el backend (tabla analyst_permissions), ligados al admin
// dueño del sistema. Un analista los lee en modo solo lectura; el admin
// puede editarlos y guardarlos.
// ---------------------------------------------------------------------
export interface AnalystPermissions {
    ventas: boolean
    ventas_resumen: boolean
    ventas_clientes: boolean
    ventas_comparacion: boolean
    cargar: boolean
    explorar: boolean
    reportes: boolean
}

export const DEFAULT_ANALYST_PERMISSIONS: AnalystPermissions = {
    ventas: true,
    ventas_resumen: true,
    ventas_clientes: true,
    ventas_comparacion: true,
    cargar: false,
    explorar: false,
    reportes: true,
}

export function getAnalystPermissions() {
    return request<AnalystPermissions & { user_id: string }>('/settings/analyst-permissions', {
        headers: authHeaders(),
    })
}

// ---------------------------------------------------------------------
// Gestión de cuentas de analista (solo admin). Cada analista tiene su
// propia fila de permisos individuales.
// ---------------------------------------------------------------------
export interface Analyst {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    created_at: string
    permissions: AnalystPermissions
}

export function listAnalysts() {
    return request<Analyst[]>('/users', { headers: authHeaders() })
}

export function createAnalyst(input: { fullName: string; email: string; password: string }) {
    return request<{ id: string; email: string; permissions: AnalystPermissions }>('/users', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(input),
    })
}

export function updateAnalystPermissions(analystId: string, permissions: AnalystPermissions) {
    return request<AnalystPermissions>(`/users/${analystId}/permissions`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(permissions),
    })
}

export function deleteAnalyst(analystId: string) {
    return request<void>(`/users/${analystId}`, {
        method: 'DELETE',
        headers: authHeaders(),
    })
}

export interface AnalystDatasetAccess {
    id: string
    file_name: string
    allowed: boolean
}

export function listAnalystDatasetAccess(analystId: string) {
    return request<AnalystDatasetAccess[]>(`/users/${analystId}/datasets`, {
        headers: authHeaders(),
    })
}

export function updateAnalystDatasetAccess(analystId: string, datasetIds: string[]) {
    return request<{ dataset_ids: string[] }>(`/users/${analystId}/datasets`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ dataset_ids: datasetIds }),
    })
}
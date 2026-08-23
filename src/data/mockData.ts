// Datos estáticos únicamente para propósitos visuales (vista/maqueta).
// No provienen de ningún backend ni base de datos real todavía.

export const statCards = [
  { label: 'Registros procesados', value: '128,942', hint: '+12.4% esta semana', tone: 'amber', trend: 'up' as const },
  { label: 'Archivos cargados', value: '46', hint: '+5 nuevos hoy', tone: 'blue', trend: 'up' as const },
  { label: 'Datos con errores', value: '312', hint: '-3.1% vs. ayer', tone: 'coral', trend: 'down' as const },
  { label: 'Reportes generados', value: '18', hint: '+2 esta semana', tone: 'green', trend: 'up' as const },
]

export const monthlyVolume = [
  { label: 'Ene', value: 40 },
  { label: 'Feb', value: 55 },
  { label: 'Mar', value: 48 },
  { label: 'Abr', value: 70 },
  { label: 'May', value: 62 },
  { label: 'Jun', value: 85 },
  { label: 'Jul', value: 78 },
]

export const qualityBreakdown = [
  { label: 'Datos válidos', value: 74, color: 'var(--success)' },
  { label: 'Con advertencias', value: 18, color: 'var(--primary)' },
  { label: 'Con errores', value: 8, color: 'var(--danger)' },
]

export type DatasetStatus = 'ok' | 'warn' | 'error'

export const datasetPreview: Array<{
  id: string
  archivo: string
  empresa: string
  filas: string
  estado: DatasetStatus
  fecha: string
}> = [
  { id: '1', archivo: 'ventas_q3.csv', empresa: 'Norte Retail', filas: '12,480', estado: 'ok', fecha: '18 ago 2026' },
  { id: '2', archivo: 'clientes_activos.csv', empresa: 'Vertex Labs', filas: '8,214', estado: 'ok', fecha: '17 ago 2026' },
  { id: '3', archivo: 'inventario_agosto.csv', empresa: 'Norte Retail', filas: '5,032', estado: 'warn', fecha: '15 ago 2026' },
  { id: '4', archivo: 'logs_sensores.csv', empresa: 'Cronos Industrial', filas: '41,908', estado: 'error', fecha: '14 ago 2026' },
  { id: '5', archivo: 'encuestas_satisfaccion.csv', empresa: 'Vertex Labs', filas: '2,145', estado: 'ok', fecha: '12 ago 2026' },
]

export const recentUploads = [
  { name: 'ventas_q3.csv', size: '4.2 MB', progress: 100 },
  { name: 'clientes_activos.csv', size: '2.8 MB', progress: 100 },
  { name: 'inventario_agosto.csv', size: '1.1 MB', progress: 64 },
]

export const reports = [
  { title: 'Resumen mensual de ventas', date: '18 ago 2026', size: '1.4 MB' },
  { title: 'Calidad de datos — Vertex Labs', date: '15 ago 2026', size: '820 KB' },
  { title: 'Auditoría de inventario', date: '10 ago 2026', size: '2.1 MB' },
  { title: 'Segmentación de clientes', date: '3 ago 2026', size: '990 KB' },
]

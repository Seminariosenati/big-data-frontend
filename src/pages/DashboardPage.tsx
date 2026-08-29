import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileBarChart2, Database, FileSpreadsheet, Table2 } from 'lucide-react'
import DashboardLayout, { type DashboardSection } from '../layouts/DashboardLayout'
import StatCard from '../components/dashboard/StatCard'
import BarChartCard from '../components/dashboard/BarChartCard'
import DonutChartCard from '../components/dashboard/DonutChartCard'
import CleanedDataChartCard from '../components/dashboard/CleanedDataChartCard'
import RecordsTablePreview from '../components/dashboard/RecordsTablePreview'
import UploadZone from '../components/dashboard/UploadZone'
import EmptyState from '../components/dashboard/EmptyState'
import DataCleaningPanel from '../components/dashboard/DataCleaningPanel'
import SettingsPage from './SettingsPage'
import { useDatasets } from '../lib/useDatasets'
import { clearSession, getMyProfile, type Profile } from '../lib/api'

const SECTION_META: Record<DashboardSection, { title: string; subtitle: string }> = {
  resumen: { title: 'Dashboard', subtitle: 'Vista general de tus datos procesados' },
  cargar: { title: 'Cargar datos', subtitle: 'Sube nuevos archivos a la plataforma' },
  explorar: { title: 'Limpieza de datos', subtitle: 'Revisa los conjuntos de datos cargados' },
  reportes: { title: 'Reportes', subtitle: 'Descarga los resúmenes generados' },
  ajustes: { title: 'Ajustes', subtitle: 'Preferencias de tu cuenta y del panel' },
}

export default function DashboardPage() {
  const [section, setSection] = useState<DashboardSection>('resumen')
  const [isLight, setIsLight] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const navigate = useNavigate()
  const { datasets, stats, loading, error, refresh } = useDatasets()

  // Dataset activo compartido entre "Registros" y el gráfico "Datos limpios
  // por columna": cambiarlo en cualquiera de los dos actualiza ambos.
  const [selectedDatasetId, setSelectedDatasetId] = useState('')
  const activeDatasetId = selectedDatasetId || datasets[0]?.id || ''

  useEffect(() => {
    getMyProfile().then(setProfile).catch(() => { })
  }, [])

  const meta = SECTION_META[section]

  const statCards = [
    {
      label: 'Registros procesados',
      value: (stats?.totalRows ?? 0).toLocaleString('es-PE'),
      hint: 'Total acumulado',
      tone: 'amber' as const,
      icon: FileBarChart2,
    },
    {
      label: 'Archivos cargados',
      value: String(stats?.totalFiles ?? 0),
      hint: 'Total de archivos',
      tone: 'blue' as const,
      icon: Database,
    },
    {
      label: 'Datos con problemas',
      value: (stats?.totalErrors ?? 0).toLocaleString('es-PE'),
      hint: 'Nulos + duplicados',
      tone: 'coral' as const,
      icon: Table2,
    },
    {
      label: 'Archivos válidos',
      value: String(stats?.qualityBreakdown.ok ?? 0),
      hint: 'Calidad ≥ 90%',
      tone: 'green' as const,
      icon: FileSpreadsheet,
    },
  ]

  return (
    <div data-theme={isLight ? 'light' : 'dark'}>
      <DashboardLayout
        active={section}
        onNavigate={setSection}
        title={meta.title}
        subtitle={meta.subtitle}
        isLight={isLight}
        onToggleTheme={() => setIsLight((v) => !v)}
        userEmail={profile?.email}
        userName={profile?.full_name ?? undefined}
        onLogout={() => {
          clearSession()
          navigate('/')
        }}
      >
        {error && <div className="form-alert error">{error}</div>}

        {section === 'resumen' && (
          <>
            <div className="stat-grid">
              {statCards.map((card) => (
                <StatCard
                  key={card.label}
                  icon={card.icon}
                  label={card.label}
                  value={card.value}
                  hint={card.hint}
                  tone={card.tone}
                  trend="up"
                />
              ))}
            </div>

            <div className="chart-grid">
              <BarChartCard datasets={datasets} />
              <DonutChartCard
                ok={stats?.qualityBreakdown.ok ?? 0}
                warn={stats?.qualityBreakdown.warn ?? 0}
                error={stats?.qualityBreakdown.error ?? 0}
              />
            </div>

            <CleanedDataChartCard
              datasets={datasets}
              selectedId={activeDatasetId}
              refreshKey={datasets.length}
            />

            <RecordsTablePreview
              datasets={datasets}
              loading={loading}
              selectedId={activeDatasetId}
              onSelectId={setSelectedDatasetId}
            />
          </>
        )}

        {section === 'cargar' && (
          <UploadZone
            datasets={datasets}
            datasetsLoading={loading}
            onUploaded={refresh}
            onGoToClean={() => setSection('explorar')}
          />
        )}

        {section === 'explorar' && <DataCleaningPanel datasets={datasets} loading={loading} onGoToUpload={() => setSection('cargar')} onCleaned={refresh} />}

        {section === 'reportes' && (
          <div className="report-grid">
            <EmptyState
              icon={FileBarChart2}
              title="Los reportes llegan en la próxima etapa"
              description="Por ahora puedes ver el detalle de calidad de cada archivo en 'Limpieza de datos'. Los reportes descargables se conectarán próximamente."
              action={<button className="btn btn-outline" onClick={() => setSection('explorar')}>Ver datasets</button>}
            />
          </div>
        )}

        {section === 'ajustes' && <SettingsPage isLight={isLight} onToggleTheme={() => setIsLight((v) => !v)} totalRows={stats?.totalRows ?? 0} totalFiles={stats?.totalFiles ?? 0} />}
      </DashboardLayout>
    </div>
  )
}
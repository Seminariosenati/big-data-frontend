import { BarChart3, TrendingUp } from 'lucide-react'
import { useChartView } from '../../lib/chartViewContext'

export default function ChartViewToggle() {
  const { view, setView } = useChartView()

  return (
    <div className="chart-view-toggle" role="group" aria-label="Cambiar tipo de visualización de gráficos">
      <button
        type="button"
        className={`chart-view-opt ${view === 'bar' ? 'active' : ''}`}
        onClick={() => setView('bar')}
        aria-pressed={view === 'bar'}
        title="Ver gráficos de barras"
      >
        <BarChart3 size={15} />
      </button>
      <button
        type="button"
        className={`chart-view-opt ${view === 'area' ? 'active' : ''}`}
        onClick={() => setView('area')}
        aria-pressed={view === 'area'}
        title="Ver gráficos de área"
      >
        <TrendingUp size={15} />
      </button>
    </div>
  )
}

import { BarChart3, TrendingUp } from 'lucide-react'
import { useChartView } from '../../lib/chartView'

export default function ChartViewToggle() {
  const { view, toggle } = useChartView()

  return (
    <div className="chart-view-toggle" role="group" aria-label="Cambiar tipo de visualización de gráficos">
      <button
        type="button"
        className={`chart-view-opt ${view === 'bar' ? 'active' : ''}`}
        onClick={() => view !== 'bar' && toggle()}
        aria-pressed={view === 'bar'}
        title="Ver gráficos de barras"
      >
        <BarChart3 size={15} />
      </button>
      <button
        type="button"
        className={`chart-view-opt ${view === 'area' ? 'active' : ''}`}
        onClick={() => view !== 'area' && toggle()}
        aria-pressed={view === 'area'}
        title="Ver gráficos de área"
      >
        <TrendingUp size={15} />
      </button>
    </div>
  )
}

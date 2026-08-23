interface DonutChartCardProps {
  ok: number
  warn: number
  error: number
}

export default function DonutChartCard({ ok, warn, error }: DonutChartCardProps) {
  const total = ok + warn + error
  const pctOk = total > 0 ? Math.round((ok / total) * 100) : 0

  const breakdown = [
    { label: 'Archivos válidos', value: ok, color: 'var(--success)' },
    { label: 'Con advertencias', value: warn, color: 'var(--primary)' },
    { label: 'Con errores', value: error, color: 'var(--danger)' },
  ]

  let acc = 0
  const stops = breakdown
    .map((slice) => {
      const sliceValue = total > 0 ? (slice.value / total) * 100 : 0
      const start = acc
      acc += sliceValue
      return `${slice.color} ${start}% ${acc}%`
    })
    .join(', ')

  return (
    <div className="panel-card">
      <div className="panel-title">Calidad de los datos</div>
      <div className="panel-subtitle">Distribución de todos tus archivos cargados</div>
      <div className="donut-wrap">
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: '50%',
            background: total > 0 ? `conic-gradient(${stops})` : 'var(--border)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: '50%',
              background: 'var(--panel)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <span className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{pctOk}%</span>
            <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>válidos</span>
          </div>
        </div>

        <div className="donut-legend">
          {breakdown.map((slice) => (
            <div className="donut-legend-item" key={slice.label}>
              <span className="donut-dot" style={{ background: slice.color }} />
              {slice.label}
              <strong>{slice.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
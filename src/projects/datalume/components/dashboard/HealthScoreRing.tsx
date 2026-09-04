interface HealthScoreRingProps {
  score: number
  size?: number
  stroke?: number
  label?: string
}

function scoreColor(score: number): string {
  if (score < 50) return 'var(--danger)'
  if (score < 80) return 'var(--primary)'
  return 'var(--success)'
}

function scoreTone(score: number): 'danger' | 'warn' | 'ok' {
  if (score < 50) return 'danger'
  if (score < 80) return 'warn'
  return 'ok'
}

export default function HealthScoreRing({ score, size = 132, stroke = 12, label = 'Health Score' }: HealthScoreRingProps) {
  const normalized = Math.min(100, Math.max(0, Math.round(score)))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (normalized / 100) * circumference
  const color = scoreColor(normalized)
  const tone = scoreTone(normalized)

  return (
    <div className={`health-ring health-ring-${tone}`}>
      <svg width={size} height={size} role="img" aria-label={`${label}: ${normalized}%`}>
        <circle
          className="health-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="health-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="health-ring-center">
        <strong>{normalized}</strong>
        <span>/100</span>
        <small>{label}</small>
      </div>
    </div>
  )
}

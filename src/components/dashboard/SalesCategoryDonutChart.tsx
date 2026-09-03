import { memo, useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface SalesCategoryDonutChartProps {
    categories: { name: string; total: number }[] | null
    loading: boolean
    fileName?: string
    categoryColumnName: string | null
    /** Etiqueta del periodo actual (ej. "Todos los meses", "feb 26", "14 feb"),
     * para que el subtítulo quede claro sobre a qué corresponde la dona. */
    periodLabel: string
}

const COLORS = ['#f59e0b', '#fb923c', '#f97316', '#fbbf24', '#fde68a', '#d97706', '#ea580c', '#eab308']

const formatMoney = (value: number) =>
    value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

function CustomTooltip({ active, payload, total }: { active?: boolean; payload?: Array<{ name?: string; value?: number }>; total: number }) {
    if (!active || !payload || payload.length === 0) return null
    const item = payload[0]
    const value = item.value ?? 0
    const pct = total > 0 ? (value / total) * 100 : 0
    return (
        <div className="sales-area-tooltip">
            <strong>{item.name}</strong>
            <span> · S/ {formatMoney(value)} · {pct.toFixed(1)}%</span>
        </div>
    )
}

export default memo(function SalesCategoryDonutChart({
    categories,
    loading,
    fileName,
    categoryColumnName,
    periodLabel,
}: SalesCategoryDonutChartProps) {
    // Máximo 7 categorías visibles + "Otros" agrupado, para que la leyenda
    // no se desborde si hay muchas categorías distintas.
    const data = useMemo(() => {
        if (!categories || categories.length === 0) return []
        const sorted = [...categories].sort((a, b) => b.total - a.total)
        const top = sorted.slice(0, 7)
        const rest = sorted.slice(7)
        const restTotal = rest.reduce((sum, c) => sum + c.total, 0)
        return restTotal > 0 ? [...top, { name: 'Otros', total: restTotal }] : top
    }, [categories])

    const grandTotal = useMemo(() => data.reduce((sum, d) => sum + d.total, 0), [data])

    return (
        <div className="panel-card">
            <div className="panel-title" style={{ marginBottom: 2 }}>Ventas por categoría</div>
            <div className="panel-subtitle" style={{ marginBottom: 0 }}>
                {categoryColumnName
                    ? `${periodLabel} · ${fileName ?? ''}`
                    : 'No se detectó una columna de categoría en este dataset'}
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>Cargando…</div>
            )}

            {!loading && categoryColumnName && data.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>
                    No hay ventas registradas para este periodo
                </div>
            )}

            {!loading && data.length > 0 && (
                <div style={{ marginTop: 8 }}>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="total"
                                nameKey="name"
                                innerRadius={60}
                                outerRadius={95}
                                paddingAngle={2}
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip total={grandTotal} />} />
                            <Legend
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
})
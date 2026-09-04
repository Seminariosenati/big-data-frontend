import { useCallback, useEffect, useState } from 'react'
import { listDatasets, getDashboardStats, type Dataset } from './api'

interface DashboardStats {
    totalRows: number
    totalFiles: number
    totalErrors: number
    qualityBreakdown: { ok: number; warn: number; error: number }
}

export function useDatasets() {
    const [datasets, setDatasets] = useState<Dataset[]>([])
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [datasetsRes, statsRes] = await Promise.all([listDatasets(), getDashboardStats()])
            setDatasets(datasetsRes.datasets)
            setStats(statsRes)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    return { datasets, stats, loading, error, refresh }
}
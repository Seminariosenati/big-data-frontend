import { createContext, useContext } from 'react'

export type ChartView = 'bar' | 'area'

export interface ChartViewContextValue {
  view: ChartView
  setView: (view: ChartView) => void
  toggle: () => void
}

export const ChartViewContext = createContext<ChartViewContextValue | null>(null)

export function useChartView(): ChartViewContextValue {
  const ctx = useContext(ChartViewContext)
  if (!ctx) {
    throw new Error('useChartView debe usarse dentro de <ChartViewProvider>')
  }
  return ctx
}

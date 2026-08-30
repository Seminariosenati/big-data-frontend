import { createContext, useContext, useState, type ReactNode } from 'react'

export type ChartView = 'bar' | 'area'

interface ChartViewContextValue {
  view: ChartView
  setView: (view: ChartView) => void
  toggle: () => void
}

const ChartViewContext = createContext<ChartViewContextValue | null>(null)

export function ChartViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ChartView>('bar')

  const toggle = () => setView((v) => (v === 'bar' ? 'area' : 'bar'))

  return (
    <ChartViewContext.Provider value={{ view, setView, toggle }}>
      {children}
    </ChartViewContext.Provider>
  )
}

export function useChartView(): ChartViewContextValue {
  const ctx = useContext(ChartViewContext)
  if (!ctx) {
    throw new Error('useChartView debe usarse dentro de <ChartViewProvider>')
  }
  return ctx
}

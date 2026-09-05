import { useState, type ReactNode } from 'react'
import { ChartViewContext, type ChartView } from './chartViewContext'

export function ChartViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ChartView>('bar')

  const toggle = () => setView((v) => (v === 'bar' ? 'area' : 'bar'))

  return (
    <ChartViewContext.Provider value={{ view, setView, toggle }}>
      {children}
    </ChartViewContext.Provider>
  )
}

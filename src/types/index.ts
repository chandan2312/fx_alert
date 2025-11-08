export interface Alert {
  id: number
  symbol: string
  price: number
  type: 'crossing_up' | 'crossing_down'
  isActive: boolean
}

export type SymbolLabel = 'Live' | 'Super' | 'Good' | 'Bad' | 'Formation' | 'Other'

export interface Symbol {
  value: string
  label: string
  api_symbol: string
  tv_symbol: string
  category?: SymbolLabel
}
'use client'

import { Symbol, SymbolLabel } from '../types'

interface SymbolItemProps {
  symbol: Symbol
  isSelected: boolean
  onSelect: (symbol: string) => void
  onLabelChange: (symbol: string, label: SymbolLabel) => void
  onAddAlert: (symbol: string) => void
}

const labelColors: Record<SymbolLabel, string> = {
  'Live': 'bg-red-100 text-red-800 border-red-300',
  'Super': 'bg-purple-100 text-purple-800 border-purple-300',
  'Good': 'bg-green-100 text-green-800 border-green-300',
  'Bad': 'bg-gray-100 text-gray-800 border-gray-300',
  'Formation': 'bg-blue-100 text-blue-800 border-blue-300',
  'Other': 'bg-yellow-100 text-yellow-800 border-yellow-300'
}

const labelOrder: SymbolLabel[] = ['Live', 'Super', 'Good', 'Bad', 'Formation', 'Other']

export default function SymbolItem({ 
  symbol, 
  isSelected, 
  onSelect, 
  onLabelChange,
  onAddAlert 
}: SymbolItemProps) {
  const category = symbol.category || 'Other'
  
  return (
    <div 
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(symbol.value)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-800">{symbol.label}</h3>
        <select
          value={category}
          onChange={(e) => {
            e.stopPropagation()
            onLabelChange(symbol.value, e.target.value as SymbolLabel)
          }}
          className={`text-xs px-2 py-1 rounded border ${labelColors[category]} cursor-pointer`}
          onClick={(e) => e.stopPropagation()}
        >
          {labelOrder.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          onAddAlert(symbol.value)
        }}
        className="w-full text-sm px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
      >
        + Add Alert
      </button>
    </div>
  )
}

interface SymbolListProps {
  symbols: Symbol[]
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
  onLabelChange: (symbol: string, label: SymbolLabel) => void
  onAddAlert: (symbol: string) => void
}

export function SymbolList({ 
  symbols, 
  selectedSymbol, 
  onSelectSymbol, 
  onLabelChange,
  onAddAlert 
}: SymbolListProps) {
  // Sort symbols by label category
  const sortedSymbols = [...symbols].sort((a, b) => {
    const aCategory = a.category || 'Other'
    const bCategory = b.category || 'Other'
    return labelOrder.indexOf(aCategory) - labelOrder.indexOf(bCategory)
  })

  // Group symbols by category
  const groupedSymbols = labelOrder.map(category => ({
    category,
    symbols: sortedSymbols.filter(s => (s.category || 'Other') === category)
  })).filter(group => group.symbols.length > 0)

  return (
    <div className="space-y-4">
      {groupedSymbols.map(({ category, symbols: categorySymbols }) => (
        <div key={category}>
          <h3 className={`text-sm font-semibold mb-2 px-2 py-1 rounded inline-block ${labelColors[category]}`}>
            {category}
          </h3>
          <div className="space-y-2 mt-2">
            {categorySymbols.map((symbol) => (
              <SymbolItem
                key={symbol.value}
                symbol={symbol}
                isSelected={selectedSymbol === symbol.value}
                onSelect={onSelectSymbol}
                onLabelChange={onLabelChange}
                onAddAlert={onAddAlert}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

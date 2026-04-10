import React from 'react'
import { SCORE_BG, SCORE_COLOR } from '../utils/helpers'

export function ScoreGauge({ score, size = 'md', label }) {
  const sizes = {
    sm: { outer: 'w-14 h-14', text: 'text-sm', label: 'text-xs' },
    md: { outer: 'w-20 h-20', text: 'text-xl', label: 'text-xs' },
    lg: { outer: 'w-28 h-28', text: 'text-3xl', label: 'text-sm' },
  }
  const s = sizes[size] || sizes.md
  const bg = SCORE_BG(score)
  const textColor = SCORE_COLOR(score)
  const displayScore = score ? Math.round(score) : '—'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${s.outer} rounded-full ${bg} bg-opacity-15 border-4 ${bg.replace('bg-', 'border-')} flex items-center justify-center`}>
        <span className={`${s.text} font-bold ${textColor}`}>{displayScore}</span>
      </div>
      {label && <span className={`${s.label} text-slate-500 text-center`}>{label}</span>}
    </div>
  )
}

export function ScoreBar({ label, score, icon }) {
  const bg = SCORE_BG(score)
  const pct = score ? Math.min(100, Math.round(score)) : 0

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 flex items-center gap-1.5">
          {icon && <span>{icon}</span>}
          {label}
        </span>
        <span className={`text-sm font-semibold ${SCORE_COLOR(score)}`}>
          {score ? Math.round(score) : '—'}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${bg} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

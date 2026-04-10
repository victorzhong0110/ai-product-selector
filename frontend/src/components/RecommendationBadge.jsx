import React from 'react'
import { RECOMMENDATION_CONFIG } from '../utils/helpers'

export function RecommendationBadge({ recommendation, size = 'sm' }) {
  if (!recommendation) return null
  const config = RECOMMENDATION_CONFIG[recommendation] || RECOMMENDATION_CONFIG.HOLD
  const textSize = size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2.5 py-0.5'

  return (
    <span className={`badge ${config.color} ${textSize} font-semibold`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5 inline-block`} />
      {config.label}
    </span>
  )
}

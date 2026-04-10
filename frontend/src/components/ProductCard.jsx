import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Clock, ChevronRight } from 'lucide-react'
import { RecommendationBadge } from './RecommendationBadge'
import { ScoreGauge } from './ScoreGauge'
import { STATUS_CONFIG, formatDate } from '../utils/helpers'
import { analysisApi } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

export function ProductCard({ analysis, onUpdate }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const statusConf = STATUS_CONFIG[analysis.status] || STATUS_CONFIG.pending
  const [tags, setTags] = useState([])

  useEffect(() => {
    if (user) {
      analysisApi.getTags(analysis.id).then(setTags).catch(() => {})
    }
  }, [analysis.id, user])

  const handleStar = async (e) => {
    e.stopPropagation()
    try {
      await analysisApi.update(analysis.id, { is_starred: !analysis.is_starred })
      onUpdate?.()
    } catch (err) { console.error(err) }
  }

  return (
    <div
      onClick={() => navigate(`/analyses/${analysis.id}`)}
      className="card cursor-pointer hover:shadow-md hover:border-sky-200 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`badge ${statusConf.color} ${statusConf.pulse ? 'animate-pulse' : ''}`}>
              {statusConf.label}
            </span>
            {analysis.category && (
              <span className="badge bg-slate-100 text-slate-600">{analysis.category}</span>
            )}
            <span className="badge bg-slate-100 text-slate-600">{analysis.target_market}</span>
            {/* Tag badges */}
            {tags.map(tag => (
              <span
                key={tag.id}
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
                style={{ backgroundColor: tag.color || '#6366f1' }}
              >
                {tag.name}
              </span>
            ))}
          </div>
          <h3 className="font-semibold text-slate-900 text-base truncate group-hover:text-sky-700 transition-colors">
            {analysis.name}
          </h3>
          <div className="flex items-center gap-3 mt-2">
            {analysis.ai_recommendation && (
              <RecommendationBadge recommendation={analysis.ai_recommendation} />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Clock size={11} />
            {formatDate(analysis.created_at)}
          </p>
        </div>

        {/* Right: Score */}
        <div className="flex items-center gap-3 shrink-0">
          <ScoreGauge
            score={analysis.overall_score}
            size="md"
            label="综合评分"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleStar}
              className={`p-1.5 rounded-lg transition-colors ${
                analysis.is_starred
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-slate-300 hover:text-amber-400 hover:bg-amber-50'
              }`}
            >
              <Star size={16} fill={analysis.is_starred ? 'currentColor' : 'none'} />
            </button>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  )
}

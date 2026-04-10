import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  ArrowLeft, Star, RefreshCw, Loader2, CheckCircle2, XCircle,
  TrendingUp, AlertTriangle, Lightbulb, DollarSign, Users, Package,
  Trash2, Download, Copy, Check, Bell, BellOff, Tag, X, Plus,
  ChevronDown, ShoppingBag, ShoppingCart
} from 'lucide-react'
import { analysisApi, tagsApi, trackingApi } from '../utils/api'
import { ScoreGauge, ScoreBar } from '../components/ScoreGauge'
import { RecommendationBadge } from '../components/RecommendationBadge'
import { STATUS_CONFIG, formatNumber, formatDate, SCORE_BG } from '../utils/helpers'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LangContext'

// ─── Tag Manager Modal ────────────────────────────────

function TagManagerModal({ analysisId, onClose, onTagsChanged }) {
  const { t } = useLanguage()
  const [allTags, setAllTags]         = useState([])
  const [assignedTags, setAssignedTags] = useState([])
  const [newTagName, setNewTagName]   = useState('')
  const [newTagColor, setNewTagColor] = useState('#6366f1')
  const [creating, setCreating]       = useState(false)

  const PRESET_COLORS = [
    '#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444',
    '#8b5cf6','#ec4899','#14b8a6','#f97316','#64748b',
  ]

  const load = useCallback(async () => {
    const [all, assigned] = await Promise.all([
      tagsApi.list(),
      analysisApi.getTags(analysisId),
    ])
    setAllTags(all)
    setAssignedTags(assigned)
  }, [analysisId])

  useEffect(() => { load() }, [load])

  const isAssigned = (tagId) => assignedTags.some(t => t.id === tagId)

  const toggleTag = async (tagId) => {
    if (isAssigned(tagId)) {
      await analysisApi.removeTag(analysisId, tagId)
    } else {
      await analysisApi.addTag(analysisId, tagId)
    }
    await load()
    onTagsChanged?.()
  }

  const createTag = async (e) => {
    e.preventDefault()
    if (!newTagName.trim()) return
    setCreating(true)
    try {
      await tagsApi.create(newTagName.trim(), newTagColor)
      setNewTagName('')
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const deleteTag = async (tagId) => {
    await tagsApi.delete(tagId)
    await load()
    onTagsChanged?.()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Tag size={16} className="text-sky-500" />
            {t('tags.title')}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Create new tag */}
          <form onSubmit={createTag} className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('tags.create')}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                placeholder={t('tags.name')}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                type="submit"
                disabled={creating || !newTagName.trim()}
                className="btn-primary px-4 py-2 text-sm flex items-center gap-1"
              >
                <Plus size={14} />
              </button>
            </div>
            {/* Color picker */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform ${newTagColor === color ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </form>

          {/* Tags list */}
          {allTags.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">{t('tags.noTags')}</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('detail.tags')}</p>
              {allTags.map(tag => (
                <div key={tag.id} className="flex items-center gap-3 py-1.5">
                  <button
                    onClick={() => toggleTag(tag.id)}
                    className={`flex items-center gap-2 flex-1 px-3 py-1.5 rounded-xl text-sm transition-all ${
                      isAssigned(tag.id)
                        ? 'ring-2 ring-offset-1'
                        : 'hover:bg-slate-50'
                    }`}
                    style={isAssigned(tag.id) ? { ringColor: tag.color } : {}}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-slate-700">{tag.name}</span>
                    {isAssigned(tag.id) && (
                      <Check size={13} className="ml-auto text-emerald-500" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteTag(tag.id)}
                    className="text-slate-300 hover:text-red-400 p-1"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Export Dropdown ──────────────────────────────────

function ExportDropdown({ analysisId }) {
  const { t } = useLanguage()
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [copied, setCopied]     = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doExport = async (type) => {
    setLoading(true)
    setOpen(false)
    try {
      const data = type === 'shopify'
        ? await analysisApi.exportShopify(analysisId)
        : await analysisApi.exportWooCommerce(analysisId)
      return data
    } finally {
      setLoading(false)
    }
  }

  const copyJSON = async (type) => {
    try {
      const data = await doExport(type)
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(type)
      setTimeout(() => setCopied(''), 2500)
    } catch (err) { console.error(err) }
  }

  const downloadJSON = async (type) => {
    try {
      const data = await doExport(type)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-export-${analysisId.slice(0,8)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) { console.error(err) }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="btn-secondary flex items-center gap-1.5 text-sm"
      >
        {loading
          ? <Loader2 size={14} className="animate-spin" />
          : <Download size={14} />
        }
        {t('detail.export')}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[220px] z-50">
          {/* Shopify */}
          <div className="px-3 py-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <ShoppingBag size={10} /> Shopify
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => copyJSON('shopify')}
                className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                {copied === 'shopify' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copied === 'shopify' ? t('detail.copied') : t('detail.copyJSON')}
              </button>
              <button
                onClick={() => downloadJSON('shopify')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                <Download size={12} />
                {t('detail.download')}
              </button>
            </div>
          </div>
          <div className="border-t border-slate-100 my-1" />
          {/* WooCommerce */}
          <div className="px-3 py-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <ShoppingCart size={10} /> WooCommerce
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => copyJSON('woocommerce')}
                className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                {copied === 'woocommerce' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copied === 'woocommerce' ? t('detail.copied') : t('detail.copyJSON')}
              </button>
              <button
                onClick={() => downloadJSON('woocommerce')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                <Download size={12} />
                {t('detail.download')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tracking Button ──────────────────────────────────

function TrackingButton({ analysisId }) {
  const { t } = useLanguage()
  const [open, setOpen]               = useState(false)
  const [tracking, setTracking]       = useState(null) // null = not tracking
  const [frequency, setFrequency]     = useState(24)
  const [loading, setLoading]         = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    trackingApi.list().then(list => {
      const found = list.find(t => t.analysis_id === analysisId && t.is_active)
      setTracking(found || null)
    }).catch(() => {})
  }, [analysisId])

  const subscribe = async () => {
    setLoading(true)
    try {
      const result = await trackingApi.subscribe(analysisId, frequency, 5.0)
      setTracking(result)
      setOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    if (!tracking) return
    setLoading(true)
    try {
      await trackingApi.unsubscribe(tracking.id)
      setTracking(null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (tracking) {
    return (
      <button
        onClick={unsubscribe}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm bg-sky-50 border border-sky-200 text-sky-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <BellOff size={14} />}
        {t('detail.stopTracking')}
      </button>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Bell size={14} />
        {t('detail.trackProduct')}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-[220px] z-50 space-y-3">
          <p className="text-xs font-semibold text-slate-600">{t('detail.trackFrequency')}</p>
          <div className="space-y-1.5">
            {[
              { hours: 24, label: t('detail.every24h') },
              { hours: 72, label: t('detail.every72h') },
              { hours: 168, label: t('detail.every168h') },
            ].map(({ hours, label }) => (
              <label key={hours} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="radio"
                  name="frequency"
                  value={hours}
                  checked={frequency === hours}
                  onChange={() => setFrequency(hours)}
                  className="accent-sky-500"
                />
                {label}
              </label>
            ))}
          </div>
          <button
            onClick={subscribe}
            disabled={loading}
            className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
            {t('detail.trackProduct')}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main AnalysisDetail ──────────────────────────────

export function AnalysisDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()

  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [assignedTags, setAssignedTags]   = useState([])
  const [showTagModal, setShowTagModal]   = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const result = await analysisApi.get(id)
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchTags = useCallback(async () => {
    if (user) {
      try {
        const tags = await analysisApi.getTags(id)
        setAssignedTags(tags)
      } catch {}
    }
  }, [id, user])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchTags() }, [fetchTags])

  // Auto-poll while analyzing
  useEffect(() => {
    if (!data || !['pending', 'analyzing'].includes(data.status)) return
    const timer = setInterval(fetchData, 2000)
    return () => clearInterval(timer)
  }, [data, fetchData])

  const handleStar = async () => {
    const updated = await analysisApi.update(id, { is_starred: !data.is_starred })
    setData(updated)
  }

  const handleReanalyze = async () => {
    setReanalyzing(true)
    await analysisApi.reanalyze(id)
    await fetchData()
    setReanalyzing(false)
  }

  const handleDelete = async () => {
    await analysisApi.delete(id)
    navigate('/analyses')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="text-center py-16">
      <p className="text-slate-500">{t('detail.notFound')}</p>
      <button onClick={() => navigate('/analyses')} className="btn-primary mt-4">{t('detail.back')}</button>
    </div>
  )

  const isProcessing = ['pending', 'analyzing'].includes(data.status)
  const statusConf = STATUS_CONFIG[data.status]

  // Radar chart data
  const radarData = [
    { subject: t('detail.marketDemand'), score: data.market_demand_score || 0 },
    { subject: t('detail.competition'),  score: data.competition_score || 0 },
    { subject: t('detail.profitMargin'), score: data.profit_margin_score || 0 },
    { subject: t('detail.trendHeat'),    score: data.trend_score || 0 },
    { subject: t('detail.sentiment'),    score: data.sentiment_score || 0 },
  ]

  // Keyword bar data
  const keywordData = (data.trend_keywords || []).slice(0, 5).map(k => ({
    name: k.keyword?.length > 20 ? k.keyword.slice(0, 20) + '…' : k.keyword,
    value: k.volume === 'HIGH' ? 90 : k.volume === 'MEDIUM' ? 55 : 25,
    growth: k.growth,
    platform: k.platform,
  }))

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/analyses')} className="btn-secondary flex items-center gap-1.5 text-sm shrink-0">
          <ArrowLeft size={15} />
          {t('detail.back')}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`badge ${statusConf.color} ${statusConf.pulse ? 'animate-pulse' : ''}`}>
              {isProcessing && <Loader2 size={11} className="animate-spin mr-1 inline" />}
              {statusConf.label}
            </span>
            {data.category && <span className="badge bg-slate-100 text-slate-600">{data.category}</span>}
            <span className="badge bg-slate-100 text-slate-600">{data.target_market}</span>
            {/* Assigned tags */}
            {assignedTags.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
                style={{ backgroundColor: tag.color || '#6366f1' }}
              >
                {tag.name}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{data.name}</h1>
          <p className="text-xs text-slate-400 mt-1">{formatDate(data.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Tag manager button (auth-gated) */}
          {user && (
            <button
              onClick={() => setShowTagModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Tag size={14} />
              {t('detail.manageTags')}
            </button>
          )}
          {/* Tracking (auth-gated) */}
          {user && <TrackingButton analysisId={id} />}
          {/* Export */}
          {data.status === 'completed' && <ExportDropdown analysisId={id} />}
          {/* Star */}
          <button onClick={handleStar} className={`p-2 rounded-xl transition-colors ${data.is_starred ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:bg-slate-100'}`}>
            <Star size={18} fill={data.is_starred ? 'currentColor' : 'none'} />
          </button>
          {/* Re-analyze */}
          <button onClick={handleReanalyze} disabled={reanalyzing || isProcessing} className="btn-secondary flex items-center gap-1.5 text-sm">
            <RefreshCw size={14} className={reanalyzing ? 'animate-spin' : ''} />
            {t('detail.reanalyze')}
          </button>
          {/* Delete */}
          {deleteConfirm ? (
            <div className="flex gap-1">
              <button onClick={handleDelete} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600">{t('detail.confirmDelete')}</button>
              <button onClick={() => setDeleteConfirm(false)} className="btn-secondary text-sm">{t('detail.cancel')}</button>
            </div>
          ) : (
            <button onClick={() => setDeleteConfirm(true)} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="card bg-sky-50 border-sky-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
            <Loader2 size={24} className="text-sky-600 animate-spin" />
          </div>
          <div>
            <p className="font-semibold text-sky-800">{t('detail.analyzing')}</p>
            <p className="text-sm text-sky-600">{t('detail.analyzingSubtitle')}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {data.status === 'completed' && (
        <>
          {/* Hero Score Row */}
          <div className="card">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <ScoreGauge score={data.overall_score} size="lg" label={t('common.overall')} />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <RecommendationBadge recommendation={data.ai_recommendation} size="lg" />
                  <span className="text-slate-400 text-sm">{t('detail.aiSuggestion')}</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{data.ai_summary}</p>
              </div>
              {/* Market KPIs */}
              <div className="grid grid-cols-3 gap-4 shrink-0">
                {[
                  { icon: DollarSign, label: t('detail.suggestedPrice'),  value: data.avg_price_usd ? `$${data.avg_price_usd.toFixed(0)}` : '—' },
                  { icon: Users,      label: t('detail.monthlySales'),     value: formatNumber(data.estimated_monthly_sales) },
                  { icon: Package,    label: t('detail.competitorCount'),  value: formatNumber(data.competition_count) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center bg-slate-50 rounded-xl p-3">
                    <Icon size={16} className="text-slate-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score Details + Radar */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Score Bars */}
            <div className="card space-y-4">
              <h2 className="font-semibold text-slate-800">{t('detail.scoreDimensions')}</h2>
              <ScoreBar label={t('detail.marketDemand')} score={data.market_demand_score} icon="📈" />
              <ScoreBar label={t('detail.competition')}  score={data.competition_score}   icon="🏆" />
              <ScoreBar label={t('detail.profitMargin')} score={data.profit_margin_score} icon="💰" />
              <ScoreBar label={t('detail.trendHeat')}    score={data.trend_score}         icon="🔥" />
              <ScoreBar label={t('detail.sentiment')}    score={data.sentiment_score}     icon="💬" />
            </div>

            {/* Radar Chart */}
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-2">{t('detail.radarChart')}</h2>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights Row */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Reasons */}
            <div className="card">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <CheckCircle2 size={16} className="text-emerald-500" />
                {t('detail.reasons')}
              </h2>
              <ul className="space-y-2">
                {(data.ai_reasons || []).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-4 h-4 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i+1}</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div className="card">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-500" />
                {t('detail.risks')}
              </h2>
              <ul className="space-y-2">
                {(data.ai_risks || []).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0 mt-2" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="card">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-sky-500" />
                {t('detail.opportunities')}
              </h2>
              <ul className="space-y-2">
                {(data.ai_opportunities || []).map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full shrink-0 mt-2" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Keyword Trends */}
          {keywordData.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-sky-500" />
                {t('detail.keywords')}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={keywordData} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, n, { payload }) => [`${payload.growth}`, '增长趋势']} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {keywordData.map((_, i) => (
                        <Cell key={i} fill={['#0ea5e9','#6366f1','#10b981','#f59e0b','#ef4444'][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {(data.trend_keywords || []).slice(0, 5).map((kw, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-700 flex-1 truncate">{kw.keyword}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="badge bg-slate-100 text-slate-600 text-[10px]">{kw.platform}</span>
                        <span className={`text-xs font-semibold ${kw.growth?.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
                          {kw.growth}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Competitors */}
          {data.top_competitors?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4">{t('detail.competitors')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['竞品', '价格', '评分', '评论数', '月销量估算'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-500 pb-2 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_competitors.map((c, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="py-2.5 pr-4 font-medium text-slate-800">{c.name}</td>
                        <td className="py-2.5 pr-4 text-slate-600">{c.price_usd ? `$${c.price_usd.toFixed(2)}` : '—'}</td>
                        <td className="py-2.5 pr-4">
                          <span className={`font-semibold ${c.rating >= 4.5 ? 'text-emerald-600' : c.rating >= 4 ? 'text-sky-600' : 'text-amber-600'}`}>
                            {c.rating ? `⭐ ${c.rating}` : '—'}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">{formatNumber(c.review_count)}</td>
                        <td className="py-2.5 text-slate-600">{formatNumber(c.monthly_sales_est)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Platform Insights */}
          {data.platform_insights && (
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4">{t('detail.platformInsights')}</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(data.platform_insights).map(([platform, info]) => (
                  <div key={platform} className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-slate-800 capitalize">{platform}</span>
                      <span className="badge bg-white text-slate-500 text-[10px]">
                        {{ amazon: '🛒', tiktok: '📱', shopify: '🏪' }[platform] || '📦'}
                      </span>
                    </div>
                    {Object.entries(info).map(([key, val]) => (
                      <p key={key} className="text-xs text-slate-600 mb-1">
                        <span className="font-medium text-slate-700 capitalize">{key.replace(/_/g, ' ')}：</span>
                        {String(val)}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {data.status === 'failed' && (
        <div className="card bg-red-50 border-red-200 text-center py-12">
          <XCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-red-700 mb-2">{t('detail.failed')}</p>
          <p className="text-sm text-red-600 mb-4">{t('detail.failedSubtitle')}</p>
          <button onClick={handleReanalyze} className="btn-primary">{t('detail.reanalyze')}</button>
        </div>
      )}

      {/* Tag Manager Modal */}
      {showTagModal && (
        <TagManagerModal
          analysisId={id}
          onClose={() => setShowTagModal(false)}
          onTagsChanged={fetchTags}
        />
      )}
    </div>
  )
}

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  ArrowLeft, Star, RefreshCw, Loader2, CheckCircle2, XCircle,
  TrendingUp, AlertTriangle, Lightbulb, DollarSign, Users, Package,
  Trash2
} from 'lucide-react'
import { analysisApi } from '../utils/api'
import { ScoreGauge, ScoreBar } from '../components/ScoreGauge'
import { RecommendationBadge } from '../components/RecommendationBadge'
import { STATUS_CONFIG, formatNumber, formatDate, SCORE_BG } from '../utils/helpers'

export function AnalysisDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

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

  useEffect(() => { fetchData() }, [fetchData])

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
      <p className="text-slate-500">分析记录不存在</p>
      <button onClick={() => navigate('/analyses')} className="btn-primary mt-4">返回列表</button>
    </div>
  )

  const isProcessing = ['pending', 'analyzing'].includes(data.status)
  const statusConf = STATUS_CONFIG[data.status]

  // Radar chart data
  const radarData = [
    { subject: '市场需求', score: data.market_demand_score || 0 },
    { subject: '竞争空间', score: data.competition_score || 0 },
    { subject: '利润空间', score: data.profit_margin_score || 0 },
    { subject: '趋势热度', score: data.trend_score || 0 },
    { subject: '消费口碑', score: data.sentiment_score || 0 },
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
          返回
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`badge ${statusConf.color} ${statusConf.pulse ? 'animate-pulse' : ''}`}>
              {isProcessing && <Loader2 size={11} className="animate-spin mr-1 inline" />}
              {statusConf.label}
            </span>
            {data.category && <span className="badge bg-slate-100 text-slate-600">{data.category}</span>}
            <span className="badge bg-slate-100 text-slate-600">{data.target_market}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{data.name}</h1>
          <p className="text-xs text-slate-400 mt-1">{formatDate(data.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleStar} className={`p-2 rounded-xl transition-colors ${data.is_starred ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:bg-slate-100'}`}>
            <Star size={18} fill={data.is_starred ? 'currentColor' : 'none'} />
          </button>
          <button onClick={handleReanalyze} disabled={reanalyzing || isProcessing} className="btn-secondary flex items-center gap-1.5 text-sm">
            <RefreshCw size={14} className={reanalyzing ? 'animate-spin' : ''} />
            重新分析
          </button>
          {deleteConfirm ? (
            <div className="flex gap-1">
              <button onClick={handleDelete} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600">确认删除</button>
              <button onClick={() => setDeleteConfirm(false)} className="btn-secondary text-sm">取消</button>
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
            <p className="font-semibold text-sky-800">AI 正在分析中…</p>
            <p className="text-sm text-sky-600">正在评估市场需求、竞争格局、情感分析，请稍候（约 5–10 秒）</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {data.status === 'completed' && (
        <>
          {/* Hero Score Row */}
          <div className="card">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <ScoreGauge score={data.overall_score} size="lg" label="综合评分" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <RecommendationBadge recommendation={data.ai_recommendation} size="lg" />
                  <span className="text-slate-400 text-sm">AI 选品建议</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{data.ai_summary}</p>
              </div>
              {/* Market KPIs */}
              <div className="grid grid-cols-3 gap-4 shrink-0">
                {[
                  { icon: DollarSign, label: '建议售价', value: data.avg_price_usd ? `$${data.avg_price_usd.toFixed(0)}` : '—' },
                  { icon: Users, label: '月销量估算', value: formatNumber(data.estimated_monthly_sales) },
                  { icon: Package, label: '竞品数量', value: formatNumber(data.competition_count) },
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
              <h2 className="font-semibold text-slate-800">维度评分</h2>
              <ScoreBar label="市场需求" score={data.market_demand_score} icon="📈" />
              <ScoreBar label="竞争空间" score={data.competition_score} icon="🏆" />
              <ScoreBar label="利润空间" score={data.profit_margin_score} icon="💰" />
              <ScoreBar label="趋势热度" score={data.trend_score} icon="🔥" />
              <ScoreBar label="消费口碑" score={data.sentiment_score} icon="💬" />
            </div>

            {/* Radar Chart */}
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-2">能力雷达图</h2>
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
                选品理由
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
                风险提示
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
                机会点
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
                搜索趋势关键词
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
              <h2 className="font-semibold text-slate-800 mb-4">竞品分析</h2>
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
              <h2 className="font-semibold text-slate-800 mb-4">平台机会</h2>
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
          <p className="font-semibold text-red-700 mb-2">分析失败</p>
          <p className="text-sm text-red-600 mb-4">AI 分析过程中遇到问题，请重试</p>
          <button onClick={handleReanalyze} className="btn-primary">重新分析</button>
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, Package, Award, Target, Plus, Zap, AlertCircle } from 'lucide-react'
import { dashboardApi } from '../utils/api'
import { RECOMMENDATION_CONFIG } from '../utils/helpers'

const STAT_ICONS = [Package, Award, TrendingUp, Target]

export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [aiMode, setAiMode] = useState('demo')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardApi.getStats(), dashboardApi.health()])
      .then(([s, h]) => {
        setStats(s)
        setAiMode(h.ai_mode)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const cards = [
    { label: '总分析数', value: stats?.total_analyses ?? 0, sub: '历史记录', color: 'sky' },
    { label: '已完成', value: stats?.completed ?? 0, sub: 'AI 分析完成', color: 'emerald' },
    { label: '强力推荐', value: stats?.strong_buy_count ?? 0, sub: '优质选品', color: 'violet' },
    { label: '平均评分', value: stats?.avg_score ? `${stats.avg_score}` : '—', sub: '满分 100', color: 'amber' },
  ]

  const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-8">
      {/* AI Mode Banner */}
      {aiMode === 'demo' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <div>
            <span className="font-semibold text-amber-800">演示模式</span>
            <span className="text-amber-700 ml-2 text-sm">
              配置 <code className="bg-amber-100 px-1 rounded text-xs">ANTHROPIC_API_KEY</code> 即可启用真实 Claude AI 分析
            </span>
          </div>
        </div>
      )}
      {aiMode === 'claude' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <Zap size={18} className="text-emerald-600 shrink-0" />
          <span className="font-semibold text-emerald-800">Claude AI 模式已启用</span>
          <span className="text-emerald-700 text-sm">所有分析由 Claude claude-opus-4-5 驱动</span>
        </div>
      )}

      {/* Hero */}
      <div className="card bg-gradient-to-br from-sky-600 to-indigo-700 text-white border-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">AI 选品决策工具</h2>
            <p className="text-sky-100 mt-1.5 max-w-md">
              整合竞品数据、评论情感分析与搜索趋势，AI 给出可执行的选品评分与理由
            </p>
          </div>
          <button
            onClick={() => navigate('/new')}
            className="flex items-center gap-2 bg-white text-sky-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-sky-50 transition-colors shrink-0"
          >
            <Plus size={18} />
            开始新分析
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, color }, i) => {
          const Icon = STAT_ICONS[i]
          const colorMap = {
            sky: 'bg-sky-50 text-sky-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            violet: 'bg-violet-50 text-violet-600',
            amber: 'bg-amber-50 text-amber-600',
          }
          return (
            <div key={label} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">类目分布</h3>
          {stats?.top_categories?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.top_categories} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.top_categories.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              暂无数据，开始第一个分析吧
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">快速入门</h3>
          <div className="space-y-3">
            {[
              { step: '1', title: '输入产品名称', desc: '支持中英文，可附加描述与评论', color: 'sky' },
              { step: '2', title: 'AI 多维分析', desc: '评估市场需求、竞争格局、利润空间', color: 'violet' },
              { step: '3', title: '获取选品报告', desc: '综合评分 + 理由 + 风险点 + 机会', color: 'emerald' },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full bg-${color}-100 text-${color}-700 flex items-center justify-center text-sm font-bold shrink-0`}>
                  {step}
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">{title}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
            <button
              onClick={() => navigate('/new')}
              className="btn-primary w-full mt-2 text-sm"
            >
              立即开始 →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

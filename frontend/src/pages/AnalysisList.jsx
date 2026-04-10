import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, Star, RefreshCw } from 'lucide-react'
import { ProductCard } from '../components/ProductCard'
import { analysisApi, dashboardApi } from '../utils/api'
import { RECOMMENDATION_CONFIG, CATEGORIES } from '../utils/helpers'

export function AnalysisList() {
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    recommendation: '',
    starred: false,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        limit: 50,
        skip: 0,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.recommendation && { recommendation: filters.recommendation }),
        ...(filters.starred && { starred: true }),
      }
      const data = await analysisApi.list(params)
      setAnalyses(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh if any analyses are still processing
  useEffect(() => {
    const hasPending = analyses.some(a => ['pending', 'analyzing'].includes(a.status))
    if (!hasPending) return
    const timer = setInterval(fetchData, 3000)
    return () => clearInterval(timer)
  }, [analyses, fetchData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">选品库</h1>
          <p className="text-slate-500 text-sm mt-0.5">共 {total} 条分析记录</p>
        </div>
        <button onClick={() => navigate('/new')} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />
          新建分析
        </button>
      </div>

      {/* Filters */}
      <div className="card py-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索产品名称…"
            value={filters.search}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        {/* Category filter */}
        <select
          value={filters.category}
          onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
        >
          <option value="">全部类目</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Recommendation filter */}
        <select
          value={filters.recommendation}
          onChange={e => setFilters(p => ({ ...p, recommendation: e.target.value }))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
        >
          <option value="">全部建议</option>
          {Object.entries(RECOMMENDATION_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        {/* Starred */}
        <button
          onClick={() => setFilters(p => ({ ...p, starred: !p.starred }))}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-colors ${
            filters.starred
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Star size={14} fill={filters.starred ? 'currentColor' : 'none'} />
          收藏
        </button>

        <button onClick={fetchData} className="btn-secondary flex items-center gap-1.5 text-sm">
          <RefreshCw size={14} />
          刷新
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="flex gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                </div>
                <div className="w-20 h-20 bg-slate-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-semibold text-slate-800 text-lg mb-2">暂无分析记录</h3>
          <p className="text-slate-500 text-sm mb-6">输入产品名称，AI 将为你分析市场潜力与选品价值</p>
          <button onClick={() => navigate('/new')} className="btn-primary">
            开始第一个分析
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {analyses.map(a => (
            <ProductCard key={a.id} analysis={a} onUpdate={fetchData} />
          ))}
        </div>
      )}
    </div>
  )
}

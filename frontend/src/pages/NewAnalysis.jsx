import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Plus, X, ChevronDown, Loader2, Info } from 'lucide-react'
import { analysisApi } from '../utils/api'
import { CATEGORIES, MARKETS } from '../utils/helpers'
import { useLanguage } from '../contexts/LangContext'

export function NewAnalysis() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [form, setForm] = useState({
    name: '',
    category: '',
    target_market: 'US',
    description: '',
  })
  const [reviews, setReviews] = useState([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const addReview = () => setReviews(prev => [...prev, ''])
  const removeReview = (i) => setReviews(prev => prev.filter((_, idx) => idx !== i))
  const updateReview = (i, val) => {
    setReviews(prev => prev.map((r, idx) => idx === i ? val : r))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('产品名称不能为空'); return }
    setLoading(true)
    setError('')
    try {
      const validReviews = reviews.filter(r => r.trim().length > 0)
      const payload = {
        ...form,
        reviews: validReviews.length > 0 ? validReviews : undefined
      }
      const result = await analysisApi.create(payload)
      navigate(`/analyses/${result.id}`)
    } catch (err) {
      setError(err.message || '创建分析失败，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('new.title')}</h1>
        <p className="text-slate-500 mt-1">{t('new.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            基本信息
          </h2>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              产品名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => updateForm('name', e.target.value)}
              placeholder="例：Portable Neck Fan / 颈挂风扇"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
            />
          </div>

          {/* Category & Market */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">产品类目</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={e => updateForm('category', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-white"
                >
                  <option value="">选择类目…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">目标市场</label>
              <div className="relative">
                <select
                  value={form.target_market}
                  onChange={e => updateForm('target_market', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-white"
                >
                  {MARKETS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              产品描述 <span className="text-slate-400 text-xs ml-1">（可选，补充背景信息提升分析质量）</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => updateForm('description', e.target.value)}
              rows={3}
              placeholder="例：面向夏季户外运动用户，可穿戴无叶片风扇，支持 USB 充电，续航 8 小时"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition resize-none"
            />
          </div>
        </div>

        {/* Reviews */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              评论样本 <span className="text-slate-400 text-xs ml-1">（可选）</span>
            </h2>
            <button type="button" onClick={addReview} className="btn-secondary flex items-center gap-1.5 text-xs">
              <Plus size={13} />
              添加评论
            </button>
          </div>

          <div className="bg-sky-50 rounded-xl p-3 flex items-start gap-2">
            <Info size={14} className="text-sky-600 mt-0.5 shrink-0" />
            <p className="text-xs text-sky-700">
              粘贴竞品的真实用户评论，AI 将进行情感分析，提取痛点与好评，纳入选品评分。
            </p>
          </div>

          <div className="space-y-2">
            {reviews.map((review, i) => (
              <div key={i} className="flex gap-2">
                <textarea
                  value={review}
                  onChange={e => updateReview(i, e.target.value)}
                  rows={2}
                  placeholder={`评论 ${i + 1}：例 "Great fan, battery lasts all day but packaging was damaged"`}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                />
                <button
                  type="button"
                  onClick={() => removeReview(i)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                提交中…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                开始 AI 分析
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

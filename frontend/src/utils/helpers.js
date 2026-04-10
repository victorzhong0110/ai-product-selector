export const RECOMMENDATION_CONFIG = {
  STRONG_BUY: { label: '强力推荐', color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', ring: 'ring-emerald-400' },
  BUY:        { label: '推荐选品', color: 'bg-sky-100 text-sky-800',     dot: 'bg-sky-500',     ring: 'ring-sky-400' },
  HOLD:       { label: '持续观察', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500',   ring: 'ring-amber-400' },
  AVOID:      { label: '不建议',   color: 'bg-red-100 text-red-800',     dot: 'bg-red-500',     ring: 'ring-red-400' },
}

export const SCORE_COLOR = (score) => {
  if (!score) return 'text-slate-400'
  if (score >= 80) return 'text-emerald-600'
  if (score >= 65) return 'text-sky-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-500'
}

export const SCORE_BG = (score) => {
  if (!score) return 'bg-slate-200'
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 65) return 'bg-sky-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

export const STATUS_CONFIG = {
  pending:   { label: '等待中', color: 'text-slate-500 bg-slate-100' },
  analyzing: { label: 'AI 分析中', color: 'text-sky-700 bg-sky-100', pulse: true },
  completed: { label: '已完成', color: 'text-emerald-700 bg-emerald-100' },
  failed:    { label: '失败', color: 'text-red-700 bg-red-100' },
}

export const formatNumber = (n) => {
  if (!n) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export const CATEGORIES = [
  'Electronics',
  'Home & Garden',
  'Sports & Outdoors',
  'Beauty & Health',
  'Pet Supplies',
  'Toys & Games',
  'Kitchen & Dining',
  'Clothing & Accessories',
  'Office Products',
  'Baby & Kids',
]

export const MARKETS = [
  { value: 'US', label: '🇺🇸 美国' },
  { value: 'EU', label: '🇪🇺 欧盟' },
  { value: 'UK', label: '🇬🇧 英国' },
  { value: 'AU', label: '🇦🇺 澳大利亚' },
  { value: 'CA', label: '🇨🇦 加拿大' },
  { value: 'GLOBAL', label: '🌍 全球' },
]

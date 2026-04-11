import React, { useState, useEffect } from 'react'
import { Settings2, Eye, EyeOff, CheckCircle2, Key, Globe, User, ShoppingCart, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LangContext'
import { settingsApi } from '../utils/api'

// Each API key field definition
const KEY_FIELDS = [
  {
    group: 'MiniMax AI',
    icon: '🤖',
    description: '用于 AI 选品分析。前往 minimaxi.com 获取。',
    fields: [
      { key: 'minimax_api_key', label: 'MiniMax API Key', placeholder: 'sk-...' },
    ],
  },
  {
    group: 'SerpAPI（Google Trends）',
    icon: '🔍',
    description: '获取真实 Google Trends 搜索趋势数据。serpapi.com 每月 100 次免费。',
    fields: [
      { key: 'serpapi_key', label: 'SerpAPI Key', placeholder: 'serpapi_key_...' },
    ],
  },
  {
    group: 'Amazon SP-API',
    icon: '🛒',
    description: '获取真实 BSR 排名与销量数据，需要 Amazon 卖家账户。',
    fields: [
      { key: 'amazon_access_key',    label: 'AWS Access Key ID',     placeholder: 'AKIAIOSFODNN7EXAMPLE' },
      { key: 'amazon_secret_key',    label: 'AWS Secret Access Key', placeholder: '••••••••••••••••••••••••••••••••••••••••' },
      { key: 'amazon_associate_tag', label: 'Associate Tag',         placeholder: 'yourtag-20' },
    ],
  },
]

function KeyInput({ fieldKey, label, placeholder, value, onChange, isSet }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
        {label}
        {isSet && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-normal">
            <CheckCircle2 size={11} /> 已配置
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          className="w-full px-4 py-2.5 pr-20 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
          placeholder={isSet ? '••••••••（已保存，输入新值覆盖）' : placeholder}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
          {show ? '隐藏' : '显示'}
        </button>
      </div>
    </div>
  )
}

export function Settings() {
  const { user } = useAuth()
  const { t, lang, setLang, LANGUAGES } = useLanguage()

  // values entered by the user (empty = don't overwrite)
  const [keys, setKeys] = useState({
    minimax_api_key: '',
    serpapi_key: '',
    amazon_access_key: '',
    amazon_secret_key: '',
    amazon_associate_tag: '',
  })
  // which keys are already saved server-side
  const [savedFlags, setSavedFlags] = useState({})

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  // Guest mode: localStorage keys
  const [localKeys, setLocalKeys] = useState(() => {
    const stored = {}
    for (const group of KEY_FIELDS)
      for (const f of group.fields)
        stored[f.key] = localStorage.getItem(f.key) || ''
    return stored
  })

  useEffect(() => {
    if (!user) return
    settingsApi.get().then(data => {
      const flags = {}
      for (const group of KEY_FIELDS)
        for (const f of group.fields)
          flags[f.key] = data[`has_${f.key}`] || false
      setSavedFlags(flags)
    }).catch(() => {})
  }, [user])

  const updateKey = (k, v) => setKeys(prev => ({ ...prev, [k]: v }))
  const updateLocalKey = (k, v) => setLocalKeys(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      if (user) {
        const payload = { language: lang }
        for (const group of KEY_FIELDS)
          for (const f of group.fields)
            if (keys[f.key]) payload[f.key] = keys[f.key]
        await settingsApi.save(payload)
        // Refresh saved flags
        const data = await settingsApi.get()
        const flags = {}
        for (const group of KEY_FIELDS)
          for (const f of group.fields)
            flags[f.key] = data[`has_${f.key}`] || false
        setSavedFlags(flags)
        setKeys({ minimax_api_key: '', serpapi_key: '', amazon_access_key: '', amazon_secret_key: '', amazon_associate_tag: '' })
      } else {
        // Guest: save all to localStorage
        for (const group of KEY_FIELDS)
          for (const f of group.fields)
            localStorage.setItem(f.key, localKeys[f.key] || '')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleLangChange = (code) => {
    setLang(code)
    if (user) settingsApi.save({ language: code }).catch(() => {})
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings2 size={24} className="text-sky-500" />
          {t('settings.title')}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Language Selector */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-sky-500" />
          <h2 className="font-semibold text-slate-800">{t('settings.language')}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => handleLangChange(code)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                lang === code
                  ? 'bg-sky-50 border-sky-400 text-sky-700 ring-1 ring-sky-300'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{flag}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Account Info */}
      {user && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <User size={18} className="text-sky-500" />
            <h2 className="font-semibold text-slate-800">{t('settings.account')}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs mb-0.5">{t('settings.username')}</p>
              <p className="font-medium text-slate-800">{user.username}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">{t('settings.email')}</p>
              <p className="font-medium text-slate-800">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Guest warning */}
      {!user && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          {t('settings.loginRequired')} API Key 将仅保存在本地浏览器，登录后可同步到账户。
        </div>
      )}

      {/* API Key Groups */}
      <div className="card space-y-6">
        <div className="flex items-center gap-2">
          <Key size={18} className="text-sky-500" />
          <h2 className="font-semibold text-slate-800">API Key 配置</h2>
        </div>

        {KEY_FIELDS.map((group) => (
          <div key={group.group} className="space-y-3 pb-5 border-b border-slate-100 last:border-0 last:pb-0">
            <div className="flex items-center gap-2">
              <span className="text-base">{group.icon}</span>
              <span className="font-medium text-slate-700 text-sm">{group.group}</span>
            </div>
            <p className="text-xs text-slate-400">{group.description}</p>
            {group.fields.map(f => (
              user ? (
                <KeyInput
                  key={f.key}
                  fieldKey={f.key}
                  label={f.label}
                  placeholder={f.placeholder}
                  value={keys[f.key]}
                  onChange={updateKey}
                  isSet={savedFlags[f.key]}
                />
              ) : (
                <KeyInput
                  key={f.key}
                  fieldKey={f.key}
                  label={f.label}
                  placeholder={f.placeholder}
                  value={localKeys[f.key]}
                  onChange={updateLocalKey}
                  isSet={!!localKeys[f.key]}
                />
              )
            ))}
          </div>
        ))}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            saved ? 'bg-emerald-500 text-white' : 'btn-primary'
          }`}
        >
          {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {saved && <CheckCircle2 size={16} />}
          {saving ? '保存中…' : saved ? '已保存' : t('settings.save')}
        </button>
      </div>
    </div>
  )
}

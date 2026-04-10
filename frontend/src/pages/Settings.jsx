import React, { useState, useEffect } from 'react'
import { Settings2, Eye, EyeOff, CheckCircle2, Key, Globe, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LangContext'
import { settingsApi } from '../utils/api'

export function Settings() {
  const { user } = useAuth()
  const { t, lang, setLang, LANGUAGES } = useLanguage()

  const [apiKey, setApiKey]       = useState('')
  const [showKey, setShowKey]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [hasServerKey, setHasServerKey] = useState(false)

  // For guest mode: store API key in localStorage
  const [localApiKey, setLocalApiKey] = useState(() => localStorage.getItem('minimax_api_key') || '')

  useEffect(() => {
    if (user) {
      settingsApi.get().then(data => {
        setHasServerKey(data.has_api_key || false)
      }).catch(() => {})
    }
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      if (user) {
        await settingsApi.save({
          minimax_api_key: apiKey,
          language: lang,
        })
        if (apiKey) setHasServerKey(true)
      } else {
        // Save to localStorage for guest mode
        localStorage.setItem('minimax_api_key', localApiKey)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleLangChange = (code) => {
    setLang(code)
    if (user) {
      settingsApi.save({ language: code }).catch(() => {})
    }
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
        <div className="flex items-center gap-2 mb-1">
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

      {/* Account Info (if logged in) */}
      {user && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2 mb-1">
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

      {/* API Key Section */}
      {user ? (
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Key size={18} className="text-sky-500" />
            <h2 className="font-semibold text-slate-800">{t('settings.apiKey')}</h2>
            {hasServerKey && (
              <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={12} />
                已配置
              </span>
            )}
          </div>
          <div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full px-4 py-2.5 pr-20 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder={hasServerKey ? '••••••••••••••••（已保存）' : t('settings.apiKeyPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                {showKey ? t('settings.hide') : t('settings.show')}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{t('settings.apiKeyHint')}</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'btn-primary'
            }`}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saved ? (
              <CheckCircle2 size={16} />
            ) : null}
            {saving ? t('common.loading') : saved ? t('settings.saved') : t('settings.save')}
          </button>
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Key size={18} className="text-sky-500" />
            <h2 className="font-semibold text-slate-800">{t('settings.apiKeyLocal')}</h2>
          </div>
          <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
            {t('settings.loginRequired')}
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('settings.apiKeyLocal')}</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localApiKey}
                onChange={e => setLocalApiKey(e.target.value)}
                className="w-full px-4 py-2.5 pr-20 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder={t('settings.apiKeyPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                {showKey ? t('settings.hide') : t('settings.show')}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{t('settings.localSave')}</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              saved ? 'bg-emerald-500 text-white' : 'btn-primary'
            }`}
          >
            {saved ? <CheckCircle2 size={16} /> : null}
            {saving ? t('common.loading') : saved ? t('settings.saved') : t('settings.save')}
          </button>
        </div>
      )}
    </div>
  )
}

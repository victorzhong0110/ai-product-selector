import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LangContext'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('auth.loginTitle')}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.password')}</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-2.5"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? t('common.loading') : t('auth.loginButton')}
          </button>

          <div className="text-center text-sm text-slate-500 pt-2">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-sky-600 hover:underline font-medium">
              {t('auth.registerLink')}
            </Link>
          </div>

          <div className="relative flex items-center gap-3 pt-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">{t('auth.orContinueGuest')}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full btn-secondary text-sm py-2.5"
          >
            {t('auth.guestMode')}
          </button>
        </form>
      </div>
    </div>
  )
}

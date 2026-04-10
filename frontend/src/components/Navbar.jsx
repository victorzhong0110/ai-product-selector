import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, Plus, Layers, Sparkles, Settings, LogIn, LogOut, User, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LangContext'

export function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t, lang, setLang, LANGUAGES } = useLanguage()

  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const langRef = useRef(null)
  const userRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  const navItems = [
    { to: '/',         label: t('nav.dashboard'), icon: BarChart3, exact: true },
    { to: '/analyses', label: t('nav.analyses'),  icon: Layers },
  ]

  const handleLogout = () => {
    logout()
    setUserOpen(false)
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">{t('nav.appName')}</h1>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">{t('nav.appSubtitle')}</p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200"
              >
                <span>{currentLang.flag}</span>
                <span className="hidden sm:inline">{currentLang.label}</span>
                <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[130px] z-50">
                  {LANGUAGES.map(({ code, label, flag }) => (
                    <button
                      key={code}
                      onClick={() => { setLang(code); setLangOpen(false) }}
                      className={clsx(
                        'w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors',
                        lang === code
                          ? 'bg-sky-50 text-sky-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <span>{flag}</span>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Settings */}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                clsx(
                  'p-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                )
              }
              title={t('nav.settings')}
            >
              <Settings size={18} />
            </NavLink>

            {/* Auth: user menu or login button */}
            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{user.username?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="hidden sm:inline max-w-[80px] truncate">{user.username}</span>
                  <ChevronDown size={12} className={`transition-transform ${userOpen ? 'rotate-180' : ''}`} />
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px] z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400">{t('settings.email')}</p>
                      <p className="text-sm text-slate-700 font-medium truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setUserOpen(false); navigate('/settings') }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                    >
                      <Settings size={14} />
                      {t('nav.settings')}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                    >
                      <LogOut size={14} />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200"
              >
                <LogIn size={15} />
                <span className="hidden sm:inline">{t('nav.login')}</span>
              </button>
            )}

            {/* New Analysis CTA */}
            <button
              onClick={() => navigate('/new')}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">{t('nav.newAnalysis')}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

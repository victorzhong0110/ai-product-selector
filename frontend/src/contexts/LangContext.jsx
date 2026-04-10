import React, { createContext, useContext, useState, useCallback } from 'react'
import { translations, LANGUAGES } from '../i18n'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const stored = localStorage.getItem('app_lang')
    return stored && translations[stored] ? stored : 'zh'
  })

  const setLang = useCallback((code) => {
    if (translations[code]) {
      localStorage.setItem('app_lang', code)
      setLangState(code)
    }
  }, [])

  /**
   * Translate a key, optionally with variable substitution.
   * Usage: t('nav.dashboard') or t('list.subtitle', { count: 42 })
   */
  const t = useCallback((key, vars = {}) => {
    const dict = translations[lang] || translations['zh']
    let str = dict[key] || translations['zh'][key] || key
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v)
    })
    return str
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t, LANGUAGES }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLanguage must be used within LangProvider')
  return ctx
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      // Set token on the axios instance for this request
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res)
    } catch {
      localStorage.removeItem('auth_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('auth_token', res.token)
    setUser(res.user)
    return res.user
  }

  const register = async (email, username, password) => {
    const res = await api.post('/auth/register', { email, username, password })
    localStorage.setItem('auth_token', res.token)
    setUser(res.user)
    return res.user
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, reload: loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

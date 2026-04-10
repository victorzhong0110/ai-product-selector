import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LangProvider } from './contexts/LangContext'
import { Navbar } from './components/Navbar'
import { Dashboard } from './pages/Dashboard'
import { AnalysisList } from './pages/AnalysisList'
import { AnalysisDetail } from './pages/AnalysisDetail'
import { NewAnalysis } from './pages/NewAnalysis'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Settings } from './pages/Settings'

function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/analyses"     element={<AnalysisList />} />
          <Route path="/analyses/:id" element={<AnalysisDetail />} />
          <Route path="/new"          element={<NewAnalysis />} />
          <Route path="/settings"     element={<Settings />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <Routes>
          {/* Auth pages — no Navbar */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Main app shell */}
          <Route path="/*"        element={<AppShell />} />
        </Routes>
      </AuthProvider>
    </LangProvider>
  )
}

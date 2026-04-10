import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, Search, Plus, Layers, Sparkles } from 'lucide-react'
import clsx from 'clsx'

export function Navbar() {
  const navigate = useNavigate()

  const navItems = [
    { to: '/', label: '仪表盘', icon: BarChart3, exact: true },
    { to: '/analyses', label: '选品库', icon: Layers },
  ]

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">AI 选品工具</h1>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Cross-border Intelligence</p>
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

          {/* CTA */}
          <button
            onClick={() => navigate('/new')}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            新建分析
          </button>
        </div>
      </div>
    </nav>
  )
}

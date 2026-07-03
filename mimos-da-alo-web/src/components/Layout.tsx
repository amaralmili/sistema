import {
  Bell,
  LayoutGrid,
  LogOut,
  Package,
  Receipt,
  Ticket,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext.tsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Painel', icon: LayoutGrid },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/vendas', label: 'Vendas', icon: Receipt },
  { to: '/promissorias', label: 'Promissórias', icon: Ticket },
  { to: '/notificacoes', label: 'Notificações', icon: Bell },
]

export function Layout({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="flex w-64 shrink-0 flex-col border-r border-sand bg-surface">
        <div className="flex items-center gap-2.5 border-b border-sand px-6 py-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-wine text-cream">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3c-1.5 2-1.5 4 0 6-1.5-2-3.5-2-5 0s0 4 2 5c-2.5-.5-4.5.5-5 3 .5-2.5-.5-4.5-3-5 2.5.5 4.5-.5 5-3-2 1-4 1-6-.5C1.5 6.5 3.5 4.5 6 5c-.5-2.5.5-4.5 3-5-2.5.5-4.5-.5-5-3 2.5.5 4.5-.5 5-3-1 2-1 4 .5 6C10 2 12 2 12 3z"
                fill="currentColor"
              />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-medium italic text-wine-dark">Mimos da Alô</p>
            <p className="text-[11px] uppercase tracking-wide text-muted">Gestão da loja</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-wine text-cream shadow-soft'
                    : 'text-ink/70 hover:bg-blush hover:text-wine-dark'
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sand px-4 py-4">
          <div className="mb-3 px-2">
            <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <button
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-rust/10 hover:text-rust"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-medium text-wine-dark">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}

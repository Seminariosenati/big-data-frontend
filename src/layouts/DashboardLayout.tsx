import type { ReactNode } from 'react'
import {
  Database,
  LayoutDashboard,
  UploadCloud,
  Table2,
  FileBarChart2,
  Settings,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react'

export type DashboardSection = 'resumen' | 'cargar' | 'explorar' | 'reportes' | 'ajustes'

interface NavItem {
  key: DashboardSection
  label: string
  icon: typeof LayoutDashboard
}

const NAV_ITEMS: NavItem[] = [
  { key: 'resumen', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'cargar', label: 'Cargar datos', icon: UploadCloud },
  { key: 'explorar', label: 'Limpieza de datos', icon: Table2 },
  { key: 'reportes', label: 'Reportes', icon: FileBarChart2 },
  { key: 'ajustes', label: 'Ajustes', icon: Settings },
]

interface DashboardLayoutProps {
  active: DashboardSection
  onNavigate: (section: DashboardSection) => void
  title: string
  subtitle: string
  headerAction?: ReactNode
  isLight: boolean
  onToggleTheme: () => void
  onLogout: () => void
  children: ReactNode
}

export default function DashboardLayout({
  active,
  onNavigate,
  title,
  subtitle,
  headerAction,
  isLight,
  onToggleTheme,
  onLogout,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="brand-mark">
            <Database size={18} strokeWidth={2.2} />
          </span>
          <div>
            <div className="dash-brand-name">Datalume</div>
            <div className="dash-brand-tag">PANEL DE DATOS</div>
          </div>
        </div>

        <nav className="dash-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                className={`dash-nav-item ${active === item.key ? 'active' : ''}`}
                onClick={() => onNavigate(item.key)}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="dash-sidebar-footer">
          <button className="dash-theme-toggle" onClick={onToggleTheme}>
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
            {isLight ? 'Modo oscuro' : 'Modo claro'}
          </button>

          <div className="dash-user">
            <span className="dash-user-avatar">MC</span>
            <div>
              <div className="dash-user-name">maria.cruz@empresa.com</div>
              <div className="dash-user-role">Cuenta de demostración</div>
            </div>
          </div>

          <button className="dash-logout" onClick={onLogout}>
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          {headerAction}
        </header>

        <div className="dash-content">{children}</div>
      </div>
    </div>
  )
}
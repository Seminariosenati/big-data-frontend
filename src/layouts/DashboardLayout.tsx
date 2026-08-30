import type { ReactNode } from 'react'
import {
  Database,
  LayoutDashboard,
  UploadCloud,
  Table2,
  FileBarChart2,
  Settings,
  TrendingUp,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react'

export type DashboardSection = 'resumen' | 'cargar' | 'explorar' | 'ventas' | 'reportes' | 'ajustes'

interface NavItem {
  key: DashboardSection
  label: string
  icon: typeof LayoutDashboard
}

const ALL_NAV_ITEMS: NavItem[] = [
  { key: 'resumen', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'cargar', label: 'Cargar datos', icon: UploadCloud },
  { key: 'explorar', label: 'Limpieza de datos', icon: Table2 },
  { key: 'ventas', label: 'Ventas', icon: TrendingUp },
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
  userEmail?: string
  userName?: string
  /** Qué secciones se muestran en el menú. Si no se pasa, se muestran todas
   * (comportamiento del admin). El analista recibe una lista filtrada según
   * los permisos configurados en Ajustes. */
  visibleSections?: DashboardSection[]
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
  userEmail,
  userName,
  visibleSections,
  children,
}: DashboardLayoutProps) {
  const initials = userName
    ? userName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : (userEmail?.[0] ?? '?').toUpperCase()

  const navItems = visibleSections
    ? ALL_NAV_ITEMS.filter((item) => visibleSections.includes(item.key))
    : ALL_NAV_ITEMS

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
          {navItems.map((item) => {
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
            <span className="dash-user-avatar">{initials}</span>
            <div>
              <div className="dash-user-name">{userEmail ?? 'Cargando…'}</div>
              <div className="dash-user-role">{userName || 'Sin nombre'}</div>
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
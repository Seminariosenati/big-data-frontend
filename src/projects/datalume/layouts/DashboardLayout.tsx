import { useEffect, useState, type ReactNode } from 'react'
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
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
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

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dash_sidebar_collapsed') === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem('dash_sidebar_collapsed', collapsed ? '1' : '0')
    } catch {
      // ignore
    }
  }, [collapsed])

  // Al navegar a otra sección en móvil, cierra el menú desplegable.
  useEffect(() => {
    setMobileOpen(false)
  }, [active])

  return (
    <div className={`dash-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <button
        type="button"
        className="dash-mobile-toggle"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        <span className="dash-brand-name">Datalume</span>
      </button>

      <aside className={`dash-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="dash-brand">
          <span className="brand-mark">
            <Database size={18} strokeWidth={2.2} />
          </span>
          <div className="dash-brand-text">
            <div className="dash-brand-name">Datalume</div>
            <div className="dash-brand-tag">PANEL DE DATOS</div>
          </div>
          <button
            type="button"
            className="dash-collapse-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        <nav className="dash-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                className={`dash-nav-item ${active === item.key ? 'active' : ''}`}
                onClick={() => onNavigate(item.key)}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={17} strokeWidth={2} />
                <span className="dash-nav-label">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="dash-sidebar-footer">
          <button className="dash-theme-toggle" onClick={onToggleTheme} title={collapsed ? (isLight ? 'Modo oscuro' : 'Modo claro') : undefined}>
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
            <span className="dash-nav-label">{isLight ? 'Modo oscuro' : 'Modo claro'}</span>
          </button>

          <div className="dash-user">
            <span className="dash-user-avatar">{initials}</span>
            <div className="dash-nav-label">
              <div className="dash-user-name">{userEmail ?? 'Cargando…'}</div>
              <div className="dash-user-role">{userName || 'Sin nombre'}</div>
            </div>
          </div>

          <button className="dash-logout" onClick={onLogout} title={collapsed ? 'Cerrar sesión' : undefined}>
            <LogOut size={15} />
            <span className="dash-nav-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="dash-sidebar-scrim" onClick={() => setMobileOpen(false)} />}

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
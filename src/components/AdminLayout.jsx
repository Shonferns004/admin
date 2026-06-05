import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'

const navItems = [
  { section: 'Content', icon: 'dashboard_customize', items: [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Projects', path: '/projects', icon: 'folder' },
    { label: 'Testimonials', path: '/testimonials', icon: 'format_quote' },
    { label: 'Blog', path: '/blog', icon: 'article' },
    { label: 'Clients', path: '/clients', icon: 'groups' },
  ]},
  { section: 'Inbox', icon: 'inbox', items: [
    { label: 'Messages', path: '/messages', icon: 'mail' },
    { label: 'Leads', path: '/leads', icon: 'track_changes' },
    { label: 'Subscribers', path: '/subscribers', icon: 'subscriptions' },
  ]},
  { section: 'Settings', icon: 'settings', items: [
    { label: 'Media', path: '/media', icon: 'photo_library' },
    { label: 'Activity Log', path: '/activity', icon: 'history' },
  ]},
]

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(null)

  const user = JSON.parse(localStorage.getItem('crabstack_user') || '{}')

  useEffect(() => {
    setMobileSidebarOpen(false)
    setActiveTab(null)
  }, [location.pathname])

  const handleLogout = async () => {
    await api.logout().catch(() => {})
    localStorage.removeItem('crabstack_token')
    localStorage.removeItem('crabstack_user')
    navigate('/login')
  }

  const currentSection = navItems.find(g => g.items.some(i => i.path === location.pathname))

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <button type="button" onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden" aria-label="Close sidebar overlay" />
      )}

      {/* Mobile bottom sheet */}
      {activeTab && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setActiveTab(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 rounded-t-2xl p-4 pb-8 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
            <div className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-3 px-2">{activeTab.section}</div>
            <div className="space-y-1">
              {activeTab.items.map(item => {
                const active = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setActiveTab(null)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                      active ? 'bg-primary/10 text-primary font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col shrink-0 bg-zinc-900 border-r border-zinc-800 transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          {!collapsed && <span className="font-bold text-lg tracking-tight">Crabstack</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="text-zinc-400 hover:text-white p-1" aria-label="Toggle sidebar">
            <span className="material-symbols-outlined text-xl">{collapsed ? 'menu_open' : 'menu'}</span>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 space-y-6">
          {navItems.map((group) => (
            <div key={group.section}>
              {!collapsed && <div className="px-4 mb-1 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">{group.section}</div>}
              {group.items.map((item) => {
                const active = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      active ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    {!collapsed && item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold">
              {user.username?.[0]?.toUpperCase() || 'A'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{user.username}</div>
                <div className="text-[10px] text-zinc-500">{user.role}</div>
              </div>
            )}
            <button onClick={handleLogout} className="text-zinc-500 hover:text-primary" title="Logout">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between h-14 px-4 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur shrink-0">
          <div className="font-bold text-sm tracking-tight">Crabstack</div>
          <button onClick={handleLogout} className="text-zinc-400 hover:text-primary p-1" title="Logout">
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>

        {/* Mobile bottom tab bar */}
        <div className="md:hidden flex items-center border-t border-zinc-800 bg-zinc-900 shrink-0 safe-area-pb">
          {navItems.map(group => {
            const isActive = currentSection?.section === group.section
            return (
              <button
                key={group.section}
                onClick={() => setActiveTab(activeTab?.section === group.section ? null : group)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                  isActive ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">{group.icon}</span>
                {group.section}
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}

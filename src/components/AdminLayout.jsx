import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'

const navItems = [
  { section: 'Content', items: [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Projects', path: '/projects', icon: 'folder' },
    { label: 'Services', path: '/services', icon: 'build' },
    { label: 'Testimonials', path: '/testimonials', icon: 'format_quote' },
    { label: 'FAQ', path: '/faq', icon: 'help' },
    { label: 'Blog', path: '/blog', icon: 'article' },
    { label: 'Clients', path: '/clients', icon: 'groups' },
    { label: 'Pages', path: '/pages', icon: 'description' },
  ]},
  { section: 'Inbox', items: [
    { label: 'Messages', path: '/messages', icon: 'mail' },
    { label: 'Leads', path: '/leads', icon: 'track_changes' },
    { label: 'Bookings', path: '/bookings', icon: 'calendar_month' },
    { label: 'Subscribers', path: '/subscribers', icon: 'subscriptions' },
  ]},
  { section: 'Settings', items: [
    { label: 'Navigation', path: '/navigation', icon: 'menu' },
    { label: 'SEO', path: '/seo', icon: 'search' },
    { label: 'Media', path: '/media', icon: 'photo_library' },
    { label: 'Groq Keys', path: '/groq-keys', icon: 'vpn_key' },
    { label: 'Site Settings', path: '/settings', icon: 'settings' },
    { label: 'Activity Log', path: '/activity', icon: 'history' },
    { label: 'Users', path: '/users', icon: 'admin_panel_settings' },
  ]},
]

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const user = JSON.parse(localStorage.getItem('crabstack_user') || '{}')

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await api.logout().catch(() => {})
    localStorage.removeItem('crabstack_token')
    localStorage.removeItem('crabstack_user')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {mobileSidebarOpen && (
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 md:static md:z-auto ${
          collapsed ? 'md:w-16' : 'md:w-64'
        } ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-200 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          {(!collapsed || mobileSidebarOpen) && <span className="font-bold text-lg tracking-tight">Crabstack</span>}
          <button onClick={() => setMobileSidebarOpen(false)} className="text-zinc-400 hover:text-white p-1 md:hidden" aria-label="Close sidebar">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="text-zinc-400 hover:text-white p-1 hidden md:block" aria-label="Toggle sidebar">
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
                    onClick={() => setMobileSidebarOpen(false)}
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

      <main className="flex-1 overflow-y-auto bg-zinc-950">
        <div className="md:hidden sticky top-0 z-20 h-16 px-4 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="text-zinc-300 hover:text-white p-1"
            aria-label="Open sidebar"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <div className="font-semibold">Admin Panel</div>
          <div className="w-8" />
        </div>
        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

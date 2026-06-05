import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'

export default function ActivityLog() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const data = await api.get('/activity')
        setItems(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const actionIcon = (action) => {
    const icons = { create: 'add_circle', update: 'edit', delete: 'delete', login: 'login' }
    return icons[action] || 'circle'
  }

  const actionColor = (action) => {
    const colors = { create: 'text-green-400', update: 'text-blue-400', delete: 'text-red-400', login: 'text-yellow-400' }
    return colors[action] || 'text-zinc-400'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Activity Log</h1>
      {loading ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-zinc-800/50 animate-pulse">
                <div className="size-5 bg-zinc-800 rounded" />
                <div className="h-3 bg-zinc-800 rounded w-16" />
                <div className="h-3 bg-zinc-800 rounded w-20" />
                <div className="h-3 bg-zinc-800 rounded w-24 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="space-y-0">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/20 text-sm">
                <span className={`material-symbols-outlined text-lg ${actionColor(item.action)}`}>{actionIcon(item.action)}</span>
                <span className="capitalize text-zinc-300 font-medium">{item.action}</span>
                <span className="text-zinc-500">{item.entity_type}</span>
                <span className="text-zinc-600 ml-auto text-xs">{new Date(item.created_at).toLocaleString()}</span>
              </div>
            ))}
            {items.length === 0 && <div className="text-center text-zinc-500 py-12">No activity yet</div>}
          </div>
        </div>
      )}
    </div>
  )
}

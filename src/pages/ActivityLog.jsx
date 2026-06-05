import { useState, useEffect, useMemo } from 'react'
import { api } from '../api'

const actionMeta = {
  create: { icon: 'add_circle', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  update: { icon: 'edit', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  delete: { icon: 'delete', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  login: { icon: 'login', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
}

export default function ActivityLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [search, setSearch] = useState('')
  const [lastRefreshed, setLastRefreshed] = useState(null)

  useEffect(() => { load() }, [page, limit, filterAction, filterEntity])

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit })
      if (filterAction) params.set('action', filterAction)
      if (filterEntity) params.set('entity_type', filterEntity)
      const res = await api.get(`/activity?${params}`)
      setLogs(res.data || [])
      setTotal(res.total || 0)
      setLastRefreshed(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs
    const q = search.toLowerCase()
    return logs.filter(l =>
      (l.action || '').toLowerCase().includes(q) ||
      (l.entity_type || '').toLowerCase().includes(q) ||
      (l.entity_id || '').toLowerCase().includes(q) ||
      (l.user_id || '').toLowerCase().includes(q) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(q)
    )
  }, [logs, search])

  const entityTypes = useMemo(() => [...new Set(logs.map(l => l.entity_type).filter(Boolean))], [logs])
  const actionTypes = useMemo(() => [...new Set(logs.map(l => l.action).filter(Boolean))], [logs])

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Activity Log
          </h1>
          {lastRefreshed && (
            <p className="text-zinc-500 text-xs mt-1">
              {total} entries &middot; Last refreshed {lastRefreshed.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button onClick={load} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
          <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 material-symbols-outlined text-base">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white" />
          </div>
          <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1) }} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="">All Actions</option>
            {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterEntity} onChange={e => { setFilterEntity(e.target.value); setPage(1) }} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="">All Entities</option>
            {entityTypes.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800/50 animate-pulse">
                <div className="size-6 bg-zinc-800 rounded-full" />
                <div className="h-3 bg-zinc-800 rounded w-16" />
                <div className="h-3 bg-zinc-800 rounded w-20" />
                <div className="h-3 bg-zinc-800 rounded w-32" />
                <div className="h-3 bg-zinc-800 rounded w-28 ml-auto" />
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-zinc-700 mb-3">history</span>
            <p className="text-zinc-500">No activity found</p>
            {(filterAction || filterEntity || search) && (
              <button onClick={() => { setFilterAction(''); setFilterEntity(''); setSearch(''); setPage(1) }} className="text-primary text-sm hover:underline mt-2">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="divide-y divide-zinc-800/50">
              {filteredLogs.map((item) => {
                const meta = actionMeta[item.action] || { icon: 'circle', color: 'text-zinc-400', bg: 'bg-zinc-800', border: 'border-zinc-700' }
                return (
                  <div key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-zinc-800/20 transition-colors">
                    <div className={`size-8 rounded-full ${meta.bg} ${meta.border} border flex items-center justify-center shrink-0 mt-0.5`}>
                      <span className={`material-symbols-outlined text-base ${meta.color}`}>{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold capitalize ${meta.color}`}>{item.action}</span>
                        <span className="text-zinc-500 text-xs bg-zinc-800 px-2 py-0.5 rounded">{item.entity_type}</span>
                        {item.user_id && (
                          <span className="text-zinc-400 text-xs">by {item.user_id}</span>
                        )}
                      </div>
                      {item.entity_id && (
                        <div className="text-xs text-zinc-600 font-mono mt-1 truncate" title={item.entity_id}>
                          ID: {item.entity_id}
                        </div>
                      )}
                      {item.details && Object.keys(item.details).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400">Details</summary>
                          <pre className="text-xs text-zinc-500 mt-1 bg-zinc-950 rounded p-2 overflow-x-auto">{JSON.stringify(item.details, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                    <div className="text-xs text-zinc-600 shrink-0 pt-1">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-zinc-800">
              <div className="text-xs text-zinc-500">
                Showing {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-semibold">
                  Previous
                </button>
                <span className="text-xs text-zinc-400">Page {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-semibold">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

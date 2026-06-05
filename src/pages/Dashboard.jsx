import { useState, useEffect, useMemo } from 'react'
import { api } from '../api'
import { SkeletonCard } from '../components/Skeleton'

function toDayKey(value) {
  const d = new Date(value || '')
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayLabel(dayKey) {
  const d = new Date(`${dayKey}T00:00:00`)
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

function getLast7DayKeys() {
  const out = []
  const now = new Date()
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    out.push(toDayKey(d))
  }
  return out
}

function ratio(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function avg(values) {
  if (!values.length) return 0
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length)
}

function buildCountMap(items, keyFn, defaultLabel = 'unknown') {
  const map = {}
  for (const item of items) {
    const key = String(keyFn(item) || defaultLabel).trim().toLowerCase()
    map[key] = (map[key] || 0) + 1
  }
  return map
}

function GraphSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
      <div className="h-4 w-36 bg-zinc-800 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-3 w-full bg-zinc-800 rounded" />
        <div className="h-3 w-10/12 bg-zinc-800 rounded" />
        <div className="h-3 w-8/12 bg-zinc-800 rounded" />
      </div>
    </div>
  )
}

function DistributionChart({ title, data }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1])
  const max = entries.length ? entries[0][1] : 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">{title}</h3>
      {entries.length === 0 ? (
        <div className="text-zinc-500 text-sm">No data</div>
      ) : (
        <div className="space-y-3">
          {entries.map(([label, value]) => (
            <div key={`${title}-${label}`}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="uppercase tracking-wide text-zinc-400">{label.replace(/_/g, ' ')}</span>
                <span className="text-zinc-300 font-semibold">{value}</span>
              </div>
              <div className="h-2 rounded bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-primary/80"
                  style={{ width: `${max ? Math.max(8, Math.round((value / max) * 100)) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TrendChart({ points }) {
  const max = points.length ? Math.max(...points.map((p) => p.value)) : 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Leads In Last 7 Days</h3>
      <div className="grid grid-cols-7 gap-2 items-end h-40">
        {points.map((point) => (
          <div key={point.key} className="flex flex-col items-center gap-2">
            <div className="text-[10px] text-zinc-500">{point.value}</div>
            <div className="w-full h-28 bg-zinc-800 rounded relative overflow-hidden">
              <div
                className="absolute bottom-0 left-0 right-0 bg-emerald-400/85"
                style={{ height: `${max ? Math.max(6, Math.round((point.value / max) * 100)) : 0}%` }}
              />
            </div>
            <div className="text-[10px] text-zinc-500">{dayLabel(point.key)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/projects').catch(() => []),
      api.get('/contacts?unread=true').catch(() => []),
      api.get('/subscribers').catch(() => []),
      api.get('/testimonials').catch(() => []),
      api.get('/blog').catch(() => []),
      api.get('/clients').catch(() => []),
      api.get('/leads?include_deleted=false&limit=1000').catch(() => []),
    ]).then(([projects, contacts, subscribers, testimonials, blog, clients, leadsData]) => {
      const safeLeads = Array.isArray(leadsData) ? leadsData : []
      setLeads(safeLeads)
      setStats({
        projects: Array.isArray(projects) ? projects.length : 0,
        messages: Array.isArray(contacts) ? contacts.length : 0,
        subscribers: Array.isArray(subscribers) ? subscribers.length : 0,
        testimonials: Array.isArray(testimonials) ? testimonials.length : 0,
        blog: Array.isArray(blog) ? blog.length : 0,
        clients: Array.isArray(clients) ? clients.length : 0,
        leads: safeLeads.length,
      })
    }).finally(() => setLoading(false))
  }, [])

  const leadAnalytics = useMemo(() => {
    const total = leads.length
    const verified = leads.filter((lead) => lead.contact_status === 'verified').length
    const fitScores = leads
      .map((lead) => Number(lead.fit_score))
      .filter((v) => Number.isFinite(v))
    const priorityMap = buildCountMap(leads, (lead) => lead.priority || 'unknown')
    const statusMap = buildCountMap(leads, (lead) => lead.status || 'new')
    const sourceMap = buildCountMap(leads, (lead) => lead.source || 'manual')

    const keys = getLast7DayKeys()
    const byDay = {}
    for (const key of keys) byDay[key] = 0
    for (const lead of leads) {
      const key = toDayKey(lead.created_at)
      if (key && byDay[key] !== undefined) byDay[key] += 1
    }
    const trend = keys.map((key) => ({ key, value: byDay[key] || 0 }))

    return {
      total,
      verified,
      verifiedPct: ratio(verified, total),
      avgFit: avg(fitScores),
      priorityMap,
      statusMap,
      sourceMap,
      trend,
    }
  }, [leads])

  const cards = [
    { label: 'Projects', key: 'projects', icon: 'folder', color: 'text-blue-400' },
    { label: 'Unread Messages', key: 'messages', icon: 'mail', color: 'text-green-400' },
    { label: 'Leads', key: 'leads', icon: 'track_changes', color: 'text-emerald-400' },
    { label: 'Subscribers', key: 'subscribers', icon: 'subscriptions', color: 'text-purple-400' },
    { label: 'Testimonials', key: 'testimonials', icon: 'format_quote', color: 'text-orange-400' },
    { label: 'Blog Posts', key: 'blog', icon: 'article', color: 'text-cyan-400' },
    { label: 'Clients', key: 'clients', icon: 'groups', color: 'text-indigo-400' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-zinc-500 text-sm mb-8">Overview and lead analytics</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
        ) : stats ? (
          cards.map(card => (
            <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center gap-4">
              <span className={`material-symbols-outlined text-3xl ${card.color}`}>{card.icon}</span>
              <div>
                <div className="text-3xl font-bold">{stats[card.key]}</div>
                <div className="text-zinc-500 text-sm">{card.label}</div>
              </div>
            </div>
          ))
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Lead Verification</div>
              <div className="text-3xl font-bold text-emerald-300">{leadAnalytics.verifiedPct}%</div>
              <div className="text-sm text-zinc-400 mt-1">{leadAnalytics.verified} / {leadAnalytics.total} verified</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Average Fit Score</div>
              <div className="text-3xl font-bold">{leadAnalytics.avgFit}</div>
              <div className="text-sm text-zinc-400 mt-1">Across all active leads</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Hot Leads</div>
              <div className="text-3xl font-bold text-red-400">{leadAnalytics.priorityMap.hot || 0}</div>
              <div className="text-sm text-zinc-400 mt-1">High-priority opportunities</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Follow Up Queue</div>
              <div className="text-3xl font-bold text-amber-300">{leadAnalytics.statusMap.follow_up || 0}</div>
              <div className="text-sm text-zinc-400 mt-1">Leads marked for follow-up</div>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        {loading ? (
          <>
            <GraphSkeleton />
            <GraphSkeleton />
          </>
        ) : (
          <>
            <DistributionChart title="Leads By Priority" data={leadAnalytics.priorityMap} />
            <DistributionChart title="Leads By Status" data={leadAnalytics.statusMap} />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
        {loading ? (
          <>
            <GraphSkeleton />
            <GraphSkeleton />
          </>
        ) : (
          <>
            <DistributionChart title="Leads By Source" data={leadAnalytics.sourceMap} />
            <TrendChart points={leadAnalytics.trend} />
          </>
        )}
      </div>
    </div>
  )
}

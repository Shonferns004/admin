import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'

const statusColors = { pending: 'bg-yellow-500/10 text-yellow-400', confirmed: 'bg-green-500/10 text-green-400', cancelled: 'bg-red-500/10 text-red-400' }

export default function Bookings() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/bookings')
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, status) => {
    await api.patch(`/bookings/${id}`, { status })
    load()
  }

  const remove = async (id) => {
    if (confirm('Delete booking?')) { await api.delete(`/bookings/${id}`); load() }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Bookings</h1>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-zinc-800 rounded w-1/3" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
                <div className="h-3 bg-zinc-800 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{item.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[item.status] || statusColors.pending}`}>{item.status}</span>
                  </div>
                  <p className="text-zinc-400 text-sm">{item.email}{item.phone && ` · ${item.phone}`}</p>
                  {item.service_type && <p className="text-primary text-xs mt-1 font-bold">{item.service_type}</p>}
                  {(item.date || item.time) && <p className="text-zinc-500 text-xs mt-1">{item.date} {item.time}</p>}
                  {item.message && <p className="text-zinc-500 text-sm mt-2 bg-zinc-800/50 rounded p-3">{item.message}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {item.status !== 'confirmed' && <button onClick={() => updateStatus(item.id, 'confirmed')} className="text-green-400 hover:text-green-300"><span className="material-symbols-outlined">check_circle</span></button>}
                  {item.status !== 'cancelled' && <button onClick={() => updateStatus(item.id, 'cancelled')} className="text-red-400 hover:text-red-300"><span className="material-symbols-outlined">cancel</span></button>}
                  <button onClick={() => remove(item.id)} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center text-zinc-500 py-12">No bookings yet</div>}
        </div>
      )}
    </div>
  )
}

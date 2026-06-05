import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Subscribers() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/subscribers')
      if (Array.isArray(data)) {
        setItems(data)
      }
    } catch (e) {
      console.error('Failed to load subscribers', e)
    }
    setLoading(false)
  }

  const remove = async (id) => {
    if (confirm('Remove subscriber?')) {
      try {
        await api.delete(`/subscribers/${id}`)
        load()
      } catch (e) {
        console.error('Failed to remove subscriber', e)
      }
    }
  }

  const exportCSV = () => {
    if (items.length === 0) return
    const csv = 'Email,Date\n' + items.map(s => `${s.email},${s.created_at}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'subscribers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Subscribers ({items.length})</h1>
        <button onClick={exportCSV} className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">download</span> Export CSV
        </button>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center text-zinc-500 py-8">Loading subscribers...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium hidden md:table-cell">Subscribed</th>
                <th className="p-4 font-medium w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(s => (
                <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="p-4">{s.email}</td>
                  <td className="p-4 text-zinc-400 hidden md:table-cell">{s.created_at ? new Date(s.created_at).toLocaleDateString() : '-'}</td>
                  <td className="p-4">
                    <button onClick={() => remove(s.id)} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-zinc-500">No subscribers yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

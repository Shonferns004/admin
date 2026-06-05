import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'

export default function Testimonials() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ quote: '', name: '', role: '', sort_order: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/testimonials')
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => { setEditing('new'); setForm({ quote: '', name: '', role: '', sort_order: items.length }) }
  const openEdit = (item) => { setEditing(item.id); setForm({ ...item }) }

  const save = async () => {
    if (editing === 'new') await api.post('/testimonials', form)
    else await api.put(`/testimonials/${editing}`, form)
    setEditing(null); load()
  }

  const remove = async (id) => {
    if (confirm('Delete?')) { await api.delete(`/testimonials/${id}`); load() }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <button onClick={openNew} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-bold">+ New</button>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing === 'new' ? 'New Testimonial' : 'Edit Testimonial'}</h2>
            <textarea placeholder="Quote" value={form.quote} onChange={e => setForm({...form, quote: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white h-24" />
            <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <input placeholder="Role" value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={save} className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-bold">Save</button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start gap-4 animate-pulse">
              <div className="size-6 bg-zinc-800 rounded mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-2/3" />
                <div className="h-3 bg-zinc-800 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start gap-4">
              <span className="material-symbols-outlined text-primary text-2xl mt-1">format_quote</span>
              <div className="flex-1 min-w-0">
                <p className="italic text-zinc-300">{item.quote}</p>
                <p className="text-sm font-bold mt-2">{item.name}</p>
                {item.role && <p className="text-xs text-zinc-500">{item.role}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(item)} className="text-zinc-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                <button onClick={() => remove(item.id)} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center text-zinc-500 py-12">No testimonials yet</div>}
        </div>
      )}
    </div>
  )
}

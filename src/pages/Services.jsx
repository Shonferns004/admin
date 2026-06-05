import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'

const icons = ['code', 'palette', 'trending_up', 'campaign', 'search', 'architecture', 'rocket_launch', 'design_services', 'support', 'settings']

export default function Services() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ icon: 'code', title: '', description: '', sort_order: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/services')
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setEditing('new')
    setForm({ icon: 'code', title: '', description: '', sort_order: items.length })
  }

  const openEdit = (item) => {
    setEditing(item.id)
    setForm({ ...item })
  }

  const save = async () => {
    if (editing === 'new') await api.post('/services', form)
    else await api.put(`/services/${editing}`, form)
    setEditing(null)
    load()
  }

  const remove = async (id) => {
    if (confirm('Delete this service?')) {
      await api.delete(`/services/${id}`)
      load()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Services</h1>
        <button onClick={openNew} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-bold">+ New</button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing === 'new' ? 'New Service' : 'Edit Service'}</h2>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {icons.map(ic => (
                  <button key={ic} onClick={() => setForm({...form, icon: ic})} className={`p-2 rounded-lg border ${form.icon === ic ? 'border-primary bg-primary/10' : 'border-zinc-700'}`}>
                    <span className="material-symbols-outlined">{ic}</span>
                  </button>
                ))}
              </div>
            </div>
            <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white h-24" />
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={save} className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex gap-4 animate-pulse">
              <div className="size-8 bg-zinc-800 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-1/3" />
                <div className="h-3 bg-zinc-800 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{item.description}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(item)} className="text-zinc-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                <button onClick={() => remove(item.id)} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="col-span-2 text-center text-zinc-500 py-12">No services yet</div>}
        </div>
      )}
    </div>
  )
}

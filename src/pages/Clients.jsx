import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'
import DeleteModal from '../components/DeleteModal'

export default function Clients() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', logo_url: '', description: '', website: '', project_history: '', sort_order: 0 })
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/clients')
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => { setEditing('new'); setForm({ name: '', logo_url: '', description: '', website: '', project_history: '', sort_order: items.length }) }
  const openEdit = (item) => { setEditing(item.id); setForm({ ...item }) }

  const save = async () => {
    if (editing === 'new') await api.post('/clients', form)
    else await api.put(`/clients/${editing}`, form)
    setEditing(null); load()
  }

  const remove = async (id) => {
    setDeleting(true)
    try {
      await api.delete(`/clients/${id}`)
      setItems(items.filter(i => i.id !== id))
      load()
    } catch (e) {
      console.error(e)
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button onClick={openNew} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-bold">+ New</button>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing === 'new' ? 'New Client' : 'Edit Client'}</h2>
            <input placeholder="Client Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <input placeholder="Logo URL" value={form.logo_url} onChange={e => setForm({...form, logo_url: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white h-20" />
            <input placeholder="Website URL" value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <textarea placeholder="Project History" value={form.project_history} onChange={e => setForm({...form, project_history: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white h-20" />
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
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4 animate-pulse">
              <div className="size-12 bg-zinc-800 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-1/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
              {item.logo_url && <img src={item.logo_url} alt="" className="size-12 rounded-lg object-cover bg-zinc-800 shrink-0" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-zinc-500 text-sm line-clamp-1">{item.description}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(item)} className="text-zinc-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                <button onClick={() => setDeleteTarget({ id: item.id, title: 'client' })} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center text-zinc-500 py-12">No clients yet</div>}
        </div>
      )}
      <DeleteModal open={!!deleteTarget} title={deleteTarget?.title || ''} deleting={deleting} onConfirm={() => remove(deleteTarget.id)} onCancel={() => { setDeleteTarget(null); setDeleting(false) }} />
    </div>
  )
}

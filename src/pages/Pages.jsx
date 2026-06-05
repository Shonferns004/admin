import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'

export default function Pages() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', slug: '', content: '', meta_title: '', meta_description: '', published: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/pages')
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => { setEditing('new'); setForm({ title: '', slug: '', content: '', meta_title: '', meta_description: '', published: false }) }
  const openEdit = (item) => { setEditing(item.id); setForm({ ...item }) }

  const save = async () => {
    if (editing === 'new') await api.post('/pages', form)
    else await api.put(`/pages/${editing}`, form)
    setEditing(null); load()
  }

  const remove = async (id) => {
    if (confirm('Delete?')) { await api.delete(`/pages/${id}`); load() }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Custom Pages</h1>
        <button onClick={openNew} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-bold">+ New</button>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl mx-4 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing === 'new' ? 'New Page' : 'Edit Page'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Page Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="col-span-2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
              <input placeholder="Slug (e.g. privacy-policy)" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
              <input placeholder="Meta Title" value={form.meta_title} onChange={e => setForm({...form, meta_title: e.target.value})} className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
              <textarea placeholder="Meta Description" value={form.meta_description} onChange={e => setForm({...form, meta_description: e.target.value})} className="col-span-2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white h-16" />
              <textarea placeholder="Content (HTML)" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="col-span-2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white h-64 font-mono text-sm" />
              <label className="flex items-center gap-2 text-zinc-400">
                <input type="checkbox" checked={form.published} onChange={e => setForm({...form, published: e.target.checked})} className="accent-primary" />
                Published
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={save} className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-bold">Save</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-left">
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium hidden md:table-cell">Slug</th>
              <th className="p-4 font-medium hidden lg:table-cell">Status</th>
              <th className="p-4 font-medium w-24">Actions</th>
            </tr>
          </thead>
          {loading ? (
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
            </tbody>
          ) : (
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="p-4">{item.title}</td>
                  <td className="p-4 text-zinc-400 font-mono text-xs hidden md:table-cell">/{item.slug}</td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${item.published ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {item.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="text-zinc-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button onClick={() => remove(item.id)} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No custom pages yet</td></tr>}
            </tbody>
          )}
        </table>
      </div>
    </div>
  )
}

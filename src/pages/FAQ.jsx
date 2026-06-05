import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'

export default function FAQ() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ question: '', answer: '', sort_order: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/faq')
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => { setEditing('new'); setForm({ question: '', answer: '', sort_order: items.length }) }
  const openEdit = (item) => { setEditing(item.id); setForm({ ...item }) }

  const save = async () => {
    if (editing === 'new') await api.post('/faq', form)
    else await api.put(`/faq/${editing}`, form)
    setEditing(null); load()
  }

  const remove = async (id) => {
    if (confirm('Delete?')) { await api.delete(`/faq/${id}`); load() }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">FAQ</h1>
        <button onClick={openNew} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-bold">+ New</button>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing === 'new' ? 'New FAQ' : 'Edit FAQ'}</h2>
            <input placeholder="Question" value={form.question} onChange={e => setForm({...form, question: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <textarea placeholder="Answer" value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white h-32" />
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={save} className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-bold">Save</button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
              <div className="space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-primary">{item.question}</h3>
                  <p className="text-zinc-400 text-sm mt-2">{item.answer}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(item)} className="text-zinc-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                  <button onClick={() => remove(item.id)} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center text-zinc-500 py-12">No FAQ items yet</div>}
        </div>
      )}
    </div>
  )
}

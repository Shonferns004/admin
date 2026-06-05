import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'
import DeleteModal from '../components/DeleteModal'

export default function Messages() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/contacts')
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (id) => {
    await api.patch(`/contacts/${id}`, { is_read: true })
    load()
  }

  const remove = async (id) => {
    setDeleting(true)
    try {
      await api.delete(`/contacts/${id}`)
      if (selected?.id === id) setSelected(null)
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
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2 animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
                <div className="h-3 bg-zinc-800 rounded w-2/3" />
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">No messages yet</div>
          ) : (
            items.map(item => (
              <div key={item.id} onClick={() => { setSelected(item); if (!item.is_read) markRead(item.id) }} className={`cursor-pointer bg-zinc-900 border rounded-xl p-4 transition-colors ${selected?.id === item.id ? 'border-primary' : 'border-zinc-800 hover:border-zinc-600'} ${!item.is_read ? 'border-l-primary border-l-4' : ''}`}>
                <div className="flex items-center gap-2">
                  {!item.is_read && <span className="size-2 rounded-full bg-primary shrink-0" />}
                  <h3 className="font-bold text-sm truncate">{item.name}</h3>
                </div>
                <p className="text-zinc-500 text-xs mt-1">{item.email}</p>
                <p className="text-zinc-500 text-sm mt-2 line-clamp-2">{item.message}</p>
                <p className="text-zinc-600 text-[10px] mt-2">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <p className="text-zinc-400 text-sm">{selected.email}</p>
                </div>
                <button onClick={() => setDeleteTarget({ id: selected.id, title: 'message' })} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined">delete</span></button>
              </div>
              <div className="text-[10px] text-zinc-600">{new Date(selected.created_at).toLocaleString()}</div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-zinc-300 whitespace-pre-wrap">{selected.message}</div>
              {selected.reply && (
                <div>
                  <div className="text-sm font-bold text-zinc-400 mb-2">Your Reply</div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-zinc-300">{selected.reply}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-zinc-600">Select a message</div>
          )}
        </div>
      </div>
      <DeleteModal open={!!deleteTarget} title={deleteTarget?.title || ''} deleting={deleting} onConfirm={() => remove(deleteTarget.id)} onCancel={() => { setDeleteTarget(null); setDeleting(false) }} />
    </div>
  )
}

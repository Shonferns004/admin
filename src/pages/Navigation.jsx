import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'

export default function Navigation() {
  const [items, setItems] = useState([])
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/navigation')
      setItems(data.sort((a, b) => a.sort_order - b.sort_order))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async () => {
    if (!newLabel || !newUrl) return
    items.push({ label: newLabel, url: newUrl, sort_order: items.length })
    await saveAll([...items])
    setNewLabel(''); setNewUrl('')
  }

  const remove = async (id) => {
    await saveAll(items.filter(i => i.id !== id))
  }

  const moveUp = (index) => {
    if (index === 0) return
    const newItems = [...items]
    ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
    saveAll(newItems)
  }

  const moveDown = (index) => {
    if (index === items.length - 1) return
    const newItems = [...items]
    ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
    saveAll(newItems)
  }

  const saveAll = async (newItems) => {
    const clean = newItems.map(({ label, url }) => ({ label, url }))
    const result = await api.put('/navigation', { items: clean })
    if (result) load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Navigation Menu</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
        <h3 className="font-bold mb-3">Add Link</h3>
        <div className="flex gap-2">
          <input placeholder="Label" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
          <input placeholder="URL (e.g. /about)" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
          <button onClick={addItem} className="bg-primary hover:bg-primary/80 text-white px-4 rounded-lg font-bold">Add</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 animate-pulse">
              <div className="flex flex-col gap-0.5">
                <div className="size-4 bg-zinc-800 rounded" />
                <div className="size-4 bg-zinc-800 rounded" />
              </div>
              <div className="size-5 bg-zinc-800 rounded" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-zinc-800 rounded w-1/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.id || i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveUp(i)} disabled={i === 0} className="text-zinc-500 hover:text-white disabled:opacity-30"><span className="material-symbols-outlined text-sm">keyboard_arrow_up</span></button>
                <button onClick={() => moveDown(i)} disabled={i === items.length - 1} className="text-zinc-500 hover:text-white disabled:opacity-30"><span className="material-symbols-outlined text-sm">keyboard_arrow_down</span></button>
              </div>
              <span className="material-symbols-outlined text-zinc-500">drag_indicator</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold">{item.label}</div>
                <div className="text-zinc-500 text-xs font-mono">{item.url}</div>
              </div>
              <button onClick={() => remove(item.id)} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
            </div>
          ))}
          {items.length === 0 && <div className="text-center text-zinc-500 py-8">No navigation items yet</div>}
        </div>
      )}
    </div>
  )
}

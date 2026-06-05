import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'
import DeleteModal from '../components/DeleteModal'

export default function Media() {
  const [items, setItems] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef()

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/media')
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const upload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    await api.upload(file)
    setUploading(false)
    fileRef.current.value = ''
    load()
  }

  const remove = async (id) => {
    setDeleting(true)
    try {
      await api.delete(`/media/${id}`)
      setItems(items.filter(i => i.id !== id))
      load()
    } catch (e) {
      console.error(e)
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" id="file-input" />
          <label htmlFor="file-input" className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer">
            {uploading ? 'Uploading...' : '+ Upload'}
          </label>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-zinc-800" />
              <div className="p-2">
                <div className="h-2 bg-zinc-800 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
              <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                <img src={item.url} alt={item.alt || ''} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => copyUrl(item.url)} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full"><span className="material-symbols-outlined text-lg">link</span></button>
                  <button onClick={() => setDeleteTarget({ id: item.id, title: 'media' })} className="bg-red-500/70 hover:bg-red-500 text-white p-2 rounded-full"><span className="material-symbols-outlined text-lg">delete</span></button>
                </div>
              </div>
              <div className="p-2 text-[10px] text-zinc-500 truncate">{item.filename}</div>
            </div>
          ))}
          {items.length === 0 && <div className="col-span-full text-center text-zinc-500 py-12">No media uploaded yet</div>}
        </div>
      )}
      <DeleteModal open={!!deleteTarget} title={deleteTarget?.title || ''} deleting={deleting} onConfirm={() => remove(deleteTarget.id)} onCancel={() => { setDeleteTarget(null); setDeleting(false) }} />
    </div>
  )
}

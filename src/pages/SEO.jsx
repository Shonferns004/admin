import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'

const defaultPages = ['home', 'about', 'services', 'work', 'contact']

export default function SEO() {
  const [settings, setSettings] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/seo')
      const merged = defaultPages.map(page => {
        const existing = data.find(s => s.page === page)
        return existing || { page, title: '', description: '', og_image: '' }
      })
      setSettings(merged)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const update = (page, field, value) => {
    setSettings(settings.map(s => s.page === page ? { ...s, [field]: value } : s))
  }

  const save = async () => {
    setSaving(true)
    await api.put('/seo', settings)
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">SEO Settings</h1>
        <button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg text-sm font-bold">
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-16 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-8 bg-zinc-800 rounded" />
                <div className="h-8 bg-zinc-800 rounded" />
                <div className="h-8 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map(s => (
          <div key={s.page} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="font-bold text-primary text-sm uppercase mb-4">{s.page}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-zinc-500 text-xs block mb-1">Meta Title</label>
                <input value={s.title} onChange={e => update(s.page, 'title', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-zinc-500 text-xs block mb-1">Meta Description</label>
                <input value={s.description} onChange={e => update(s.page, 'description', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-zinc-500 text-xs block mb-1">OG Image URL</label>
                <input value={s.og_image} onChange={e => update(s.page, 'og_image', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}

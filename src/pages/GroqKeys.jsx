import { useEffect, useState } from 'react'
import { api } from '../api'

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString()
}

export default function GroqKeys() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', api_key: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [revealedKeyById, setRevealedKeyById] = useState({})
  const [revealingId, setRevealingId] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/groq-keys')
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e?.message || 'Failed to load keys')
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setEditing('new')
    setForm({ name: '', api_key: '' })
    setError('')
  }

  const openEdit = (item) => {
    setEditing(item.id)
    setForm({ name: item.name || '', api_key: '' })
    setError('')
  }

  const closeModal = () => {
    setEditing(null)
    setForm({ name: '', api_key: '' })
    setSaving(false)
  }

  const save = async () => {
    const name = form.name.trim()
    const apiKey = form.api_key.trim()

    if (!name) {
      setError('Name is required')
      return
    }

    if (editing === 'new' && !apiKey) {
      setError('API key is required for new entry')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (editing === 'new') {
        await api.post('/groq-keys', { name, api_key: apiKey })
      } else {
        const payload = { name }
        if (apiKey) payload.api_key = apiKey
        await api.put(`/groq-keys/${editing}`, payload)
      }
      closeModal()
      await load()
    } catch (e) {
      setError(e?.message || 'Failed to save key')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this Groq key?')) return
    try {
      await api.delete(`/groq-keys/${id}`)
      await load()
    } catch (e) {
      setError(e?.message || 'Failed to delete key')
    }
  }

  const toggleReveal = async (id) => {
    if (revealedKeyById[id]) {
      setRevealedKeyById(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      return
    }

    setRevealingId(id)
    setError('')
    try {
      const data = await api.get(`/groq-keys/${id}/raw`)
      const keyValue = data?.api_key ? String(data.api_key) : ''
      if (!keyValue) throw new Error('API key not found')
      setRevealedKeyById(prev => ({ ...prev, [id]: keyValue }))
    } catch (e) {
      setError(e?.message || 'Failed to reveal key')
    } finally {
      setRevealingId('')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Groq Keys</h1>
          <p className="text-zinc-500 text-sm mt-1">Add multiple Groq API keys with names. Keys are masked in this screen.</p>
        </div>
        <button onClick={openNew} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-bold">+ Add Key</button>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/40 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
          <div className="col-span-4">Name</div>
          <div className="col-span-4">API Key</div>
          <div className="col-span-3">Updated</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading keys...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No keys added yet.</div>
        ) : (
          <div>
            {items.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-zinc-800 last:border-b-0 items-center">
                <div className="col-span-4 text-sm font-semibold">{item.name}</div>
                <div className="col-span-4 text-sm text-zinc-400 font-mono break-all">
                  {revealedKeyById[item.id] || item.masked_key}
                </div>
                <div className="col-span-3 text-xs text-zinc-500">{formatDate(item.updated_at || item.created_at)}</div>
                <div className="col-span-1 flex justify-end gap-1">
                  <button
                    onClick={() => toggleReveal(item.id)}
                    disabled={revealingId === item.id}
                    className="text-zinc-400 hover:text-white disabled:opacity-50"
                    title={revealedKeyById[item.id] ? 'Hide key' : 'Show key'}
                  >
                    <span className="material-symbols-outlined text-lg">{revealedKeyById[item.id] ? 'visibility_off' : 'visibility'}</span>
                  </button>
                  <button onClick={() => openEdit(item)} className="text-zinc-400 hover:text-primary">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button onClick={() => remove(item.id)} className="text-zinc-400 hover:text-red-400">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing === 'new' ? 'Add Groq Key' : 'Edit Groq Key'}</h2>

            <div>
              <label className="text-zinc-400 text-sm block mb-1">Key Name</label>
              <input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Primary Sales Key"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1">API Key {editing !== 'new' ? '(leave blank to keep existing)' : ''}</label>
              <input
                type="password"
                value={form.api_key}
                onChange={e => setForm(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="gsk_..."
                autoComplete="new-password"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white font-mono"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-300 rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={closeModal} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

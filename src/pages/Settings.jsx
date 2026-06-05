import { useState, useEffect } from 'react'
import { api } from '../api'

const fields = [
  { key: 'site_title', label: 'Site Title', type: 'text' },
  { key: 'site_email', label: 'Email', type: 'text' },
  { key: 'site_phone', label: 'Phone', type: 'text' },
  { key: 'site_address', label: 'Address', type: 'text' },
  { key: 'footer_text', label: 'Footer Text', type: 'text' },
  { key: 'copyright', label: 'Copyright', type: 'text' },
  { key: 'social_facebook', label: 'Facebook URL', type: 'text' },
  { key: 'social_instagram', label: 'Instagram URL', type: 'text' },
  { key: 'social_twitter', label: 'Twitter URL', type: 'text' },
  { key: 'social_linkedin', label: 'LinkedIn URL', type: 'text' },
  { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'select' },
  { key: 'maintenance_message', label: 'Maintenance Message', type: 'textarea' },
]

const defaults = Object.fromEntries(fields.map(f => [f.key, '']))

export default function Settings() {
  const [form, setForm] = useState(defaults)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/settings')
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setForm({ ...defaults, ...data })
      }
    } catch (e) {
      console.error('Failed to load settings', e)
    }
    setLoading(false)
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.put('/settings', form)
    } catch (e) {
      console.error('Failed to save settings', e)
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <button onClick={save} disabled={saving || loading} className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-bold">
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        {loading ? (
          <div className="text-center text-zinc-500 py-8">Loading settings...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="text-zinc-400 text-sm block mb-1">{f.label}</label>
                {f.type === 'select' ? (
                  <select value={form[f.key] || 'false'} onChange={e => setForm({...form, [f.key]: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white">
                    <option value="false">Off</option>
                    <option value="true">On</option>
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white h-24" />
                ) : (
                  <input value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

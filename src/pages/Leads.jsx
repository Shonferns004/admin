import { useEffect, useState } from 'react'
import { api } from '../api'
import DeleteModal from '../components/DeleteModal'

const typeOptions = [
  { id: 'startup', label: 'Startup' },
  { id: 'local', label: 'Local Business' },
  { id: 'individual', label: 'Individual' },
]

const defaultForm = {
  name: '', email: '', phone: '', type: 'startup',
  industry: '', location: '', website: '', linkedin: '',
  size: '', description: '', status: 'new',
}

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(defaultForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/leads?include_deleted=false&limit=1000')
      setLeads(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await api.patch(`/leads/${editingId}`, form)
      } else {
        await api.post('/leads', form)
      }
      setForm(defaultForm)
      setEditingId(null)
      load()
      setToast(editingId ? 'Lead updated' : 'Lead created')
    } catch (e) {
      setToast('Error saving lead')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (lead) => {
    setForm({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      type: lead.type || 'startup',
      industry: lead.industry || '',
      location: lead.location || '',
      website: lead.website || '',
      linkedin: lead.linkedin || '',
      size: lead.size || '',
      description: lead.description || '',
      status: lead.status || 'new',
    })
    setEditingId(lead.id)
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await api.delete(`/leads/${id}`)
      setLeads(leads.filter(l => l.id !== id))
      load()
      setToast('Lead deleted')
    } catch (e) {
      setToast('Error deleting lead')
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const handleCancel = () => {
    setForm(defaultForm)
    setEditingId(null)
  }

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">track_changes</span>
            Leads
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manually add and manage leads.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">{editingId ? 'Edit Lead' : 'Add New Lead'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <input placeholder="Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white" />
          <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white" />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white" />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white">
            {typeOptions.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input placeholder="Industry" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white" />
          <input placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white" />
          <input placeholder="Website" value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white" />
          <input placeholder="LinkedIn" value={form.linkedin} onChange={e => setForm({...form, linkedin: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white" />
          <input placeholder="Company Size" value={form.size} onChange={e => setForm({...form, size: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white" />
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white">
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="follow_up">Follow Up</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <textarea placeholder="Description / Notes" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white mb-4" />
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-bold">
            {saving ? 'Saving...' : editingId ? 'Update Lead' : 'Add Lead'}
          </button>
          {editingId && <button onClick={handleCancel} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">Cancel</button>}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold">All Leads</h2>
          <button onClick={load} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-xs font-semibold">Refresh</button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-zinc-500 text-sm py-8 text-center">No leads yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-zinc-800/60">
                    <td className="p-2">
                      <div className="font-semibold text-white">{lead.name}</div>
                      {lead.industry && <div className="text-xs text-zinc-500">{lead.industry}</div>}
                    </td>
                    <td className="p-2 text-zinc-300">{lead.type || '-'}</td>
                    <td className="p-2 text-zinc-300">{lead.email || '-'}</td>
                    <td className="p-2 text-zinc-300">{lead.phone || '-'}</td>
                    <td className="p-2">
                      <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 uppercase">{lead.status || 'new'}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(lead)} className="text-zinc-400 hover:text-primary px-2 py-1 rounded text-xs font-semibold">Edit</button>
                        <button onClick={() => setDeleteTarget({ id: lead.id, title: 'lead' })} className="text-zinc-400 hover:text-red-400 px-2 py-1 rounded text-xs font-semibold">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteModal open={!!deleteTarget} title={deleteTarget?.title || ''} deleting={deleting} onConfirm={() => handleDelete(deleteTarget.id)} onCancel={() => { setDeleteTarget(null); setDeleting(false) }} />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'

const statusColors = { draft: 'bg-zinc-800 text-zinc-400', sent: 'bg-blue-500/10 text-blue-400', paid: 'bg-green-500/10 text-green-400', overdue: 'bg-red-500/10 text-red-400' }

export default function Invoices() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ client_name: '', project_name: '', amount: '', status: 'draft', file_url: '', notes: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/invoices')
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => { setEditing('new'); setForm({ client_name: '', project_name: '', amount: '', status: 'draft', file_url: '', notes: '' }) }
  const openEdit = (item) => { setEditing(item.id); setForm({ ...item }) }

  const save = async () => {
    if (editing === 'new') await api.post('/invoices', form)
    else await api.put(`/invoices/${editing}`, form)
    setEditing(null); load()
  }

  const remove = async (id) => {
    if (confirm('Delete?')) { await api.delete(`/invoices/${id}`); load() }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices / Proposals</h1>
        <button onClick={openNew} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-bold">+ New</button>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing === 'new' ? 'New Invoice' : 'Edit Invoice'}</h2>
            <input placeholder="Client Name" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <input placeholder="Project Name" value={form.project_name} onChange={e => setForm({...form, project_name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <input placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <input placeholder="File URL" value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white h-20" />
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
              <th className="p-4 font-medium">Client</th>
              <th className="p-4 font-medium hidden md:table-cell">Project</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium w-24">Actions</th>
            </tr>
          </thead>
          {loading ? (
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
            </tbody>
          ) : (
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="p-4">{item.client_name}</td>
                  <td className="p-4 text-zinc-400 hidden md:table-cell">{item.project_name || '-'}</td>
                  <td className="p-4">{item.amount ? `₹${Number(item.amount).toLocaleString()}` : '-'}</td>
                  <td className="p-4"><span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[item.status] || statusColors.draft}`}>{item.status}</span></td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="text-zinc-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button onClick={() => remove(item.id)} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No invoices yet</td></tr>}
            </tbody>
          )}
        </table>
      </div>
    </div>
  )
}

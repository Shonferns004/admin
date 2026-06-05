import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'

export default function Users() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', role: 'admin' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/users')
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setEditing('new')
    setForm({ username: '', password: '', role: 'admin' })
  }

  const save = async () => {
    if (editing === 'new') await api.post('/users', form)
    else {
      const updates = { username: form.username, role: form.role }
      if (form.password) updates.password = form.password
      await api.put(`/users/${editing}`, updates)
    }
    setEditing(null); load()
  }

  const remove = async (id) => {
    if (confirm('Delete user?')) { await api.delete(`/users/${id}`); load() }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Users</h1>
        <button onClick={openNew} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-bold">+ New User</button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing === 'new' ? 'New User' : 'Edit User'}</h2>
            <input placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <input type="password" placeholder={editing === 'new' ? 'Password' : 'New password (leave blank to keep)'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white">
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
            </select>
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
              <th className="p-4 font-medium">Username</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium hidden md:table-cell">Created</th>
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
                  <td className="p-4 font-medium">{item.username}</td>
                  <td className="p-4">
                    <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{item.role}</span>
                  </td>
                  <td className="p-4 text-zinc-400 hidden md:table-cell">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(item.id); setForm({ username: item.username, password: '', role: item.role }) }} className="text-zinc-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button onClick={() => remove(item.id)} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No users</td></tr>}
            </tbody>
          )}
        </table>
      </div>
    </div>
  )
}

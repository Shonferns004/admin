import { useState, useEffect } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [editing, setEditing] = useState(null)
  const [showCategory, setShowCategory] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', slug: '' })
  const [form, setForm] = useState({ title: '', slug: '', content: '', excerpt: '', image_url: '', category_id: '', author: '', published: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load(); loadCategories() }, [])

  const load = async () => {
    try {
      setLoading(true)
      setPosts(await api.get('/blog'))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  const loadCategories = async () => {
    try {
      setCategories(await api.get('/blog/categories'))
    } catch (e) {
      console.error(e)
    }
  }

  const openNew = () => {
    setEditing('new')
    setForm({ title: '', slug: '', content: '', excerpt: '', image_url: '', category_id: '', author: '', published: false })
  }
  const openEdit = (post) => {
    setEditing(post.id)
    setForm({ ...post, category_id: post.category_id || '' })
  }

  const save = async () => {
    if (editing === 'new') await api.post('/blog', form)
    else await api.put(`/blog/${editing}`, form)
    setEditing(null); load()
  }

  const remove = async (id) => {
    if (confirm('Delete this post?')) { await api.delete(`/blog/${id}`); load() }
  }

  const saveCategory = async () => {
    await api.post('/blog/categories', catForm)
    setShowCategory(false)
    setCatForm({ name: '', slug: '' })
    loadCategories()
  }

  const removeCategory = async (id) => {
    if (confirm('Delete category?')) { await api.delete(`/blog/categories/${id}`); loadCategories() }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Blog</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCategory(!showCategory)} className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-4 py-2 rounded-lg text-sm">Categories</button>
          <button onClick={openNew} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-bold">+ New Post</button>
        </div>
      </div>

      {showCategory && (
        <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="font-bold mb-3">Categories</h3>
          <div className="flex gap-2 mb-3">
            <input placeholder="Name" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white" />
            <input placeholder="Slug" value={catForm.slug} onChange={e => setCatForm({...catForm, slug: e.target.value})} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white" />
            <button onClick={saveCategory} className="bg-primary text-white px-4 rounded-lg text-sm font-bold">Add</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <span key={c.id} className="flex items-center gap-1 bg-zinc-800 px-3 py-1 rounded text-sm">
                {c.name}
                <button onClick={() => removeCategory(c.id)} className="text-zinc-500 hover:text-red-400"><span className="material-symbols-outlined text-sm">close</span></button>
              </span>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl mx-4 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing === 'new' ? 'New Post' : 'Edit Post'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="col-span-2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
              <input placeholder="Slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
              <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white">
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input placeholder="Author" value={form.author} onChange={e => setForm({...form, author: e.target.value})} className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
              <input placeholder="Image URL" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
              <textarea placeholder="Excerpt" value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} className="col-span-2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white h-20" />
              <textarea placeholder="Content (HTML/markdown)" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="col-span-2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white h-40 font-mono text-sm" />
              <label className="flex items-center gap-2 text-zinc-400">
                <input type="checkbox" checked={form.published} onChange={e => setForm({...form, published: e.target.checked})} className="accent-primary" />
                Published
              </label>
            </div>
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
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium hidden md:table-cell">Author</th>
              <th className="p-4 font-medium hidden lg:table-cell">Status</th>
              <th className="p-4 font-medium w-24">Actions</th>
            </tr>
          </thead>
          {loading ? (
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
            </tbody>
          ) : (
            <tbody>
              {posts.map(post => (
                <tr key={post.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="p-4">{post.title}</td>
                  <td className="p-4 text-zinc-400 hidden md:table-cell">{post.author || '-'}</td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${post.published ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(post)} className="text-zinc-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button onClick={() => remove(post.id)} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No posts yet</td></tr>}
            </tbody>
          )}
        </table>
      </div>
    </div>
  )
}

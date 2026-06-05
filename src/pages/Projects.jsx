import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { SkeletonRow } from '../components/Skeleton'

export default function Projects() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', image_url: '', tags: '', client_name: '', preview_link: '', github_repo: '', sort_order: 0 })
  const [screenshots, setScreenshots] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileRef = useRef()
  const screenshotFileRef = useRef()
  const [newScreenshotDevice, setNewScreenshotDevice] = useState('website')
  const [customTag, setCustomTag] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.get('/projects')
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadScreenshots = async (projectId) => {
    try {
      const data = await api.get(`/projects/${projectId}/images`)
      setScreenshots(data)
    } catch (e) {
      console.error(e)
      setScreenshots([])
    }
  }

  const openNew = () => {
    setEditing('new')
    setForm({ title: '', description: '', image_url: '', tags: [], client_name: '', preview_link: '', github_repo: '', sort_order: items.length })
    setScreenshots([])
  }

  const openEdit = (item) => {
    setEditing(item.id)
    setForm({ ...item, tags: item.tags || [] })
    loadScreenshots(item.id)
  }

  const handleFileSelect = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await api.upload(file, form.title || 'project image')
      setForm({ ...form, image_url: result.url })
    } catch (e) {
      console.error('Upload failed', e)
    }
    setUploading(false)
    fileRef.current.value = ''
  }

  const handleScreenshotUpload = async () => {
    const files = screenshotFileRef.current?.files
    if (!files || files.length === 0) return
    setUploadingScreenshot(true)
    try {
      const uploads = []
      for (let i = 0; i < files.length; i++) {
        const result = await api.upload(files[i], form.title || 'screenshot')
        uploads.push(result)
      }
      if (editing !== 'new') {
        for (const u of uploads) {
          await api.post(`/projects/${editing}/images`, {
            image_url: u.url,
            device_type: newScreenshotDevice,
            sort_order: screenshots.length,
          })
        }
        loadScreenshots(editing)
      } else {
        setScreenshots(prev => [...prev, ...uploads.map((u, i) => ({ id: (Date.now() + i).toString(), image_url: u.url, device_type: newScreenshotDevice, sort_order: prev.length + i }))])
      }
    } catch (e) {
      console.error('Screenshot upload failed', e)
    }
    setUploadingScreenshot(false)
    screenshotFileRef.current.value = ''
  }

  const removeScreenshot = async (screenshot) => {
    if (editing !== 'new' && screenshot.id) {
      try {
        await api.delete(`/projects/${editing}/images/${screenshot.id}`)
        loadScreenshots(editing)
      } catch (e) {
        console.error(e)
      }
    } else {
      setScreenshots(screenshots.filter(s => s.id !== screenshot.id))
    }
  }

  const save = async () => {
    const payload = { ...form, tags: form.tags }
    if (editing === 'new') {
      const created = await api.post('/projects', payload)
      for (const shot of screenshots) {
        await api.post(`/projects/${created.id}/images`, {
          image_url: shot.image_url,
          device_type: shot.device_type,
          sort_order: shot.sort_order,
        })
      }
    } else {
      await api.put(`/projects/${editing}`, payload)
    }
    setEditing(null)
    load()
  }

  const remove = async (id) => {
    if (confirm('Delete this project?')) {
      await api.delete(`/projects/${id}`)
      load()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button onClick={openNew} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-bold">+ New</button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing === 'new' ? 'New Project' : 'Edit Project'}</h2>
            <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white h-24" />

            <div>
              <label className="text-zinc-400 text-sm block mb-1">Thumbnail Image</label>
              {form.image_url && (
                <div className="relative mb-2">
                  <img src={form.image_url} alt="preview" className="w-full h-32 object-cover rounded-lg" />
                  <button onClick={() => setForm({...form, image_url: ''})} className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full text-sm">
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="project-image-input" />
                <label htmlFor="project-image-input" className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer ${uploading ? 'bg-zinc-700 text-zinc-400' : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'}`}>
                  {uploading ? 'Uploading...' : form.image_url ? 'Change Thumbnail' : 'Upload Thumbnail'}
                </label>
              </div>
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-2">Screenshots</label>
              {screenshots.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {screenshots.map((shot, i) => (
                    <div key={shot.id || i} className="relative">
                      <img src={shot.image_url} alt="" className="w-full h-20 object-cover rounded-lg" />
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                        {shot.device_type === 'mobile' ? 'Mobile' : shot.device_type === 'website' ? 'Website' : shot.device_type === 'poster' ? 'Poster' : 'Event'}
                      </span>
                      <button onClick={() => removeScreenshot(shot)} className="absolute top-1 right-1 bg-black/60 text-white p-0.5 rounded-full text-xs">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input ref={screenshotFileRef} type="file" accept="image/*" multiple onChange={handleScreenshotUpload} className="hidden" id="screenshot-input" />
                <select value={newScreenshotDevice} onChange={e => setNewScreenshotDevice(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-white text-sm">
                  <option value="website">Website</option>
                  <option value="mobile">Mobile</option>
                  <option value="poster">Poster</option>
                  <option value="event">Event</option>
                </select>
                <label htmlFor="screenshot-input" className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer whitespace-nowrap ${uploadingScreenshot ? 'bg-zinc-700 text-zinc-400' : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'}`}>
                  {uploadingScreenshot ? 'Uploading...' : '+ Add Screenshot'}
                </label>
              </div>
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {['App', 'Website', 'Event'].map(t => (
                  <button key={t} type="button" onClick={() => setForm({...form, tags: form.tags.includes(t) ? form.tags.filter(x => x !== t) : [...form.tags, t]})} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${form.tags.includes(t) ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500'}`}>{t}</button>
                ))}
                {!customTag && (
                  <button type="button" onClick={() => setCustomTag(' ')} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500">+ Other</button>
                )}
              </div>
              {customTag !== '' && (
                <div className="flex gap-2 mb-3">
                  <input autoFocus value={customTag === ' ' ? '' : customTag} onChange={e => setCustomTag(e.target.value)} placeholder="Type custom tag..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white" onKeyDown={e => { if (e.key === 'Enter' && customTag.trim()) { setForm({...form, tags: [...form.tags, customTag.trim()]}); setCustomTag('') } }} />
                  <button type="button" onClick={() => { if (customTag.trim()) { setForm({...form, tags: [...form.tags, customTag.trim()]}); setCustomTag('') } }} className="px-3 py-1.5 rounded-lg text-sm font-bold bg-primary text-white">Add</button>
                  <button type="button" onClick={() => setCustomTag('')} className="px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white">Cancel</button>
                </div>
              )}
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-200 text-xs px-2.5 py-1 rounded-full border border-zinc-700">
                      {t}
                      <button type="button" onClick={() => setForm({...form, tags: form.tags.filter(x => x !== t)})} className="text-zinc-500 hover:text-white">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <input placeholder="Client Name" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
            {form.tags.includes('Website') && <input placeholder="Preview Link (https://...)" value={form.preview_link} onChange={e => setForm({...form, preview_link: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />}
            {form.tags.includes('App') && <input placeholder="GitHub Repo (https://github.com/...)" value={form.github_repo} onChange={e => setForm({...form, github_repo: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />}
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
              <th className="p-4 font-medium">Image</th>
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium hidden md:table-cell">Client</th>
              <th className="p-4 font-medium hidden lg:table-cell">Tags</th>
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
                  <td className="p-4">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-10 h-10 rounded object-cover bg-zinc-800" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-600">
                        <span className="material-symbols-outlined text-lg">image</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">{item.title}</td>
                  <td className="p-4 text-zinc-400 hidden md:table-cell">{item.client_name || '-'}</td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {item.tags?.map(t => <span key={t} className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{t}</span>)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="text-zinc-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button onClick={() => remove(item.id)} className="text-zinc-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No projects yet</td></tr>}
            </tbody>
          )}
        </table>
      </div>
    </div>
  )
}

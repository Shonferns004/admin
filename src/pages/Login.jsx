import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.login(username, password)
      if (res.token) {
        localStorage.setItem('crabstack_token', res.token)
        localStorage.setItem('crabstack_user', JSON.stringify(res.user))
        navigate('/dashboard')
      } else {
        setError(res.error || 'Login failed')
      }
    } catch (err) {
      setError(err.message || 'Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Crabstack</h1>
          <p className="text-zinc-500 text-sm mt-1">Admin Login</p>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded">{error}</div>}
        <div>
          <label className="text-zinc-400 text-sm block mb-1">Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-zinc-400 text-sm block mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors">{loading ? 'Logging in...' : 'Login'}</button>
      </form>
    </div>
  )
}

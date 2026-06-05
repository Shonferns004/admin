const API_URL = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('crabstack_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) {
    localStorage.removeItem('crabstack_token')
    localStorage.removeItem('crabstack_user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`)
  }
  return data
}

export const api = {
  login: async (username, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.status === 401) {
      throw new Error(data.error || 'Invalid credentials')
    }
    if (!res.ok) {
      throw new Error(data.error || `Login failed (${res.status})`)
    }
    return data
  },

  logout: () =>
    request('/logout', { method: 'POST' }),

  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),

  upload: async (file, alt = '') => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    form.append('alt', alt)
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (res.status === 401) {
      localStorage.removeItem('crabstack_token')
      localStorage.removeItem('crabstack_user')
      window.location.href = '/login'
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`)
    return data
  }
}

const API = import.meta.env.VITE_API_URL

export const getToken = () => localStorage.getItem('token')
export const setToken = (t) => localStorage.setItem('token', t)
export const clearToken = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const detail = data.detail
    throw new Error(typeof detail === 'string' ? detail : 'Please check the details you entered')
  }
  return data
}

export const isAuthError = (err) => /token|authenticated|owner access/i.test(err.message)

export const friendly = (err) =>
  err.message === 'Failed to fetch' ? 'Cannot reach the server. Is the backend running?' : err.message

// The backend sends UTC times without a "Z", so add it before converting to local time
export const fmtTime = (s) => new Date(s + 'Z').toLocaleString()
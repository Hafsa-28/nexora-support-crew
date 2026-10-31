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
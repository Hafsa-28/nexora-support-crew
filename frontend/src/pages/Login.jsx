import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken } from '../api'

export default function Login() {
  const [isSignup, setIsSignup] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [tempToken, setTempToken] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const finish = (data) => {
    setToken(data.token)
    localStorage.setItem('role', data.role)
    // Owners go to the dashboard, customers go to the chat
    navigate(data.role === 'owner' ? '/dashboard' : '/chat')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tempToken) {
        finish(await api('/login/2fa', {
          method: 'POST',
          body: JSON.stringify({ temp_token: tempToken, code }),
        }))
      } else if (isSignup) {
        finish(await api('/signup', {
          method: 'POST',
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
        }))
      } else {
        const data = await api('/login', {
          method: 'POST',
          body: JSON.stringify({ email: form.email, password: form.password }),
        })
        if (data.requires_2fa) setTempToken(data.temp_token)
        else finish(data)
      }
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Cannot reach the server. Is the backend running?' : err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-12">
        <Link to="/" className="text-2xl font-bold">Nexora</Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Your AI crew handles the messages. You make the decisions.
          </h2>
          <ul className="mt-8 space-y-3 text-indigo-100">
            <li>✓ Instant replies to customer questions</li>
            <li>✓ Low-stock alerts before you run out</li>
            <li>✓ Approve refunds and discounts in one tap</li>
          </ul>
        </div>
        <p className="text-sm text-indigo-200">© 2026 Team Nexora</p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {tempToken ? 'Two-step verification' : isSignup ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {tempToken
              ? 'Enter the 6-digit code from your authenticator app.'
              : isSignup
              ? 'Sign up to chat with the store assistant.'
              : 'Log in to manage your AI crew.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {tempToken ? (
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                className={inputClass}
              />
            ) : (
              <>
                {isSignup && (
                  <input name="name" placeholder="Your name" value={form.name} onChange={handleChange} required className={inputClass} />
                )}
                <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className={inputClass} />
                <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className={inputClass} />
              </>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-xl font-medium transition"
            >
              {loading ? 'Please wait...' : tempToken ? 'Verify' : isSignup ? 'Sign up' : 'Log in'}
            </button>
          </form>

          {!tempToken && (
            <p className="mt-6 text-sm text-center text-slate-600">
              {isSignup ? 'Already have an account?' : 'New here?'}{' '}
              <button
                type="button"
                onClick={() => { setIsSignup(!isSignup); setError('') }}
                className="text-indigo-600 font-medium"
              >
                {isSignup ? 'Log in' : 'Sign up'}
              </button>
            </p>
          )}
          <p className="mt-4 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
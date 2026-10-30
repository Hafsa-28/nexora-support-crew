import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const [isSignup, setIsSignup] = useState(false)
  const [form, setForm] = useState({ name: '', business: '', email: '', password: '' })
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Mock only: real authentication will connect to the backend later
    navigate('/dashboard')
  }

  const inputClass =
    'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left panel */}
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

      {/* Form panel */}
      <div className="flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {isSignup ? 'Create your owner account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isSignup ? 'Set up your business in a minute.' : 'Log in to manage your AI crew.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {isSignup && (
              <>
                <input name="name" placeholder="Your name" value={form.name} onChange={handleChange} required className={inputClass} />
                <input name="business" placeholder="Business name" value={form.business} onChange={handleChange} required className={inputClass} />
              </>
            )}
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className={inputClass} />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className={inputClass} />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition">
              {isSignup ? 'Sign up' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-slate-600">
            {isSignup ? 'Already have an account?' : 'New here?'}{' '}
            <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-indigo-600 font-medium">
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </p>
          <p className="mt-4 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
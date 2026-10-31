import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clearToken, isAuthError, friendly } from '../api'

const types = ['Clothing', 'Bakery', 'Salon', 'Electronics', 'Home food', 'Other']

export default function Settings() {
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const navigate = useNavigate()

  const fail = (err) => {
    if (isAuthError(err)) { clearToken(); navigate('/login') }
    else setError(friendly(err))
  }

  useEffect(() => { api('/settings').then(setForm).catch(fail) }, [])

  const change = (key, value) => { setForm({ ...form, [key]: value }); setSaved(false) }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setForm(await api('/settings', { method: 'PUT', body: JSON.stringify(form) }))
      setSaved(true)
    } catch (err) { fail(err) }
  }

  const input = 'w-full border border-slate-200 rounded-xl px-4 py-2 text-sm'

  if (!form) return error
    ? <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
    : <p className="text-sm text-slate-500">Loading...</p>

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-1">Settings</h2>
      <p className="text-sm text-slate-500 mb-4">Tell your AI crew about your business.</p>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={save} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Business name</label>
          <input className={input} value={form.business_name} onChange={(e) => change('business_name', e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium">Business type</label>
          <select className={input} value={form.business_type} onChange={(e) => change('business_type', e.target.value)}>
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">FAQs and policies</label>
          <textarea rows={5} className={input} value={form.faqs} onChange={(e) => change('faqs', e.target.value)} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Ask me before the agent handles:</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.approve_refunds} onChange={(e) => change('approve_refunds', e.target.checked)} />
            Refunds
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.approve_discounts} onChange={(e) => change('approve_discounts', e.target.checked)} />
            Discounts
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium">
            Save settings
          </button>
          {saved && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </form>
    </div>
  )
}
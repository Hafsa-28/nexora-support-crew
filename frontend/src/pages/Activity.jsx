import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clearToken, isAuthError, friendly, fmtTime } from '../api'

const badge = {
  'Support Agent': 'bg-indigo-100 text-indigo-700',
  'Inventory Agent': 'bg-blue-100 text-blue-700',
  Owner: 'bg-green-100 text-green-700',
}

export default function Activity() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api('/activity')
      .then(setItems)
      .catch((err) => {
        if (isAuthError(err)) { clearToken(); navigate('/login') }
        else setError(friendly(err))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Agent activity log</h2>
      <p className="text-sm text-slate-500 mb-4">Everything the AI agents and you have done, newest first.</p>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y max-w-3xl">
          {items.length === 0 && <p className="p-4 text-sm text-slate-500">No activity yet.</p>}
          {items.map((a) => (
            <div key={a.id} className="p-4 flex items-start gap-3">
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${badge[a.agent] || 'bg-slate-100 text-slate-700'}`}>
                {a.agent}
              </span>
              <div>
                <p className="text-sm">{a.action}</p>
                <p className="text-xs text-slate-400 mt-0.5">{fmtTime(a.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clearToken } from '../api'

const typeStyle = {
  refund: 'bg-red-100 text-red-700',
  discount: 'bg-amber-100 text-amber-800',
  complaint: 'bg-orange-100 text-orange-700',
  restock: 'bg-blue-100 text-blue-700',
}

export default function Approvals() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const handleError = (err) => {
    if (/token|authenticated|owner access/i.test(err.message)) {
      clearToken()
      navigate('/login')
      return
    }
    setError(err.message === 'Failed to fetch' ? 'Cannot reach the server. Is the backend running?' : err.message)
  }

  const load = () =>
    api('/approvals')
      .then((data) => { setItems(data); setError('') })
      .catch(handleError)
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const decide = async (id, action) => {
    try {
      await api(`/approvals/${id}/${action}`, { method: 'POST' })
      load()
    } catch (err) { handleError(err) }
  }

  const pending = items.filter((a) => a.status === 'pending')
  const done = items.filter((a) => a.status !== 'pending')

  const Card = ({ a }) => (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-semibold">{a.customer}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${typeStyle[a.type] || 'bg-slate-100 text-slate-700'}`}>
          {a.reason}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">"{a.message}"</p>
      <div className="mt-3 bg-slate-50 rounded-lg p-3 text-sm">
        <p className="text-xs text-slate-500 mb-1">Agent's proposed action</p>
        {a.draft}
      </div>

      {a.status === 'pending' ? (
        <div className="mt-4 flex gap-2">
          <button onClick={() => decide(a.id, 'approve')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
            Approve
          </button>
          <button onClick={() => decide(a.id, 'reject')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
            Reject
          </button>
        </div>
      ) : (
        <p className={`mt-4 text-sm font-medium ${a.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
          {a.status === 'approved' ? 'Approved' : 'Rejected'}
        </p>
      )}
    </div>
  )

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Approval queue</h2>
      <p className="text-sm text-slate-500 mb-4">Refunds, discounts, complaints and restocks wait here for your decision.</p>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading approvals...</p>
      ) : (
        <div className="max-w-3xl">
          <h3 className="font-semibold mb-3">Pending ({pending.length})</h3>
          <div className="grid gap-4">
            {pending.length === 0 && <p className="text-sm text-slate-500">Nothing pending. Nice work!</p>}
            {pending.map((a) => <Card key={a.id} a={a} />)}
          </div>

          {done.length > 0 && (
            <>
              <h3 className="font-semibold mt-8 mb-3">History</h3>
              <div className="grid gap-4">
                {done.map((a) => <Card key={a.id} a={a} />)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
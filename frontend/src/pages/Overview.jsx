import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, clearToken, isAuthError, friendly, fmtTime } from '../api'

export default function Overview() {
  const [stats, setStats] = useState(null)
  const [pending, setPending] = useState([])
  const [activity, setActivity] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api('/overview'), api('/approvals'), api('/activity'), api('/inventory')])
      .then(([s, a, act, inv]) => {
        setStats(s)
        setPending(a.filter((x) => x.status === 'pending'))
        setActivity(act.slice(0, 6))
        setLowStock(inv.filter((p) => p.stock <= p.low_stock_limit))
      })
      .catch((err) => {
        if (isAuthError(err)) { clearToken(); navigate('/login') }
        else setError(friendly(err))
      })
  }, [])

  const cards = stats && [
    { label: 'Messages handled by AI', value: stats.messages_handled_by_ai, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending approvals', value: stats.pending_approvals, color: 'text-amber-600', bg: 'bg-amber-50', link: '/dashboard/approvals' },
    { label: 'Low-stock items', value: stats.low_stock_items, color: 'text-red-600', bg: 'bg-red-50', link: '/dashboard/inventory' },
    { label: 'Total products', value: stats.total_products, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold">Welcome back</h2>
      <p className="text-slate-500 text-sm mt-1">Here is what your AI crew has been doing.</p>

      {error && <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {!stats && !error && <p className="mt-6 text-sm text-slate-500">Loading...</p>}

      {stats && (
        <>
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => {
              const card = (
                <div className={`${c.bg} rounded-xl p-5`}>
                  <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-sm text-slate-600 mt-1">{c.label}</p>
                </div>
              )
              return c.link ? <Link key={c.label} to={c.link}>{card}</Link> : <div key={c.label}>{card}</div>
            })}
          </div>

          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold mb-3">Needs your attention</h3>
              {pending.length === 0 && <p className="text-sm text-slate-500">Nothing pending.</p>}
              {pending.slice(0, 5).map((a) => (
                <div key={a.id} className="py-2 border-b last:border-0">
                  <p className="text-sm font-medium">{a.customer}</p>
                  <p className="text-xs text-slate-500">{a.reason}</p>
                </div>
              ))}
              <Link to="/dashboard/approvals" className="inline-block mt-3 text-sm text-indigo-600 font-medium">
                Review approvals →
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold mb-3">Recent agent activity</h3>
              {activity.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
              {activity.map((a) => (
                <div key={a.id} className="py-2 border-b last:border-0">
                  <p className="text-sm">{a.action}</p>
                  <p className="text-xs text-slate-500">{a.agent} · {fmtTime(a.created_at)}</p>
                </div>
              ))}
            </div>
          </div>

          {lowStock.length > 0 && (
            <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-5">
              <h3 className="font-semibold text-red-700">Low stock alert</h3>
              <p className="text-sm text-red-600 mt-1">
                {lowStock.map((p) => `${p.name} (${p.stock} left)`).join(', ')}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
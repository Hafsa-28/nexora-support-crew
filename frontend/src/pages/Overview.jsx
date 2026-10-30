import { Link } from 'react-router-dom'
import { products, approvals, conversations, activity } from '../mockData'

export default function Overview() {
  const lowStock = products.filter((p) => p.stock <= p.limit)
  const pending = approvals.filter((a) => a.status === 'pending')
  const handledByAgent = conversations.filter((c) => c.handledBy === 'Agent')

  const stats = [
    { label: 'Messages handled by AI', value: handledByAgent.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending approvals', value: pending.length, color: 'text-amber-600', bg: 'bg-amber-50', link: '/dashboard/approvals' },
    { label: 'Low-stock items', value: lowStock.length, color: 'text-red-600', bg: 'bg-red-50', link: '/dashboard/inventory' },
    { label: 'Total products', value: products.length, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold">Welcome back</h2>
      <p className="text-slate-500 text-sm mt-1">Here is what your AI crew did today.</p>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const card = (
            <div className={`${s.bg} rounded-xl p-5`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-slate-600 mt-1">{s.label}</p>
            </div>
          )
          return s.link ? (
            <Link key={s.label} to={s.link}>{card}</Link>
          ) : (
            <div key={s.label}>{card}</div>
          )
        })}
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold mb-3">Needs your attention</h3>
          {pending.length === 0 && <p className="text-sm text-slate-500">Nothing pending.</p>}
          {pending.map((a) => (
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
          {activity.map((a) => (
            <div key={a.id} className="py-2 border-b last:border-0">
              <p className="text-sm">{a.action}</p>
              <p className="text-xs text-slate-500">{a.agent} · {a.time}</p>
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
    </div>
  )
}
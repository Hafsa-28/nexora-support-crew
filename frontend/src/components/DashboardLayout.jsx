import { NavLink, Outlet } from 'react-router-dom'

const links = [
  ['/dashboard', 'Overview'],
  ['/dashboard/inventory', 'Inventory'],
  ['/dashboard/approvals', 'Approvals'],
  ['/dashboard/conversations', 'Conversations'],
  ['/dashboard/activity', 'Activity'],
  ['/dashboard/settings', 'Settings'],
]

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 bg-slate-900 text-white p-4">
        <h1 className="text-xl font-bold mb-6">Nexora</h1>
        <nav className="flex flex-col gap-1">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg ${isActive ? 'bg-indigo-600' : 'hover:bg-slate-800'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
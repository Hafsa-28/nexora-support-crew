import { Link } from 'react-router-dom'

const steps = [
  ['1', 'Customer messages', 'Customers ask about products, orders and returns.'],
  ['2', 'AI agents respond', 'Support and inventory agents reply instantly using your data.'],
  ['3', 'You approve', 'Refunds, discounts and restocks wait for your approval.'],
]

const features = [
  ['Support Agent', 'Answers customer questions 24/7 using your products and policies.'],
  ['Inventory Agent', 'Watches stock levels and suggests restocking before you run out.'],
  ['Owner Approval', 'Sensitive actions only happen after you say yes.'],
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-xl font-bold text-indigo-600">Nexora</h1>
        <Link to="/login" className="text-sm font-medium">Owner Login</Link>
      </nav>

      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold">Your AI support and operations crew</h2>
        <p className="mt-4 text-lg text-slate-600">
          Nexora's AI agents handle customer messages and track your inventory, so small business owners can focus on growing.
        </p>
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <Link to="/login" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium">Owner Login</Link>
          <Link to="/chat" className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg font-medium">Try Customer Chat</Link>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-14">
        <h3 className="text-2xl font-bold text-center">The problem</h3>
        <p className="mt-3 text-center max-w-2xl mx-auto text-slate-600">
          Small business owners spend hours replying to the same questions and tracking stock by hand. Messages get missed, items run out, and customers leave.
        </p>
      </section>

      <section className="px-6 py-14 max-w-5xl mx-auto">
        <h3 className="text-2xl font-bold text-center">How it works</h3>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {steps.map(([n, title, text]) => (
            <div key={n} className="p-6 border rounded-xl">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">{n}</div>
              <h4 className="mt-3 font-semibold">{title}</h4>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-14">
        <h3 className="text-2xl font-bold text-center">Meet your crew</h3>
        <div className="mt-8 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map(([title, text]) => (
            <div key={title} className="p-6 bg-white rounded-xl shadow-sm">
              <h4 className="font-semibold text-indigo-600">{title}</h4>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-sm text-slate-500 py-6">© 2026 Team Nexora</footer>
    </div>
  )
}
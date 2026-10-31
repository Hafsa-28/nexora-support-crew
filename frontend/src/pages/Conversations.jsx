import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clearToken, isAuthError, friendly, fmtTime } from '../api'

export default function Conversations() {
  const [list, setList] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fail = (err) => {
    if (isAuthError(err)) { clearToken(); navigate('/login') }
    else setError(friendly(err))
  }

  useEffect(() => {
    api('/conversations').then(setList).catch(fail).finally(() => setLoading(false))
  }, [])

  const open = (c) => {
    setSelected(c)
    api(`/conversations/${c.id}/messages`).then(setMessages).catch(fail)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Conversations</h2>
      <p className="text-sm text-slate-500 mb-4">Every customer chat, and who handled it.</p>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm divide-y max-h-[70vh] overflow-y-auto">
            {list.length === 0 && <p className="p-4 text-sm text-slate-500">No conversations yet. Try the customer chat.</p>}
            {list.map((c) => (
              <button
                key={c.id}
                onClick={() => open(c)}
                className={`w-full text-left p-4 hover:bg-slate-50 ${selected?.id === c.id ? 'bg-indigo-50' : ''}`}
              >
                <div className="flex justify-between items-center gap-2">
                  <p className="font-medium text-sm">{c.customer_name}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      c.handled_by === 'Agent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {c.handled_by}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">{c.last_message}</p>
                <p className="text-xs text-slate-400 mt-1">{fmtTime(c.created_at)}</p>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 max-h-[70vh] overflow-y-auto">
            {!selected ? (
              <p className="text-sm text-slate-500">Select a conversation to read it.</p>
            ) : (
              <>
                <h3 className="font-semibold mb-3">{selected.customer_name}</h3>
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                          m.sender === 'customer' ? 'bg-slate-100' : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
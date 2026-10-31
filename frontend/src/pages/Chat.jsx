import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Chat() {
  const [name, setName] = useState('')
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([
    { from: 'agent', text: 'Hi! I am the store assistant. How can I help you today?' },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const send = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setError('')
    setMessages((m) => [...m, { from: 'customer', text }])
    setInput('')
    setTyping(true)
    try {
      const data = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: name.trim() || 'Customer',
          message: text,
          conversation_id: conversationId,
        }),
      })
      setConversationId(data.conversation_id)
      setMessages((m) => [...m, { from: 'agent', text: data.reply, escalated: data.escalated }])
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Cannot reach the server. Is the backend running?' : 'Something went wrong. Please try again in a moment.')
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg h-[85vh] bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="bg-indigo-600 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Store Assistant</h2>
            <p className="text-xs text-indigo-200">Powered by Nexora AI</p>
          </div>
          <Link to="/" className="text-sm text-indigo-100 hover:text-white">Home</Link>
        </div>

        <div className="px-4 py-2 border-b bg-white">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            disabled={conversationId !== null}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 disabled:bg-slate-50"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'customer' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  m.from === 'customer'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-slate-800 shadow-sm rounded-bl-sm'
                }`}
              >
                {m.text}
                {m.escalated && (
                  <p className="mt-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full inline-block">
                    Waiting for owner approval
                  </p>
                )}
              </div>
            </div>
          ))}
          {typing && <p className="text-xs text-slate-400">Assistant is typing...</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="p-3 border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a product, stock or returns..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl text-sm font-medium">
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
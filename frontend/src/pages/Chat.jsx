import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { products } from '../mockData'

function getReply(text) {
  const t = text.toLowerCase()

  if (t.includes('refund') || t.includes('discount') || t.includes('complaint')) {
    return {
      text: "I've sent your request to the store owner for approval. You'll get a reply shortly.",
      escalated: true,
    }
  }

  const product = products.find((p) => t.includes(p.name.toLowerCase().split(' ').pop()))
  if (product) {
    if (product.stock === 0) {
      return { text: `Sorry, the ${product.name} is out of stock right now. I can let the owner know you're interested.` }
    }
    const low = product.stock <= product.limit ? ` Only ${product.stock} left, so hurry!` : ''
    return { text: `Yes! The ${product.name} is in stock for ₹${product.price}.${low}` }
  }

  if (t.includes('return') || t.includes('policy')) {
    return { text: 'You can return any unused item within 7 days of delivery for an exchange or store credit.' }
  }

  return { text: 'I can help with product availability, prices and returns. What would you like to know?' }
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { from: 'agent', text: 'Hi! I am the store assistant. How can I help you today?' },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const send = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setMessages((m) => [...m, { from: 'customer', text }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const reply = getReply(text)
      setMessages((m) => [...m, { from: 'agent', ...reply }])
      setTyping(false)
    }, 700)
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
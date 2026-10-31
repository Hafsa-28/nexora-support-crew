import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clearToken } from '../api'

const empty = { name: '', price: '', stock: '', low_stock_limit: '' }

export default function Inventory() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [edit, setEdit] = useState(empty)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const handleError = (err) => {
    // An expired or invalid login sends the owner back to the login page
    if (/token|authenticated|owner access/i.test(err.message)) {
      clearToken()
      navigate('/login')
      return
    }
    setError(err.message === 'Failed to fetch' ? 'Cannot reach the server. Is the backend running?' : err.message)
  }

  const load = () =>
    api('/inventory')
      .then((data) => { setItems(data); setError('') })
      .catch(handleError)
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const toBody = (f) => ({
    name: f.name.trim(),
    price: Number(f.price),
    stock: Number(f.stock || 0),
    low_stock_limit: Number(f.low_stock_limit || 5),
  })

  const addProduct = async () => {
    if (!form.name.trim() || form.price === '') {
      setError('Please enter a name and a price')
      return
    }
    try {
      await api('/inventory', { method: 'POST', body: JSON.stringify(toBody(form)) })
      setForm(empty)
      load()
    } catch (err) { handleError(err) }
  }

  const startEdit = (p) => {
    setEditId(p.id)
    setEdit({ name: p.name, price: p.price, stock: p.stock, low_stock_limit: p.low_stock_limit })
  }

  const saveEdit = async () => {
    try {
      await api(`/inventory/${editId}`, { method: 'PUT', body: JSON.stringify(toBody(edit)) })
      setEditId(null)
      load()
    } catch (err) { handleError(err) }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await api(`/inventory/${id}`, { method: 'DELETE' })
      load()
    } catch (err) { handleError(err) }
  }

  const input = 'border rounded-lg px-3 py-2 w-full text-sm'

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Inventory</h2>
      <p className="text-sm text-slate-500 mb-4">
        The Inventory Agent suggests a restock whenever stock drops to the low-stock limit.
      </p>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2 flex-wrap mb-6">
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 w-44 text-sm" />
        <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border rounded-lg px-3 py-2 w-28 text-sm" />
        <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="border rounded-lg px-3 py-2 w-28 text-sm" />
        <input placeholder="Low-stock limit" type="number" value={form.low_stock_limit} onChange={(e) => setForm({ ...form, low_stock_limit: e.target.value })} className="border rounded-lg px-3 py-2 w-36 text-sm" />
        <button onClick={addProduct} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">
          Add product
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading products...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Limit</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const low = p.stock <= p.low_stock_limit
                const editing = editId === p.id
                return (
                  <tr key={p.id} className={low ? 'bg-red-50' : ''}>
                    <td className="p-3 font-medium">
                      {editing ? <input className={input} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /> : p.name}
                    </td>
                    <td className="p-3">
                      {editing ? <input className={input} type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /> : `₹${p.price}`}
                    </td>
                    <td className="p-3">
                      {editing ? <input className={input} type="number" value={edit.stock} onChange={(e) => setEdit({ ...edit, stock: e.target.value })} /> : p.stock}
                    </td>
                    <td className="p-3">
                      {editing ? <input className={input} type="number" value={edit.low_stock_limit} onChange={(e) => setEdit({ ...edit, low_stock_limit: e.target.value })} /> : p.low_stock_limit}
                    </td>
                    <td className="p-3">
                      {p.stock === 0 ? (
                        <span className="text-red-600 font-medium">Out of stock</span>
                      ) : low ? (
                        <span className="text-red-600 font-medium">Low stock</span>
                      ) : (
                        <span className="text-green-600">In stock</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {editing ? (
                        <>
                          <button onClick={saveEdit} className="text-green-600 font-medium mr-3">Save</button>
                          <button onClick={() => setEditId(null)} className="text-slate-500">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(p)} className="text-indigo-600 mr-3">Edit</button>
                          <button onClick={() => remove(p.id)} className="text-slate-500 hover:text-red-600">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
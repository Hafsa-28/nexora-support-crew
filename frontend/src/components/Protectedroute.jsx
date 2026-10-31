import { Navigate } from 'react-router-dom'
import { getToken } from '../api'

export default function ProtectedRoute({ children }) {
  const isOwner = getToken() && localStorage.getItem('role') === 'owner'
  return isOwner ? children : <Navigate to="/login" replace />
}
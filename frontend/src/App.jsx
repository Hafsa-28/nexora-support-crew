import { Routes, Route } from 'react-router-dom'
import Approvals from './pages/Approvals'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Chat from './pages/Chat'
import Overview from './pages/Overview'
import Inventory from './pages/Inventory'

const Page = ({ title }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold">{title}</h2>
  </div>
)

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/chat" element={<Chat />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="conversations" element={<Page title="Conversations" />} />
        <Route path="activity" element={<Page title="Activity log" />} />
        <Route path="settings" element={<Page title="Settings" />} />
      </Route>
    </Routes>
  )
}
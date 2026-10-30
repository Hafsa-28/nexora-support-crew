import Overview from './pages/Overview'
import Chat from './pages/Chat'
import Login from './pages/Login'
import Landing from './pages/Landing'
import { Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'

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
      <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
        <Route path="inventory" element={<Page title="Inventory" />} />
        <Route path="approvals" element={<Page title="Approvals" />} />
        <Route path="conversations" element={<Page title="Conversations" />} />
        <Route path="activity" element={<Page title="Activity log" />} />
        <Route path="settings" element={<Page title="Settings" />} />
      </Route>
    </Routes>
  )
}
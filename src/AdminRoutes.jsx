import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Testimonials from './pages/Testimonials'
import Blog from './pages/Blog'
import Messages from './pages/Messages'
import Subscribers from './pages/Subscribers'
import Clients from './pages/Clients'
import Invoices from './pages/Invoices'
import Media from './pages/Media'
import ActivityLog from './pages/ActivityLog'
import Leads from './pages/Leads'
import GroqKeys from './pages/GroqKeys'

function AdminPage({ children }) {
  return <AdminLayout>{children}</AdminLayout>
}

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<PrivateRoute><AdminPage><Dashboard /></AdminPage></PrivateRoute>} />
      <Route path="/projects" element={<PrivateRoute><AdminPage><Projects /></AdminPage></PrivateRoute>} />
      <Route path="/testimonials" element={<PrivateRoute><AdminPage><Testimonials /></AdminPage></PrivateRoute>} />
      <Route path="/blog" element={<PrivateRoute><AdminPage><Blog /></AdminPage></PrivateRoute>} />
      <Route path="/messages" element={<PrivateRoute><AdminPage><Messages /></AdminPage></PrivateRoute>} />
      <Route path="/subscribers" element={<PrivateRoute><AdminPage><Subscribers /></AdminPage></PrivateRoute>} />
      <Route path="/clients" element={<PrivateRoute><AdminPage><Clients /></AdminPage></PrivateRoute>} />
      <Route path="/leads" element={<PrivateRoute><AdminPage><Leads /></AdminPage></PrivateRoute>} />
      <Route path="/invoices" element={<PrivateRoute><AdminPage><Invoices /></AdminPage></PrivateRoute>} />
      <Route path="/media" element={<PrivateRoute><AdminPage><Media /></AdminPage></PrivateRoute>} />
      <Route path="/groq-keys" element={<PrivateRoute><AdminPage><GroqKeys /></AdminPage></PrivateRoute>} />
      <Route path="/activity" element={<PrivateRoute><AdminPage><ActivityLog /></AdminPage></PrivateRoute>} />
    </Routes>
  )
}

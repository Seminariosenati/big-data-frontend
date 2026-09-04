import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'

import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import ServicesPage from './pages/ServicesPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './routes/ProtectedRoute'
import './styles/index.css'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="nosotros" element={<AboutPage />} />
        <Route path="servicios" element={<ServicesPage />} />
        <Route path="contacto" element={<ContactPage />} />
      </Route>

      <Route path="login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}
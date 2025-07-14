import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import ProtectedRoute from './components/ProtectedRoute'

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inspections = lazy(() => import('./pages/Inspections'));
const Contato = lazy(() => import('./pages/Contato'))
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-primary-500 h-12 w-12 mb-4"></div>
          <div className="text-primary-600 text-xl font-medium">Carregando...</div>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contato" element={<Contato />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/inspections" element={<Inspections />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App
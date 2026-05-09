import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import clsx from 'clsx'
import { useStore } from './store'
import { themes } from './theme'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Drivers from './pages/Drivers'
import Payments from './pages/Payments'
import Alerts from './pages/Alerts'
import SurgeZones from './pages/SurgeZones'
import LiveMap from './pages/LiveMap'
import Settings from './pages/Settings'
import type { Role } from './store'

// Pages accessible per role
const roleAccess: Record<Role, string[]> = {
  admin:  ['Dashboard', 'Live Map', 'Drivers', 'Payments', 'Surge Zones', 'Alerts', 'Settings'],
  driver: ['Dashboard', 'My Trips', 'Payments', 'Live Map', 'Rating', 'Settings'],
  rider:  ['Book Ride', 'My Trips', 'Payments', 'Rating', 'Settings'],
}

function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
        <span className="text-2xl">🚧</span>
      </div>
      <p className="text-white font-semibold">{title}</p>
      <p className="text-sm text-gray-500 max-w-xs">{desc}</p>
    </div>
  )
}

function PageContent({ page }: { page: string }) {
  switch (page) {
    case 'Dashboard':   return <Dashboard />
    case 'Live Map':    return <LiveMap />
    case 'Drivers':     return <Drivers />
    case 'Payments':    return <Payments />
    case 'Surge Zones': return <SurgeZones />
    case 'Alerts':      return <Alerts />
    case 'Settings':    return <Settings />
    case 'My Trips':    return <ComingSoon title="My Trips" desc="Your full trip history with route, fare, and driver details." />
    case 'Book Ride':   return <ComingSoon title="Book a Ride" desc="Enter your pickup and dropoff to request a trip." />
    case 'Rating':      return <ComingSoon title="Ratings & Feedback" desc="View your rating history and leave feedback." />
    default:
      return <ComingSoon title={page} desc="This section is coming soon." />
  }
}

export default function App() {
  const { user, theme, sidebarCollapsed } = useStore()
  const [page, setPage] = useState('Dashboard')
  const t = themes[theme]

  // set sensible default page per role
  const defaultPage: Record<Role, string> = {
    admin:  'Dashboard',
    driver: 'Dashboard',
    rider:  'Book Ride',
  }

  if (!user) return (
    <>
      <Login />
      <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' } }} />
    </>
  )

  const navigate = (p: string) => {
    if (roleAccess[user.role].includes(p)) setPage(p)
  }

  // if current page not accessible for this role, redirect to default
  const activePage = roleAccess[user.role].includes(page) ? page : defaultPage[user.role]

  return (
    <div className={clsx('min-h-screen', t.bg, t.text)}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' } }} />
      <Navbar active={activePage} onNav={navigate} />
      <Sidebar active={activePage} onNav={navigate} />

      <main className={clsx('pt-16 min-h-screen transition-all duration-300', sidebarCollapsed ? 'ml-14' : 'ml-56')}>
        <div className="p-6 max-w-7xl mx-auto">
          <div key={activePage} className="animate-fade-in">
            <PageContent page={activePage} />
          </div>
        </div>
      </main>
    </div>
  )
}

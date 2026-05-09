import { Bell, Activity, LogOut, Menu } from 'lucide-react'
import { useStore } from '../store'
import { themes } from '../theme'
import clsx from 'clsx'

interface Props { onNav: (page: string) => void; active: string }

export default function Navbar({ onNav, active }: Props) {
  const { user, setUser, theme, toggleSidebar } = useStore()
  const t = themes[theme]

  const handleLogout = () => {
    setUser(null)
    // clear persisted state so re-hydration doesn't restore the session
    localStorage.removeItem('ride-platform-admin')
  }

  return (
    <nav className={clsx('fixed top-0 left-0 right-0 z-50 h-16 border-b flex items-center px-4 gap-3', t.navBg)}>
      {/* Hamburger — sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        title="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 mr-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Activity size={16} className="text-white" />
        </div>
        <span className={clsx('font-bold text-base tracking-tight', t.text)}>RidePlatform</span>
        <span className="text-xs text-indigo-400 font-medium bg-indigo-900/50 px-2 py-0.5 rounded-full">Admin</span>
      </div>

      {/* Nav links — role aware */}
      <div className="hidden md:flex items-center gap-1 flex-1">
        {user?.role === 'admin' && ['Dashboard', 'Live Map', 'Drivers', 'Payments', 'Surge Zones', 'Alerts'].map(label => (
          <button key={label} onClick={() => onNav(label)}
            className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              active === label
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : clsx(t.textMuted, 'hover:text-white hover:bg-gray-800'))}>
            {label}
          </button>
        ))}
        {user?.role === 'driver' && ['Dashboard', 'My Trips', 'Payments', 'Live Map'].map(label => (
          <button key={label} onClick={() => onNav(label)}
            className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              active === label
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : clsx(t.textMuted, 'hover:text-white hover:bg-gray-800'))}>
            {label}
          </button>
        ))}
        {user?.role === 'rider' && ['Book Ride', 'My Trips', 'Payments'].map(label => (
          <button key={label} onClick={() => onNav(label)}
            className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              active === label
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : clsx(t.textMuted, 'hover:text-white hover:bg-gray-800'))}>
            {label}
          </button>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
        <button className={clsx('relative p-2 rounded-lg transition-colors', t.textMuted, 'hover:text-white hover:bg-gray-800')}>
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {user.avatar}
            </div>
            <div className="hidden sm:block">
              <p className={clsx('text-xs font-medium leading-none', t.text)}>{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
          title="Sign out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </nav>
  )
}

import { useState } from 'react'
import { Activity, Eye, EyeOff, Shield } from 'lucide-react'
import { useStore, type Role } from '../store'
import toast from 'react-hot-toast'

// Demo credentials per role
const DEMO_USERS = [
  { email: 'admin@ride.com',  password: 'admin123',  role: 'admin'  as Role, name: 'Alex Admin',   avatar: 'A' },
  { email: 'driver@ride.com', password: 'driver123', role: 'driver' as Role, name: 'David Driver',  avatar: 'D' },
  { email: 'rider@ride.com',  password: 'rider123',  role: 'rider'  as Role, name: 'Rachel Rider',  avatar: 'R' },
]

const roleColors: Record<Role, string> = {
  admin:  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  driver: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rider:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

const roleDesc: Record<Role, string> = {
  admin:  'Platform staff — full access to all features, analytics, driver approvals',
  driver: 'Driver account — my trips, earnings, location history, vehicle info',
  rider:  'Rider account — book trips, trip history, payments, profile',
}

export default function Login() {
  const setUser = useStore(s => s.setUser)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const match = DEMO_USERS.find(u => u.email === email && u.password === password)
    if (match) {
      setUser({ id: match.email, name: match.name, email: match.email, role: match.role, avatar: match.avatar })
      toast.success(`Welcome back, ${match.name}!`)
    } else {
      toast.error('Invalid credentials')
    }
    setLoading(false)
  }

  const quickLogin = (u: typeof DEMO_USERS[0]) => {
    setEmail(u.email)
    setPassword(u.password)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 shadow-xl shadow-indigo-500/30">
            <Activity size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">RidePlatform</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Console</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@ride.com"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={13} className="text-gray-500" />
              <p className="text-xs text-gray-500 font-medium">Demo accounts — click to fill</p>
            </div>
            <div className="space-y-2">
              {DEMO_USERS.map(u => (
                <button key={u.role} onClick={() => quickLogin(u)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 transition-all text-left group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {u.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleColors[u.role]}`}>
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-1">
              {Object.entries(roleDesc).map(([role, desc]) => (
                <p key={role} className="text-xs text-gray-600">
                  <span className="text-gray-500 font-medium capitalize">{role}:</span> {desc}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

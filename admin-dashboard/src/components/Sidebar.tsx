import { LayoutDashboard, Users, Zap, CreditCard, Bell, Settings, Map, ChevronRight, Car, History, MapPin, Star } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import { themes } from '../theme'
import type { Role } from '../store'

const allItems = [
  // Admin sees everything
  { icon: LayoutDashboard, label: 'Dashboard',       page: 'Dashboard',   roles: ['admin'] as Role[],                  desc: 'Platform overview' },
  { icon: Map,             label: 'Live Map',         page: 'Live Map',    roles: ['admin'] as Role[],                  desc: 'Driver locations' },
  { icon: Users,           label: 'Driver Approvals', page: 'Drivers',     roles: ['admin'] as Role[],                  desc: 'Onboarding queue' },
  { icon: CreditCard,      label: 'Payments',         page: 'Payments',    roles: ['admin'] as Role[],                  desc: 'Revenue & transactions' },
  { icon: Zap,             label: 'Surge Zones',      page: 'Surge Zones', roles: ['admin'] as Role[],                  desc: 'Pricing heatmap' },
  { icon: Bell,            label: 'Alerts',           page: 'Alerts',      roles: ['admin'] as Role[],                  desc: 'System health' },
  // Driver sees their own stuff
  { icon: LayoutDashboard, label: 'My Dashboard',     page: 'Dashboard',   roles: ['driver'] as Role[],                 desc: 'Earnings & stats' },
  { icon: Car,             label: 'My Trips',         page: 'My Trips',    roles: ['driver'] as Role[],                 desc: 'Trip history' },
  { icon: CreditCard,      label: 'My Earnings',      page: 'Payments',    roles: ['driver'] as Role[],                 desc: 'Payouts & earnings' },
  { icon: MapPin,          label: 'Live Map',         page: 'Live Map',    roles: ['driver'] as Role[],                 desc: 'Current location' },
  { icon: Star,            label: 'My Rating',        page: 'Rating',      roles: ['driver'] as Role[],                 desc: 'Rider feedback' },
  // Rider sees their own stuff
  { icon: MapPin,          label: 'Book a Ride',      page: 'Book Ride',   roles: ['rider'] as Role[],                  desc: 'Request a trip' },
  { icon: History,         label: 'Trip History',     page: 'My Trips',    roles: ['rider'] as Role[],                  desc: 'Past trips' },
  { icon: CreditCard,      label: 'Payments',         page: 'Payments',    roles: ['rider'] as Role[],                  desc: 'Receipts & methods' },
  { icon: Star,            label: 'Rate a Driver',    page: 'Rating',      roles: ['rider'] as Role[],                  desc: 'Leave feedback' },
  // Everyone
  { icon: Settings,        label: 'Settings',         page: 'Settings',    roles: ['admin','driver','rider'] as Role[], desc: 'Preferences' },
]

const roleLabel: Record<Role, { label: string; color: string }> = {
  admin:  { label: 'Admin',  color: 'bg-indigo-500/20 text-indigo-300' },
  driver: { label: 'Driver', color: 'bg-emerald-500/20 text-emerald-300' },
  rider:  { label: 'Rider',  color: 'bg-amber-500/20 text-amber-300' },
}

const health = [
  { label: 'Kafka',         ok: true },
  { label: 'Elasticsearch', ok: true },
  { label: 'Redis',         ok: true },
  { label: 'Cassandra',     ok: true },
  { label: 'Stripe',        ok: true },
]

interface Props { active: string; onNav: (page: string) => void }

export default function Sidebar({ active, onNav }: Props) {
  const { user, theme, sidebarCollapsed } = useStore()
  const t = themes[theme]
  const items = allItems.filter(i => user && i.roles.includes(user.role))

  if (sidebarCollapsed) {
    return (
      <aside className={clsx('fixed left-0 top-16 bottom-0 w-14 border-r flex flex-col py-4 items-center gap-1', t.surface, t.border)}>
        {items.map(({ icon: Icon, page, label }) => (
          <button key={`${page}-${label}`} onClick={() => onNav(page)}
            title={label}
            className={clsx('p-3 rounded-xl transition-all duration-200',
              active === page ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-800')}>
            <Icon size={18} />
          </button>
        ))}
      </aside>
    )
  }

  const rl = user ? roleLabel[user.role] : null

  return (
    <aside className={clsx('fixed left-0 top-16 bottom-0 w-56 border-r flex flex-col py-4 px-3 transition-all duration-300 overflow-y-auto', t.surface, t.border)}>

      {/* Role badge */}
      {rl && (
        <div className="px-3 mb-4">
          <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full', rl.color)}>
            {rl.label} Portal
          </span>
        </div>
      )}

      <nav className="flex flex-col gap-1 flex-1">
        {items.map(({ icon: Icon, label, page, desc }) => (
          <button key={`${page}-${label}`} onClick={() => onNav(page)}
            className={clsx('group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left',
              active === page
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                : clsx(t.textMuted, 'hover:text-white hover:bg-gray-800/60'))}>
            <Icon size={16} className={active === page ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'} />
            <div className="flex-1 min-w-0">
              <p className="leading-none">{label}</p>
              <p className="text-xs text-gray-600 mt-0.5 truncate">{desc}</p>
            </div>
            {active === page && <ChevronRight size={13} className="text-indigo-400 shrink-0" />}
          </button>
        ))}
      </nav>

      {/* System health — admin only */}
      {user?.role === 'admin' && (
        <div className={clsx('mt-4 p-3 rounded-xl border', t.border, 'bg-gray-800/40')}>
          <p className={clsx('text-xs font-semibold mb-2', t.textMuted)}>System Health</p>
          {health.map(({ label, ok }) => (
            <div key={label} className="flex items-center justify-between py-0.5">
              <span className="text-xs text-gray-500">{label}</span>
              <span className={clsx('w-2 h-2 rounded-full', ok ? 'bg-emerald-400' : 'bg-red-400 animate-pulse')} />
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

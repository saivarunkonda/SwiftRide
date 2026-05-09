import { Sun, Moon, Waves, Sunset } from 'lucide-react'
import { useStore, type Theme } from '../store'
import { themes } from '../theme'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const themeOptions: { id: Theme; label: string; icon: typeof Sun; preview: string }[] = [
  { id: 'dark',     label: 'Dark',     icon: Moon,    preview: 'bg-gray-950 border-gray-800' },
  { id: 'light',    label: 'Light',    icon: Sun,     preview: 'bg-gray-50 border-gray-300' },
  { id: 'midnight', label: 'Midnight', icon: Sunset,  preview: 'bg-slate-950 border-slate-700' },
  { id: 'ocean',    label: 'Ocean',    icon: Waves,   preview: 'bg-cyan-950 border-cyan-800' },
]

export default function Settings() {
  const { user, theme, setTheme } = useStore()

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Preferences and account configuration</p>
      </div>

      {/* Profile */}
      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            {user?.avatar}
          </div>
          <div>
            <p className="text-white font-semibold">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
              {user?.role}
            </span>
          </div>
        </div>
      </section>

      {/* Theme picker */}
      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Appearance</h2>
        <p className="text-xs text-gray-500">Choose a theme for the dashboard</p>
        <div className="grid grid-cols-2 gap-3">
          {themeOptions.map(t => (
            <button key={t.id} onClick={() => { setTheme(t.id); toast.success(`${t.label} theme applied`) }}
              className={clsx(
                'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                theme === t.id
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              )}>
              {/* Mini preview */}
              <div className={clsx('w-10 h-10 rounded-lg border-2 shrink-0', t.preview)} />
              <div>
                <p className="text-sm font-medium text-white flex items-center gap-2">
                  <t.icon size={14} className="text-gray-400" />
                  {t.label}
                </p>
                {theme === t.id && <p className="text-xs text-indigo-400 mt-0.5">Active</p>}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Notifications</h2>
        {[
          { label: 'Critical alerts',       desc: 'Kafka lag, payment failures, service down', on: true },
          { label: 'Surge zone alerts',     desc: 'When surge exceeds 2.5x in any zone',       on: true },
          { label: 'Driver onboarding',     desc: 'New applications submitted',                on: false },
          { label: 'Revenue milestones',    desc: 'Daily revenue targets reached',             on: false },
        ].map(({ label, desc, on }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
            <div>
              <p className="text-sm text-white">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => toast.success('Preference saved')}
              className={clsx(
                'relative w-11 h-6 rounded-full transition-colors duration-200',
                on ? 'bg-indigo-600' : 'bg-gray-700'
              )}>
              <span className={clsx(
                'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                on ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>
        ))}
      </section>

      {/* API config */}
      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">API Configuration</h2>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Gateway URL</label>
          <input
            defaultValue={import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          onClick={() => toast.success('Settings saved')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
          Save Changes
        </button>
      </section>
    </div>
  )
}

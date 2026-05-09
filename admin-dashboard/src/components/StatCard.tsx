import { type LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'sky'
  trend?: { value: number; label: string }
  animate?: boolean
}

const colorMap = {
  indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  icon: 'bg-indigo-500/20 text-indigo-400',  text: 'text-indigo-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'bg-emerald-500/20 text-emerald-400', text: 'text-emerald-400' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'bg-amber-500/20 text-amber-400',    text: 'text-amber-400' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    icon: 'bg-rose-500/20 text-rose-400',      text: 'text-rose-400' },
  purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  icon: 'bg-purple-500/20 text-purple-400',  text: 'text-purple-400' },
  sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     icon: 'bg-sky-500/20 text-sky-400',        text: 'text-sky-400' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color, trend, animate }: Props) {
  const c = colorMap[color]
  return (
    <div className={clsx(
      'relative rounded-2xl border p-5 flex flex-col gap-3 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-default',
      c.bg, c.border
    )}>
      {/* Glow blob */}
      <div className={clsx('absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20', c.icon)} />

      <div className="flex items-start justify-between">
        <div className={clsx('p-2.5 rounded-xl', c.icon)}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={clsx(
            'text-xs font-semibold px-2 py-1 rounded-full',
            trend.value >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          )}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className={clsx('text-3xl font-bold text-white', animate && 'animate-pulse')}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && <p className="text-xs text-gray-600 mt-1">{trend.label}</p>}
      </div>
    </div>
  )
}

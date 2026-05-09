import { useState } from 'react'
import { AlertTriangle, Info, CheckCircle, XCircle, Bell, BellOff } from 'lucide-react'
import clsx from 'clsx'

type Severity = 'critical' | 'warning' | 'info' | 'resolved'

interface Alert {
  id: string; title: string; message: string
  severity: Severity; service: string; time: string; muted: boolean
}

const INITIAL_ALERTS: Alert[] = [
  { id: '1', title: 'High Kafka Consumer Lag',      message: 'trip-matching-group lag exceeded 10,000 messages on driver.location.updates', severity: 'critical', service: 'Kafka',         time: '2 min ago',  muted: false },
  { id: '2', title: 'Surge Pricing Elevated',        message: 'Zone 9q8yy surge multiplier at 3.0x for 15+ minutes',                        severity: 'warning',  service: 'Surge',         time: '8 min ago',  muted: false },
  { id: '3', title: 'Payment Failure Rate Spike',    message: 'Stripe payment failures at 4.2% (threshold: 2%)',                             severity: 'critical', service: 'Payments',      time: '14 min ago', muted: false },
  { id: '4', title: 'Elasticsearch Slow Queries',    message: 'p99 geo_distance query latency at 850ms (threshold: 500ms)',                  severity: 'warning',  service: 'Elasticsearch', time: '22 min ago', muted: false },
  { id: '5', title: 'Redis Memory Usage High',       message: 'ElastiCache memory at 78% capacity',                                         severity: 'warning',  service: 'Redis',         time: '35 min ago', muted: false },
  { id: '6', title: 'Location Service Scaled Up',    message: 'HPA scaled location-service from 3 to 8 pods due to CPU pressure',           severity: 'info',     service: 'EKS',           time: '41 min ago', muted: false },
  { id: '7', title: 'Cassandra Compaction Complete', message: 'driver_locations table compaction finished successfully',                     severity: 'resolved', service: 'Cassandra',     time: '1 hr ago',   muted: false },
]

const severityConfig: Record<Severity, { icon: typeof AlertTriangle; style: string; dot: string }> = {
  critical: { icon: XCircle,       style: 'border-rose-500/30 bg-rose-500/5',    dot: 'bg-rose-500 animate-pulse' },
  warning:  { icon: AlertTriangle, style: 'border-amber-500/30 bg-amber-500/5',  dot: 'bg-amber-500' },
  info:     { icon: Info,          style: 'border-sky-500/30 bg-sky-500/5',      dot: 'bg-sky-500' },
  resolved: { icon: CheckCircle,   style: 'border-emerald-500/30 bg-emerald-500/5', dot: 'bg-emerald-500' },
}

const iconColor: Record<Severity, string> = {
  critical: 'text-rose-400', warning: 'text-amber-400', info: 'text-sky-400', resolved: 'text-emerald-400',
}

export default function Alerts() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS)
  const [filter, setFilter] = useState<Severity | 'ALL'>('ALL')

  const toggle = (id: string) => setAlerts(a => a.map(x => x.id === id ? { ...x, muted: !x.muted } : x))
  const dismiss = (id: string) => setAlerts(a => a.filter(x => x.id !== id))

  const counts = {
    critical: alerts.filter(a => a.severity === 'critical' && !a.muted).length,
    warning:  alerts.filter(a => a.severity === 'warning'  && !a.muted).length,
  }

  const visible = alerts.filter(a => filter === 'ALL' || a.severity === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">System health and incident notifications</p>
        </div>
        <div className="flex gap-3">
          {counts.critical > 0 && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold px-3 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {counts.critical} Critical
            </div>
          )}
          {counts.warning > 0 && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-2 rounded-xl">
              {counts.warning} Warning
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {(['ALL', 'critical', 'warning', 'info', 'resolved'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx('text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-colors',
              filter === f ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white')}>
            {f}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="flex flex-col items-center py-16 text-gray-600">
            <CheckCircle size={40} className="text-emerald-500/30 mb-3" />
            <p className="text-sm">No alerts in this category</p>
          </div>
        )}
        {visible.map(alert => {
          const { icon: Icon, style, dot } = severityConfig[alert.severity]
          return (
            <div key={alert.id}
              className={clsx('rounded-2xl border p-4 flex gap-4 transition-all duration-200', style, alert.muted && 'opacity-40')}>
              <div className="mt-0.5 shrink-0">
                <Icon size={18} className={iconColor[alert.severity]} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={clsx('w-2 h-2 rounded-full shrink-0', dot)} />
                  <p className="text-sm font-semibold text-white">{alert.title}</p>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full ml-1">{alert.service}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{alert.message}</p>
                <p className="text-xs text-gray-600 mt-1.5">{alert.time}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggle(alert.id)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                  title={alert.muted ? 'Unmute' : 'Mute'}>
                  {alert.muted ? <Bell size={14} /> : <BellOff size={14} />}
                </button>
                <button onClick={() => dismiss(alert.id)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-gray-800 transition-colors">
                  <XCircle size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

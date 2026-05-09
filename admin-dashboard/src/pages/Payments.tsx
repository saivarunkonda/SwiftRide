import { useState } from 'react'
import { DollarSign, TrendingUp, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import clsx from 'clsx'

const revenueData = Array.from({ length: 30 }, (_, i) => ({
  day: `May ${i + 1}`,
  revenue: Math.floor(18000 + Math.random() * 15000),
  refunds: Math.floor(200 + Math.random() * 800),
}))

const transactions = [
  { id: 'pay_001', tripId: 'trip-abc', rider: 'rider-123', amount: 24.50, surge: 1.5, status: 'CAPTURED',  time: '2 min ago' },
  { id: 'pay_002', tripId: 'trip-def', rider: 'rider-456', amount: 11.20, surge: 1.0, status: 'CAPTURED',  time: '5 min ago' },
  { id: 'pay_003', tripId: 'trip-ghi', rider: 'rider-789', amount: 38.90, surge: 2.0, status: 'REFUNDED',  time: '12 min ago' },
  { id: 'pay_004', tripId: 'trip-jkl', rider: 'rider-012', amount: 9.80,  surge: 1.0, status: 'FAILED',    time: '18 min ago' },
  { id: 'pay_005', tripId: 'trip-mno', rider: 'rider-345', amount: 52.10, surge: 2.5, status: 'CAPTURED',  time: '25 min ago' },
  { id: 'pay_006', tripId: 'trip-pqr', rider: 'rider-678', amount: 16.40, surge: 1.2, status: 'PENDING',   time: '31 min ago' },
]

const statusIcon = { CAPTURED: CheckCircle, REFUNDED: RefreshCw, FAILED: XCircle, PENDING: Clock }
const statusStyle: Record<string, string> = {
  CAPTURED: 'text-emerald-400 bg-emerald-500/10',
  REFUNDED: 'text-amber-400 bg-amber-500/10',
  FAILED:   'text-rose-400 bg-rose-500/10',
  PENDING:  'text-sky-400 bg-sky-500/10',
}

export default function Payments() {
  const [filter, setFilter] = useState('ALL')
  const filters = ['ALL', 'CAPTURED', 'REFUNDED', 'FAILED', 'PENDING']
  const filtered = filter === 'ALL' ? transactions : transactions.filter(t => t.status === filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-sm text-gray-500 mt-0.5">Transaction history and revenue analytics</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Revenue Today',    value: '$28,640', icon: DollarSign,  color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Transactions',     value: '3,847',   icon: TrendingUp,  color: 'text-indigo-400 bg-indigo-500/10' },
          { label: 'Refunds Today',    value: '$1,240',  icon: RefreshCw,   color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Failed Payments',  value: '23',      icon: XCircle,     color: 'text-rose-400 bg-rose-500/10' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl bg-gray-900 border border-gray-800 p-5 hover:border-gray-700 transition-colors">
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
        <h3 className="text-white font-semibold mb-4">Revenue — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', color: '#f9fafb' }} />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rev)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions table */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Recent Transactions</h3>
          <div className="flex gap-1">
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={clsx('text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                  filter === f ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                {['Payment ID', 'Trip', 'Rider', 'Amount', 'Surge', 'Status', 'Time'].map(h => (
                  <th key={h} className="text-left pb-3 pr-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filtered.map(t => {
                const Icon = statusIcon[t.status as keyof typeof statusIcon]
                return (
                  <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-400">{t.id}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-400">{t.tripId}</td>
                    <td className="py-3 pr-4 text-gray-300">{t.rider}</td>
                    <td className="py-3 pr-4 font-semibold text-white">${t.amount.toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                        t.surge > 1 ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400 bg-gray-700')}>
                        {t.surge}x
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={clsx('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium', statusStyle[t.status])}>
                        <Icon size={11} />
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-500">{t.time}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

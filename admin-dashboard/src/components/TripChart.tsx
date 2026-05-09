import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock time-series data — replace with real API call
const data = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  trips: Math.floor(40 + Math.random() * 120),
  revenue: Math.floor(200 + Math.random() * 800),
}))

export default function TripChart() {
  return (
    <div className="rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold">Trips & Revenue</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 24 hours</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-3 h-0.5 bg-indigo-400 rounded" /> Trips
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-3 h-0.5 bg-emerald-400 rounded" /> Revenue
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trips" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} interval={3} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f9fafb' }}
            cursor={{ stroke: '#4b5563' }}
          />
          <Area type="monotone" dataKey="trips"   stroke="#6366f1" strokeWidth={2} fill="url(#trips)"   dot={false} />
          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenue)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

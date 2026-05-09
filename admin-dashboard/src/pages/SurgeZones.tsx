import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { api } from '../api'
import type { SurgeZone } from '../types'

const MOCK: SurgeZone[] = [
  { zoneId: '9q8yy', avgSurge: 2.8, tripCount: 142 },
  { zoneId: '9q8yz', avgSurge: 2.1, tripCount: 98 },
  { zoneId: '9q8yu', avgSurge: 1.7, tripCount: 76 },
  { zoneId: '9q8yv', avgSurge: 1.4, tripCount: 54 },
  { zoneId: '9q8yw', avgSurge: 1.2, tripCount: 31 },
  { zoneId: '9q8yx', avgSurge: 1.0, tripCount: 18 },
]

function barColor(surge: number) {
  if (surge >= 2.5) return '#f43f5e'
  if (surge >= 1.5) return '#f59e0b'
  return '#10b981'
}

export default function SurgeZones() {
  const [zones, setZones] = useState<SurgeZone[]>(MOCK)

  useEffect(() => {
    api.getSurgeZones()
      .then(d => setZones(d as SurgeZone[]))
      .catch(() => {})
    const t = setInterval(() => {
      api.getSurgeZones().then(d => setZones(d as SurgeZone[])).catch(() => {})
    }, 10_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Surge Zones</h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time demand/supply ratio by geohash zone</p>
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        {[
          { label: 'No surge (1.0x)',   color: 'bg-emerald-400' },
          { label: 'Moderate (1.5–2.4x)', color: 'bg-amber-400' },
          { label: 'High surge (2.5x+)', color: 'bg-rose-400' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-gray-400">
            <span className={`w-3 h-3 rounded-sm ${color}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
        <h3 className="text-white font-semibold mb-4">Surge Multiplier by Zone</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={zones} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="zoneId" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 4]} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f9fafb' }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="avgSurge" radius={[6, 6, 0, 0]}>
              {zones.map((z) => (
                <Cell key={z.zoneId} fill={barColor(z.avgSurge)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Zone cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        {zones.map(z => (
          <div key={z.zoneId} className="rounded-xl bg-gray-800/50 border border-gray-700 p-4 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <code className="text-sm text-gray-300 font-mono">{z.zoneId}</code>
              <span
                className="text-sm font-bold px-2 py-0.5 rounded-lg"
                style={{ color: barColor(z.avgSurge), background: `${barColor(z.avgSurge)}18` }}
              >
                {z.avgSurge.toFixed(1)}x
              </span>
            </div>
            <p className="text-xs text-gray-500">{z.tripCount} trips in last hour</p>
            {/* Mini surge bar */}
            <div className="mt-3 h-1.5 rounded-full bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((z.avgSurge / 4) * 100, 100)}%`, background: barColor(z.avgSurge) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

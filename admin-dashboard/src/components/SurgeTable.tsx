import { Zap } from 'lucide-react'
import clsx from 'clsx'
import type { SurgeZone } from '../types'

interface Props { zones: SurgeZone[] }

function surgeColor(v: number) {
  if (v >= 2.5) return 'text-rose-400 bg-rose-500/10'
  if (v >= 1.5) return 'text-amber-400 bg-amber-500/10'
  return 'text-emerald-400 bg-emerald-500/10'
}

export default function SurgeTable({ zones }: Props) {
  return (
    <div className="rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-amber-400" />
        <h3 className="text-white font-semibold">Top Surge Zones</h3>
        <span className="ml-auto text-xs text-gray-500">Last hour</span>
      </div>
      <div className="space-y-2">
        {zones.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">No surge zones active</p>
        )}
        {zones.map((z, i) => (
          <div key={z.zoneId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/50 hover:bg-gray-900 transition-colors">
            <span className="text-xs font-bold text-gray-600 w-5">#{i + 1}</span>
            <code className="text-xs text-gray-300 font-mono flex-1">{z.zoneId}</code>
            <span className="text-xs text-gray-500">{z.tripCount} trips</span>
            <span className={clsx('text-xs font-bold px-2 py-1 rounded-lg', surgeColor(z.avgSurge))}>
              {z.avgSurge.toFixed(1)}x
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

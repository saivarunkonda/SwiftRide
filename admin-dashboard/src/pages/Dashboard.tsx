import { useEffect, useState } from 'react'
import { Car, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, Zap } from 'lucide-react'
import StatCard from '../components/StatCard'
import TripChart from '../components/TripChart'
import SurgeTable from '../components/SurgeTable'
import { api } from '../api'
import type { DashboardSummary } from '../types'

// Fallback mock data so the UI looks great without a running backend
const MOCK: DashboardSummary = {
  tripsToday: 3847,
  revenueToday: 28640,
  tripsLastHour: 214,
  activeTrips: 87,
  completedToday: 3701,
  cancelledToday: 146,
  avgMatchLatencyMs: 312,
  topSurgeZones: [
    { zoneId: '9q8yy', avgSurge: 2.8, tripCount: 142 },
    { zoneId: '9q8yz', avgSurge: 2.1, tripCount: 98 },
    { zoneId: '9q8yu', avgSurge: 1.7, tripCount: 76 },
    { zoneId: '9q8yv', avgSurge: 1.4, tripCount: 54 },
    { zoneId: '9q8yw', avgSurge: 1.2, tripCount: 31 },
  ],
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary>(MOCK)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    const load = async () => {
      try {
        const d = await api.getDashboard() as DashboardSummary
        setData(d)
        setLastRefresh(new Date())
      } catch {
        // backend not running — keep mock data
      }
    }
    load()
    const interval = setInterval(load, 15_000) // refresh every 15s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800 px-3 py-2 rounded-xl border border-gray-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Auto-refreshing every 15s
        </div>
      </div>

      {/* Flash cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Trips Today"
          value={data.tripsToday.toLocaleString()}
          icon={Car}
          color="indigo"
          trend={{ value: 12, label: 'vs yesterday' }}
        />
        <StatCard
          title="Revenue Today"
          value={`$${(data.revenueToday).toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
          trend={{ value: 8, label: 'vs yesterday' }}
        />
        <StatCard
          title="Active Trips"
          value={data.activeTrips}
          subtitle="Right now"
          icon={TrendingUp}
          color="purple"
          animate
        />
        <StatCard
          title="Avg Match Latency"
          value={`${data.avgMatchLatencyMs}ms`}
          subtitle="Last hour"
          icon={Clock}
          color="sky"
        />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Trips Last Hour"
          value={data.tripsLastHour}
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Completed Today"
          value={data.completedToday.toLocaleString()}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Cancelled Today"
          value={data.cancelledToday}
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="Surge Zones Active"
          value={data.topSurgeZones.length}
          icon={Zap}
          color="amber"
        />
      </div>

      {/* Chart + Surge table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <TripChart />
        </div>
        <SurgeTable zones={data.topSurgeZones} />
      </div>
    </div>
  )
}

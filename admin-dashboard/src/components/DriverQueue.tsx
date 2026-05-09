import { CheckCircle, XCircle, Car } from 'lucide-react'
import clsx from 'clsx'
import type { DriverApplication } from '../types'

interface Props {
  drivers: DriverApplication[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  loading: boolean
}

const statusStyle: Record<string, string> = {
  DOCUMENTS_SUBMITTED: 'text-amber-400 bg-amber-500/10',
  BACKGROUND_CHECK:    'text-sky-400 bg-sky-500/10',
  APPROVED:            'text-emerald-400 bg-emerald-500/10',
  REJECTED:            'text-rose-400 bg-rose-500/10',
  PENDING:             'text-gray-400 bg-gray-500/10',
}

export default function DriverQueue({ drivers, onApprove, onReject, loading }: Props) {
  return (
    <div className="rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Car size={16} className="text-indigo-400" />
        <h3 className="text-white font-semibold">Driver Onboarding Queue</h3>
        <span className="ml-2 text-xs font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full">
          {drivers.length}
        </span>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl bg-gray-700/50 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && drivers.length === 0 && (
        <div className="flex flex-col items-center py-10 text-gray-500">
          <CheckCircle size={32} className="text-emerald-500/40 mb-2" />
          <p className="text-sm">All applications reviewed</p>
        </div>
      )}

      <div className="space-y-2">
        {drivers.map(d => (
          <div key={d.userId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/50 hover:bg-gray-900 transition-all duration-200 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {d.vehicleMake[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {d.vehicleMake} {d.vehicleModel} {d.vehicleYear}
              </p>
              <p className="text-xs text-gray-500">{d.licensePlate} · {d.vehicleType}</p>
            </div>
            <span className={clsx('text-xs px-2 py-1 rounded-lg font-medium shrink-0', statusStyle[d.onboardingStatus])}>
              {d.onboardingStatus.replace('_', ' ')}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onApprove(d.userId)}
                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                title="Approve"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={() => onReject(d.userId)}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Reject"
              >
                <XCircle size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

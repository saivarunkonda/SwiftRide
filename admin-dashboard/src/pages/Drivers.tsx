import { useEffect, useState } from 'react'
import DriverQueue from '../components/DriverQueue'
import { api } from '../api'
import type { DriverApplication } from '../types'

const MOCK_DRIVERS: DriverApplication[] = [
  { userId: 'u1', licenseNumber: 'DL-123456', vehicleMake: 'Toyota', vehicleModel: 'Camry',   vehicleYear: 2022, licensePlate: 'ABC-1234', vehicleType: 'COMFORT', onboardingStatus: 'DOCUMENTS_SUBMITTED', createdAt: '2026-05-01' },
  { userId: 'u2', licenseNumber: 'DL-789012', vehicleMake: 'Honda',  vehicleModel: 'Civic',   vehicleYear: 2021, licensePlate: 'XYZ-5678', vehicleType: 'ECONOMY', onboardingStatus: 'BACKGROUND_CHECK',    createdAt: '2026-05-02' },
  { userId: 'u3', licenseNumber: 'DL-345678', vehicleMake: 'Ford',   vehicleModel: 'Explorer',vehicleYear: 2023, licensePlate: 'DEF-9012', vehicleType: 'XL',      onboardingStatus: 'DOCUMENTS_SUBMITTED', createdAt: '2026-05-03' },
]

export default function Drivers() {
  const [drivers, setDrivers] = useState<DriverApplication[]>(MOCK_DRIVERS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.getPendingDrivers()
      .then(d => setDrivers(d as DriverApplication[]))
      .catch(() => {}) // keep mock
      .finally(() => setLoading(false))
  }, [])

  const handleApprove = async (id: string) => {
    try { await api.approveDriver(id) } catch {}
    setDrivers(prev => prev.filter(d => d.userId !== id))
  }

  const handleReject = async (id: string) => {
    try { await api.rejectDriver(id) } catch {}
    setDrivers(prev => prev.filter(d => d.userId !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Driver Onboarding</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and approve driver applications</p>
      </div>
      <DriverQueue
        drivers={drivers}
        onApprove={handleApprove}
        onReject={handleReject}
        loading={loading}
      />
    </div>
  )
}

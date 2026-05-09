export interface DashboardSummary {
  tripsToday: number
  revenueToday: number
  tripsLastHour: number
  activeTrips: number
  completedToday: number
  cancelledToday: number
  avgMatchLatencyMs: number
  topSurgeZones: SurgeZone[]
}

export interface SurgeZone {
  zoneId: string
  avgSurge: number
  tripCount: number
}

export interface DriverApplication {
  userId: string
  licenseNumber: string
  vehicleMake: string
  vehicleModel: string
  vehicleYear: number
  licensePlate: string
  vehicleType: 'ECONOMY' | 'COMFORT' | 'XL'
  onboardingStatus: 'PENDING' | 'DOCUMENTS_SUBMITTED' | 'BACKGROUND_CHECK' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

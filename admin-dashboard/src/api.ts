const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

async function get<T>(path: string): Promise<T> {
  const token = localStorage.getItem('token') ?? ''
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function post(path: string) {
  const token = localStorage.getItem('token') ?? ''
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  getDashboard:       () => get('/v1/admin/dashboard'),
  getSurgeZones:      () => get('/v1/admin/surge-zones'),
  getPendingDrivers:  () => get('/v1/drivers/onboarding/pending'),
  approveDriver:      (id: string) => post(`/v1/drivers/onboarding/${id}/approve`),
  rejectDriver:       (id: string) => post(`/v1/drivers/onboarding/${id}/reject`),
}

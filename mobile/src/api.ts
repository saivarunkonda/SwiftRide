import * as SecureStore from 'expo-secure-store'

// Same gateway URL — swap for your EKS LoadBalancer DNS in production
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080'

async function getToken(): Promise<string> {
  return (await SecureStore.getItemAsync('jwt_token')) ?? ''
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  // Auth
  saveToken: (token: string) => SecureStore.setItemAsync('jwt_token', token),
  clearToken: ()             => SecureStore.deleteItemAsync('jwt_token'),

  // User
  getMe:     ()              => request('/v1/users/me'),
  register:  (body: object)  => request('/v1/users/register', { method: 'POST', body: JSON.stringify(body) }),

  // Trips
  requestMatch: (body: object) => request('/v1/trips/match',  { method: 'POST', body: JSON.stringify(body) }),
  getTrip:      (id: string)   => request(`/v1/trips/${id}`),
  acceptTrip:   (id: string, driverId: string) =>
    request(`/v1/trips/${id}/accept?driverId=${driverId}`, { method: 'POST' }),
  startTrip:    (id: string)   => request(`/v1/trips/${id}/start`,    { method: 'POST' }),
  completeTrip: (id: string, fare: number) =>
    request(`/v1/trips/${id}/complete?finalFare=${fare}`, { method: 'POST' }),
  cancelTrip:   (id: string)   => request(`/v1/trips/${id}/cancel`,   { method: 'POST' }),

  // Location (driver)
  updateLocation: (driverId: string, lat: number, lng: number, speed: number, heading: number) =>
    request(`/v1/drivers/${driverId}/location`, {
      method: 'POST',
      body: JSON.stringify({ lat, lng, speed, heading }),
    }),

  // Surge
  getSurge: (lat: number, lng: number) => request(`/v1/surge?lat=${lat}&lng=${lng}`),

  // Payments
  chargeTrip: (body: object) => request('/v1/payments/charge', { method: 'POST', body: JSON.stringify(body) }),
}

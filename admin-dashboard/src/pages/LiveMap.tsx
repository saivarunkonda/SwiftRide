import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Users } from 'lucide-react'

// Leaflet loaded via CDN to avoid SSR issues with Vite
declare global {
  interface Window { L: typeof import('leaflet') }
}

interface Driver {
  id: string; lat: number; lng: number; status: 'available' | 'on_trip'; speed: number
}

// Simulated drivers around San Francisco
function generateDrivers(count: number): Driver[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `driver-${i + 1}`,
    lat: 37.7749 + (Math.random() - 0.5) * 0.12,
    lng: -122.4194 + (Math.random() - 0.5) * 0.12,
    status: Math.random() > 0.4 ? 'available' : 'on_trip',
    speed: Math.floor(Math.random() * 60),
  }))
}

export default function LiveMap() {
  const mapRef    = useRef<HTMLDivElement>(null)
  const mapObj    = useRef<import('leaflet').Map | null>(null)
  const markers   = useRef<import('leaflet').Marker[]>([])
  const [drivers, setDrivers] = useState<Driver[]>(generateDrivers(40))
  const [leafletReady, setLeafletReady] = useState(false)

  // Load Leaflet CSS + JS dynamically
  useEffect(() => {
    if (document.getElementById('leaflet-css')) { setLeafletReady(true); return }
    const link = document.createElement('link')
    link.id   = 'leaflet-css'
    link.rel  = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletReady(true)
    document.head.appendChild(script)
  }, [])

  // Init map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapObj.current) return
    const L = window.L
    mapObj.current = L.map(mapRef.current).setView([37.7749, -122.4194], 13)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(mapObj.current)
  }, [leafletReady])

  // Update markers
  useEffect(() => {
    if (!leafletReady || !mapObj.current) return
    const L = window.L
    markers.current.forEach(m => m.remove())
    markers.current = []

    drivers.forEach(d => {
      const color = d.status === 'available' ? '#10b981' : '#6366f1'
      const icon = L.divIcon({
        html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 6px ${color}88"></div>`,
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })
      const marker = L.marker([d.lat, d.lng], { icon })
        .addTo(mapObj.current!)
        .bindPopup(`<b>${d.id}</b><br>Status: ${d.status}<br>Speed: ${d.speed} km/h`)
      markers.current.push(marker)
    })
  }, [drivers, leafletReady])

  // Simulate live movement
  useEffect(() => {
    const t = setInterval(() => {
      setDrivers(prev => prev.map(d => ({
        ...d,
        lat: d.lat + (Math.random() - 0.5) * 0.001,
        lng: d.lng + (Math.random() - 0.5) * 0.001,
        speed: Math.max(0, d.speed + Math.floor((Math.random() - 0.5) * 10)),
      })))
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const available = drivers.filter(d => d.status === 'available').length
  const onTrip    = drivers.filter(d => d.status === 'on_trip').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Map</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time driver locations — updates every 3s</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {available} Available
          </div>
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold px-3 py-2 rounded-xl">
            <Navigation size={12} />
            {onTrip} On Trip
          </div>
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-400 text-xs font-semibold px-3 py-2 rounded-xl">
            <Users size={12} />
            {drivers.length} Total
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-800 relative" style={{ height: '520px' }}>
        {!leafletReady && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <MapPin size={32} className="animate-bounce text-indigo-400" />
              <p className="text-sm">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
          Available driver
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50" />
          On trip
        </span>
      </div>
    </div>
  )
}

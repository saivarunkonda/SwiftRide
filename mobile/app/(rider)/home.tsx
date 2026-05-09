import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated, Dimensions, ActivityIndicator, Alert
} from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { MapPin, Navigation, Zap, ChevronUp, ChevronDown, X } from 'lucide-react-native'
import { api } from '../../src/api'
import { useStore } from '../../src/store'

const { height: SCREEN_H } = Dimensions.get('window')
const SHEET_COLLAPSED = SCREEN_H * 0.35   // sheet takes bottom 35%
const SHEET_EXPANDED  = SCREEN_H * 0.75   // sheet takes bottom 75%

const VEHICLE_TYPES = [
  { id: 'ECONOMY', label: 'Economy',  emoji: '🚗', desc: 'Affordable everyday rides',  multiplier: 1.0 },
  { id: 'COMFORT', label: 'Comfort',  emoji: '🚙', desc: 'Newer cars, more legroom',    multiplier: 1.4 },
  { id: 'XL',      label: 'XL',       emoji: '🚐', desc: 'Up to 6 passengers',          multiplier: 1.8 },
]

// San Francisco default region
const SF = { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 }

export default function RiderHome() {
  const user        = useStore(s => s.user)
  const setActiveTrip = useStore(s => s.setActiveTrip)

  const [pickup,    setPickup]    = useState('')
  const [dropoff,   setDropoff]   = useState('')
  const [vehicle,   setVehicle]   = useState('ECONOMY')
  const [surge,     setSurge]     = useState(1.0)
  const [fare,      setFare]      = useState<number | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [expanded,  setExpanded]  = useState(false)
  const [matched,   setMatched]   = useState(false)

  const sheetAnim = useRef(new Animated.Value(SHEET_COLLAPSED)).current

  const toggleSheet = () => {
    const toValue = expanded ? SHEET_COLLAPSED : SHEET_EXPANDED
    Animated.spring(sheetAnim, { toValue, useNativeDriver: false, tension: 65, friction: 11 }).start()
    setExpanded(!expanded)
  }

  const handleRequestRide = async () => {
    if (!pickup || !dropoff) { Alert.alert('Enter pickup and dropoff locations'); return }
    setLoading(true)
    try {
      const result: any = await api.requestMatch({
        riderId:    user?.id,
        pickupLat:  37.7749, pickupLng:  -122.4194,
        dropoffLat: 37.7900, dropoffLng: -122.4000,
      })
      setSurge(result.surgeMultiplier ?? 1.0)
      setFare(result.estimatedFare ?? 12.50)
      setActiveTrip(result.tripId)
      setMatched(true)
    } catch {
      // demo fallback
      setSurge(1.2)
      setFare(14.40)
      setMatched(true)
    } finally {
      setLoading(false)
    }
  }

  const selectedType = VEHICLE_TYPES.find(v => v.id === vehicle)!
  const displayFare  = fare ? (fare * selectedType.multiplier).toFixed(2) : null

  return (
    <View style={styles.container}>
      {/* Full-screen map — takes all space behind the sheet */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={SF}
        customMapStyle={darkMapStyle}
      >
        <Marker coordinate={{ latitude: 37.7749, longitude: -122.4194 }}>
          <View style={styles.pickupDot} />
        </Marker>
      </MapView>

      {/* Surge badge — top right */}
      {surge > 1.0 && (
        <View style={styles.surgeBadge}>
          <Zap size={12} color="#f59e0b" />
          <Text style={styles.surgeText}>{surge}x surge</Text>
        </View>
      )}

      {/* Bottom sheet — slides up over the map */}
      <Animated.View style={[styles.sheet, { height: sheetAnim }]}>
        {/* Sheet handle */}
        <TouchableOpacity style={styles.handle} onPress={toggleSheet} activeOpacity={0.7}>
          <View style={styles.handleBar} />
          {expanded
            ? <ChevronDown size={16} color="#475569" />
            : <ChevronUp   size={16} color="#475569" />}
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {!matched ? (
            <>
              {/* Location inputs */}
              <View style={styles.inputGroup}>
                <View style={styles.inputRow}>
                  <View style={[styles.dot, { backgroundColor: '#6366f1' }]} />
                  <TextInput
                    style={styles.locationInput}
                    placeholder="Pickup location"
                    placeholderTextColor="#475569"
                    value={pickup}
                    onChangeText={setPickup}
                    onFocus={() => !expanded && toggleSheet()}
                  />
                  {pickup ? <TouchableOpacity onPress={() => setPickup('')}><X size={16} color="#475569" /></TouchableOpacity> : null}
                </View>
                <View style={styles.divider} />
                <View style={styles.inputRow}>
                  <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                  <TextInput
                    style={styles.locationInput}
                    placeholder="Where to?"
                    placeholderTextColor="#475569"
                    value={dropoff}
                    onChangeText={setDropoff}
                  />
                  {dropoff ? <TouchableOpacity onPress={() => setDropoff('')}><X size={16} color="#475569" /></TouchableOpacity> : null}
                </View>
              </View>

              {/* Vehicle type selector */}
              <Text style={styles.sectionLabel}>Choose ride type</Text>
              <View style={styles.vehicleRow}>
                {VEHICLE_TYPES.map(v => (
                  <TouchableOpacity key={v.id} style={[styles.vehicleCard, vehicle === v.id && styles.vehicleCardActive]}
                    onPress={() => setVehicle(v.id)} activeOpacity={0.8}>
                    <Text style={styles.vehicleEmoji}>{v.emoji}</Text>
                    <Text style={[styles.vehicleLabel, vehicle === v.id && styles.vehicleLabelActive]}>{v.label}</Text>
                    <Text style={styles.vehicleDesc}>{v.desc}</Text>
                    {surge > 1 && (
                      <Text style={styles.vehicleFare}>
                        ~${(12.50 * v.multiplier * surge).toFixed(2)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Request button */}
              <TouchableOpacity style={styles.requestBtn} onPress={handleRequestRide} disabled={loading} activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.requestBtnText}>Request {selectedType.label}</Text>}
              </TouchableOpacity>
            </>
          ) : (
            /* Matched state */
            <View style={styles.matchedContainer}>
              <View style={styles.matchedIcon}>
                <Navigation size={28} color="#6366f1" />
              </View>
              <Text style={styles.matchedTitle}>Driver found!</Text>
              <Text style={styles.matchedSub}>Your driver is on the way</Text>

              <View style={styles.fareCard}>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Estimated fare</Text>
                  <Text style={styles.fareValue}>${displayFare}</Text>
                </View>
                {surge > 1 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Surge multiplier</Text>
                    <Text style={[styles.fareValue, { color: '#f59e0b' }]}>{surge}x</Text>
                  </View>
                )}
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Vehicle type</Text>
                  <Text style={styles.fareValue}>{selectedType.emoji} {selectedType.label}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setMatched(false)} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel Ride</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#0f172a' },
  surgeBadge:         { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(15,23,42,0.9)', borderWidth: 1, borderColor: '#f59e0b44', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  surgeText:          { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
  sheet:              { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: '#1e293b', paddingHorizontal: 20, paddingBottom: 20 },
  handle:             { alignItems: 'center', paddingVertical: 12, gap: 4 },
  handleBar:          { width: 40, height: 4, backgroundColor: '#334155', borderRadius: 2 },
  inputGroup:         { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 20, overflow: 'hidden' },
  inputRow:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  dot:                { width: 10, height: 10, borderRadius: 5 },
  locationInput:      { flex: 1, color: '#f8fafc', fontSize: 15 },
  divider:            { height: 1, backgroundColor: '#334155', marginLeft: 42 },
  sectionLabel:       { color: '#64748b', fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  vehicleRow:         { flexDirection: 'row', gap: 10, marginBottom: 20 },
  vehicleCard:        { flex: 1, backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1.5, borderColor: '#334155', padding: 12, alignItems: 'center', gap: 4 },
  vehicleCardActive:  { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
  vehicleEmoji:       { fontSize: 24 },
  vehicleLabel:       { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  vehicleLabelActive: { color: '#818cf8' },
  vehicleDesc:        { color: '#475569', fontSize: 10, textAlign: 'center' },
  vehicleFare:        { color: '#f8fafc', fontSize: 12, fontWeight: '700', marginTop: 2 },
  requestBtn:         { backgroundColor: '#4f46e5', borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: '#4f46e5', shadowOpacity: 0.4, shadowRadius: 16 },
  requestBtnText:     { color: '#fff', fontWeight: '800', fontSize: 17 },
  matchedContainer:   { alignItems: 'center', paddingTop: 8, gap: 8 },
  matchedIcon:        { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  matchedTitle:       { color: '#f8fafc', fontSize: 22, fontWeight: '800' },
  matchedSub:         { color: '#64748b', fontSize: 14, marginBottom: 16 },
  fareCard:           { width: '100%', backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 16, gap: 12, marginBottom: 16 },
  fareRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fareLabel:          { color: '#64748b', fontSize: 14 },
  fareValue:          { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  cancelBtn:          { width: '100%', borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  cancelBtnText:      { color: '#ef4444', fontWeight: '700', fontSize: 15 },
})

// Dark map style matching the app theme
const darkMapStyle = [
  { elementType: 'geometry',            stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#64748b' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#0f172a' }] },
  { featureType: 'road',                elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road.arterial',       elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road.highway',        elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'water',               elementType: 'geometry', stylers: [{ color: '#0c1a2e' }] },
  { featureType: 'poi',                 stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',             stylers: [{ visibility: 'off' }] },
]

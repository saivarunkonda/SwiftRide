import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Switch, Animated, Dimensions, Alert
} from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { Navigation, DollarSign, Star, Zap } from 'lucide-react-native'
import { useStore } from '../../src/store'

const { height: SCREEN_H } = Dimensions.get('window')
const SF = { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 }

// Simulated incoming trip request
const MOCK_REQUEST = {
  tripId:     'trip-demo-001',
  riderName:  'Rachel R.',
  riderRating: 4.8,
  pickup:     'Union Square',
  dropoff:    'SFO Airport',
  distanceKm: 22.4,
  etaMinutes: 6,
  fare:       42.50,
  surge:      1.5,
}

export default function DriverHome() {
  const user = useStore(s => s.user)
  const [online,  setOnline]  = useState(false)
  const [request, setRequest] = useState<typeof MOCK_REQUEST | null>(null)
  const [earning, setEarning] = useState({ today: 187.40, trips: 8, hours: 5.2 })
  const slideAnim = useRef(new Animated.Value(300)).current

  const toggleOnline = (val: boolean) => {
    setOnline(val)
    if (val) {
      // Simulate incoming request after 2s
      setTimeout(() => {
        setRequest(MOCK_REQUEST)
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start()
      }, 2000)
    } else {
      setRequest(null)
    }
  }

  const acceptTrip = () => {
    Alert.alert('Trip Accepted', `Heading to ${MOCK_REQUEST.pickup}`)
    setRequest(null)
  }

  const declineTrip = () => {
    setRequest(null)
    slideAnim.setValue(300)
  }

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={SF}
        customMapStyle={darkMapStyle}
      >
        <Marker coordinate={{ latitude: 37.7749, longitude: -122.4194 }}>
          <View style={styles.driverDot} />
        </Marker>
      </MapView>

      {/* Online/Offline toggle — top center */}
      <View style={styles.onlineBar}>
        <View style={[styles.onlinePill, online && styles.onlinePillActive]}>
          <View style={[styles.statusDot, { backgroundColor: online ? '#10b981' : '#475569' }]} />
          <Text style={[styles.statusText, online && { color: '#10b981' }]}>
            {online ? 'Online — accepting trips' : 'Offline'}
          </Text>
          <Switch
            value={online}
            onValueChange={toggleOnline}
            trackColor={{ false: '#334155', true: '#064e3b' }}
            thumbColor={online ? '#10b981' : '#475569'}
          />
        </View>
      </View>

      {/* Today's earnings strip */}
      <View style={styles.earningsStrip}>
        <View style={styles.earningItem}>
          <DollarSign size={14} color="#10b981" />
          <Text style={styles.earningValue}>${earning.today.toFixed(2)}</Text>
          <Text style={styles.earningLabel}>Today</Text>
        </View>
        <View style={styles.earningDivider} />
        <View style={styles.earningItem}>
          <Navigation size={14} color="#6366f1" />
          <Text style={styles.earningValue}>{earning.trips}</Text>
          <Text style={styles.earningLabel}>Trips</Text>
        </View>
        <View style={styles.earningDivider} />
        <View style={styles.earningItem}>
          <Star size={14} color="#f59e0b" />
          <Text style={styles.earningValue}>4.92</Text>
          <Text style={styles.earningLabel}>Rating</Text>
        </View>
      </View>

      {/* Incoming trip request — slides up from bottom */}
      {request && (
        <Animated.View style={[styles.requestSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.requestHeader}>
            <View style={styles.riderAvatar}>
              <Text style={styles.riderAvatarText}>{request.riderName[0]}</Text>
            </View>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{request.riderName}</Text>
              <View style={styles.ratingRow}>
                <Star size={12} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.ratingText}>{request.riderRating}</Text>
              </View>
            </View>
            {request.surge > 1 && (
              <View style={styles.surgePill}>
                <Zap size={12} color="#f59e0b" />
                <Text style={styles.surgeText}>{request.surge}x</Text>
              </View>
            )}
          </View>

          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: '#6366f1' }]} />
              <View>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routePlace}>{request.pickup}</Text>
              </View>
              <Text style={styles.etaText}>{request.etaMinutes} min away</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
              <View>
                <Text style={styles.routeLabel}>Dropoff</Text>
                <Text style={styles.routePlace}>{request.dropoff}</Text>
              </View>
              <Text style={styles.distText}>{request.distanceKm} km</Text>
            </View>
          </View>

          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Estimated earnings</Text>
            <Text style={styles.fareValue}>${request.fare.toFixed(2)}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.declineBtn} onPress={declineTrip} activeOpacity={0.8}>
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={acceptTrip} activeOpacity={0.85}>
              <Text style={styles.acceptBtnText}>Accept Trip</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0f172a' },
  driverDot:       { width: 16, height: 16, borderRadius: 8, backgroundColor: '#10b981', borderWidth: 3, borderColor: '#fff', shadowColor: '#10b981', shadowOpacity: 0.8, shadowRadius: 8 },
  onlineBar:       { position: 'absolute', top: 16, left: 0, right: 0, alignItems: 'center' },
  onlinePill:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(15,23,42,0.92)', borderWidth: 1, borderColor: '#334155', borderRadius: 30, paddingHorizontal: 16, paddingVertical: 10 },
  onlinePillActive:{ borderColor: '#064e3b' },
  statusDot:       { width: 8, height: 8, borderRadius: 4 },
  statusText:      { color: '#64748b', fontSize: 13, fontWeight: '600', flex: 1 },
  earningsStrip:   { position: 'absolute', top: 80, left: 16, right: 16, flexDirection: 'row', backgroundColor: 'rgba(15,23,42,0.92)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, padding: 14 },
  earningItem:     { flex: 1, alignItems: 'center', gap: 2 },
  earningValue:    { color: '#f8fafc', fontSize: 16, fontWeight: '800' },
  earningLabel:    { color: '#475569', fontSize: 11 },
  earningDivider:  { width: 1, backgroundColor: '#1e293b' },
  requestSheet:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: '#1e293b', padding: 20, gap: 16 },
  requestHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  riderAvatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  riderAvatarText: { color: '#818cf8', fontSize: 18, fontWeight: '700' },
  riderInfo:       { flex: 1 },
  riderName:       { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText:      { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
  surgePill:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#451a0320', borderWidth: 1, borderColor: '#f59e0b44', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  surgeText:       { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  routeCard:       { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 14, gap: 8 },
  routeRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot:             { width: 10, height: 10, borderRadius: 5 },
  routeLabel:      { color: '#475569', fontSize: 11 },
  routePlace:      { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  routeLine:       { width: 1, height: 14, backgroundColor: '#334155', marginLeft: 4.5 },
  etaText:         { marginLeft: 'auto', color: '#6366f1', fontSize: 12, fontWeight: '700' },
  distText:        { marginLeft: 'auto', color: '#64748b', fontSize: 12 },
  fareRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  fareLabel:       { color: '#64748b', fontSize: 14 },
  fareValue:       { color: '#10b981', fontSize: 22, fontWeight: '800' },
  actionRow:       { flexDirection: 'row', gap: 12 },
  declineBtn:      { flex: 1, borderWidth: 1.5, borderColor: '#334155', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  declineBtnText:  { color: '#64748b', fontWeight: '700', fontSize: 15 },
  acceptBtn:       { flex: 2, backgroundColor: '#10b981', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 12 },
  acceptBtnText:   { color: '#fff', fontWeight: '800', fontSize: 16 },
})

const darkMapStyle = [
  { elementType: 'geometry',           stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#64748b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road',               elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road.highway',       elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'water',              elementType: 'geometry', stylers: [{ color: '#0c1a2e' }] },
  { featureType: 'poi',                stylers: [{ visibility: 'off' }] },
]

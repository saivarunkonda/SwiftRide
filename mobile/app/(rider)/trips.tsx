import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { MapPin, Clock, DollarSign, ChevronRight } from 'lucide-react-native'

const TRIPS = [
  { id: 't1', from: 'Union Square',    to: 'SFO Airport',      fare: 42.50, surge: 1.5, date: 'Today, 2:30 PM',    status: 'completed' },
  { id: 't2', from: 'Mission District',to: 'Fishermans Wharf', fare: 18.20, surge: 1.0, date: 'Yesterday, 9:15 AM', status: 'completed' },
  { id: 't3', from: 'Castro',          to: 'Downtown',         fare: 12.80, surge: 1.0, date: 'May 4, 6:45 PM',    status: 'completed' },
  { id: 't4', from: 'Haight-Ashbury',  to: 'Caltrain Station', fare: 0,     surge: 1.0, date: 'May 3, 8:00 AM',    status: 'cancelled' },
]

export default function RiderTrips() {
  return (
    <View style={styles.container}>
      <FlatList
        data={TRIPS}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.heading}>Trip History</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.75}>
            <View style={styles.cardTop}>
              <View style={styles.routeCol}>
                <View style={styles.routeRow}>
                  <View style={[styles.dot, { backgroundColor: '#6366f1' }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{item.from}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeRow}>
                  <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{item.to}</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#334155" />
            </View>

            <View style={styles.cardBottom}>
              <View style={styles.metaItem}>
                <Clock size={12} color="#475569" />
                <Text style={styles.metaText}>{item.date}</Text>
              </View>
              {item.status === 'completed' ? (
                <View style={styles.metaItem}>
                  <DollarSign size={12} color="#10b981" />
                  <Text style={[styles.metaText, { color: '#10b981', fontWeight: '700' }]}>
                    ${item.fare.toFixed(2)}
                    {item.surge > 1 && <Text style={{ color: '#f59e0b' }}> ({item.surge}x)</Text>}
                  </Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: '#ef444420', borderColor: '#ef444440' }]}>
                  <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '600' }}>Cancelled</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0f172a' },
  list:        { padding: 20, gap: 12 },
  heading:     { color: '#f8fafc', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  card:        { backgroundColor: '#1e293b', borderRadius: 18, borderWidth: 1, borderColor: '#334155', padding: 16, gap: 12 },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeCol:    { flex: 1, gap: 4 },
  routeRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  routeLine:   { width: 1, height: 12, backgroundColor: '#334155', marginLeft: 3.5 },
  routeText:   { color: '#e2e8f0', fontSize: 14, fontWeight: '500', flex: 1 },
  cardBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderColor: '#334155' },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:    { color: '#64748b', fontSize: 12 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
})

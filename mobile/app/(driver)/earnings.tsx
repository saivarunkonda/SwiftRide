import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { DollarSign, TrendingUp, Clock, Star } from 'lucide-react-native'

const WEEKLY = [
  { day: 'Mon', amount: 142.30, trips: 7 },
  { day: 'Tue', amount: 198.50, trips: 9 },
  { day: 'Wed', amount: 87.20,  trips: 4 },
  { day: 'Thu', amount: 221.80, trips: 11 },
  { day: 'Fri', amount: 312.40, trips: 14 },
  { day: 'Sat', amount: 287.60, trips: 13 },
  { day: 'Sun', amount: 187.40, trips: 8 },
]
const MAX = Math.max(...WEEKLY.map(d => d.amount))

export default function DriverEarnings() {
  const total = WEEKLY.reduce((s, d) => s + d.amount, 0)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Earnings</Text>

      {/* Summary cards */}
      <View style={styles.cardRow}>
        {[
          { icon: DollarSign, label: 'This Week',  value: `$${total.toFixed(2)}`, color: '#10b981' },
          { icon: TrendingUp, label: 'Total Trips', value: '66',                  color: '#6366f1' },
          { icon: Clock,      label: 'Hours Online', value: '38.5h',                      color: '#f59e0b' },
          { icon: Star,       label: 'Rating',      value: '4.92',                color: '#f59e0b' },
        ].map(({ icon: Icon, label, value, color }) => (
          <View key={label} style={styles.statCard}>
            <Icon size={18} color={color} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Bar chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Daily Earnings — This Week</Text>
        <View style={styles.bars}>
          {WEEKLY.map(d => (
            <View key={d.day} style={styles.barCol}>
              <Text style={styles.barAmount}>${Math.round(d.amount)}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${(d.amount / MAX) * 100}%` }]} />
              </View>
              <Text style={styles.barDay}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Payout info */}
      <View style={styles.payoutCard}>
        <Text style={styles.payoutTitle}>Next Payout</Text>
        <Text style={styles.payoutAmount}>${total.toFixed(2)}</Text>
        <Text style={styles.payoutDate}>Deposits every Monday · Direct to bank</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0f172a' },
  content:      { padding: 20, gap: 16 },
  heading:      { color: '#f8fafc', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  cardRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:     { flex: 1, minWidth: '45%', backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 14, gap: 4 },
  statValue:    { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  statLabel:    { color: '#475569', fontSize: 12 },
  chartCard:    { backgroundColor: '#1e293b', borderRadius: 18, borderWidth: 1, borderColor: '#334155', padding: 16 },
  chartTitle:   { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 16 },
  bars:         { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 8 },
  barCol:       { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barAmount:    { color: '#64748b', fontSize: 9, fontWeight: '600' },
  barTrack:     { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barFill:      { backgroundColor: '#10b981', borderRadius: 6, width: '100%', minHeight: 4 },
  barDay:       { color: '#64748b', fontSize: 11, fontWeight: '600' },
  payoutCard:   { backgroundColor: '#064e3b', borderRadius: 18, borderWidth: 1, borderColor: '#065f46', padding: 20, alignItems: 'center', gap: 4 },
  payoutTitle:  { color: '#6ee7b7', fontSize: 13, fontWeight: '600' },
  payoutAmount: { color: '#f8fafc', fontSize: 32, fontWeight: '800' },
  payoutDate:   { color: '#34d399', fontSize: 12 },
})

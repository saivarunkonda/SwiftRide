import { Tabs } from 'expo-router'
import { Navigation, Clock, DollarSign, User } from 'lucide-react-native'

// Driver app — different tabs from rider
// Driver needs: Go Online toggle, Trip queue, Earnings, Profile
export default function DriverLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle:           { backgroundColor: '#0f172a' },
      headerTintColor:       '#f8fafc',
      headerTitleStyle:      { fontWeight: '700', fontSize: 18 },
      tabBarStyle:           {
        backgroundColor:     '#0f172a',
        borderTopColor:      '#1e293b',
        borderTopWidth:      1,
        height:              80,
        paddingBottom:       20,
        paddingTop:          10,
      },
      tabBarActiveTintColor:   '#10b981',   // green for driver (different from rider's indigo)
      tabBarInactiveTintColor: '#475569',
      tabBarLabelStyle:        { fontSize: 11, fontWeight: '600', marginTop: 2 },
    }}>
      <Tabs.Screen name="home" options={{
        title: 'Drive',
        tabBarIcon: ({ color, size }) => <Navigation size={size} color={color} />,
        headerTitle: 'RidePlatform Driver',
      }} />
      <Tabs.Screen name="trips" options={{
        title: 'Trips',
        tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
      }} />
      <Tabs.Screen name="earnings" options={{
        title: 'Earnings',
        tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
      }} />
    </Tabs>
  )
}

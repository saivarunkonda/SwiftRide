import { Tabs } from 'expo-router'
import { MapPin, Clock, CreditCard, User } from 'lucide-react-native'
import { View } from 'react-native'

// Rider app — bottom tab bar with 4 tabs
// Completely different from the web sidebar layout
export default function RiderLayout() {
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
      tabBarActiveTintColor:   '#6366f1',
      tabBarInactiveTintColor: '#475569',
      tabBarLabelStyle:        { fontSize: 11, fontWeight: '600', marginTop: 2 },
    }}>
      <Tabs.Screen name="home" options={{
        title: 'Book Ride',
        tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        headerTitle: 'Where to?',
      }} />
      <Tabs.Screen name="trips" options={{
        title: 'My Trips',
        tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
      }} />
      <Tabs.Screen name="payments" options={{
        title: 'Payments',
        tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
      }} />
    </Tabs>
  )
}

import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { router } from 'expo-router'
import { api } from '../src/api'
import { useStore } from '../src/store'

// Demo credentials — same as web dashboard
const DEMO = [
  { label: '🚗  I am a Driver', email: 'driver@ride.com', password: 'driver123', role: 'driver' as const },
  { label: '🧍  I am a Rider',  email: 'rider@ride.com',  password: 'rider123',  role: 'rider'  as const },
]

export default function Login() {
  const setUser = useStore(s => s.setUser)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Please fill in all fields'); return }
    setLoading(true)
    try {
      // In production: POST /v1/auth/login → get JWT
      // For demo: match against known credentials
      const match = DEMO.find(d => d.email === email && d.password === password)
      if (!match) throw new Error('Invalid credentials')

      await api.saveToken('demo-jwt-token')
      setUser({ id: match.email, name: match.label.replace(/^.+ /, ''), email: match.email, role: match.role })
      router.replace(match.role === 'driver' ? '/(driver)/home' : '/(rider)/home')
    } catch (e: any) {
      Alert.alert('Login failed', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>R</Text>
        </View>
        <Text style={styles.title}>RidePlatform</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@ride.com"
          placeholderTextColor="#475569"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#475569"
          secureTextEntry
        />
        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Sign In</Text>}
        </TouchableOpacity>
      </View>

      {/* Quick login */}
      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>Quick demo login</Text>
        {DEMO.map(d => (
          <TouchableOpacity key={d.role} style={styles.demoBtn}
            onPress={() => { setEmail(d.email); setPassword(d.password) }}>
            <Text style={styles.demoBtnText}>{d.label}</Text>
            <Text style={styles.demoBtnSub}>{d.email}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0f172a', padding: 24, justifyContent: 'center' },
  header:       { alignItems: 'center', marginBottom: 40 },
  logoBox:      { width: 64, height: 64, borderRadius: 20, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#4f46e5', shadowOpacity: 0.5, shadowRadius: 20 },
  logoText:     { color: '#fff', fontSize: 28, fontWeight: '800' },
  title:        { color: '#f8fafc', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle:     { color: '#64748b', fontSize: 14, marginTop: 4 },
  form:         { gap: 8, marginBottom: 32 },
  label:        { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 8 },
  input:        { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: '#f8fafc', fontSize: 15 },
  btn:          { backgroundColor: '#4f46e5', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#4f46e5', shadowOpacity: 0.4, shadowRadius: 12 },
  btnText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
  demoSection:  { gap: 10 },
  demoTitle:    { color: '#475569', fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  demoBtn:      { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14, padding: 14 },
  demoBtnText:  { color: '#e2e8f0', fontWeight: '600', fontSize: 14 },
  demoBtnSub:   { color: '#475569', fontSize: 12, marginTop: 2 },
})

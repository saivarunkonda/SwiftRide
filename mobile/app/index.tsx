/**
 * Root — redirects to login or the correct home screen based on role
 */
import { Redirect } from 'expo-router'
import { useStore } from '../src/store'

export default function Root() {
  const user = useStore(s => s.user)
  if (!user) return <Redirect href="/login" />
  if (user.role === 'driver') return <Redirect href="/(driver)/home" />
  return <Redirect href="/(rider)/home" />
}

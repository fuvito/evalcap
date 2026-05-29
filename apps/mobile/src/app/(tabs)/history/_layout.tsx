import { Stack } from 'expo-router'
import { Colors } from '@/constants/colors'

export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background.light },
        headerTintColor: Colors.brand,
        headerTitleStyle: { fontWeight: '600', color: Colors.text.primary.light },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'History' }} />
      <Stack.Screen name="[id]" options={{ title: 'Entry' }} />
    </Stack>
  )
}

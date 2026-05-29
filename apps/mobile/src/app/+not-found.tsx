import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/constants/colors'

export default function NotFoundScreen() {
  const router = useRouter()
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.message}>This screen doesn't exist.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.btnText}>Go home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.light },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  code: { fontSize: 64, fontWeight: '700', color: Colors.brand, marginBottom: 8 },
  message: { fontSize: 16, color: Colors.text.secondary.light, marginBottom: 32 },
  btn: {
    backgroundColor: Colors.brand, borderRadius: 10,
    paddingHorizontal: 32, paddingVertical: 12, minHeight: 44,
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
})

import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import type { BiometricType } from '@/hooks/useBiometricLock'

interface Props {
  biometricType: BiometricType
  onUnlock: () => Promise<boolean>
}

export function LockScreen({ biometricType, onUnlock }: Props) {
  const label = biometricType === 'faceid' ? 'Unlock with Face ID' : 'Unlock with Touch ID'

  function handleSignOut() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) supabase.auth.signOut()
      return
    }
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ])
  }

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.inner}>
        <View style={styles.content}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>E</Text>
          </View>
          <Text style={styles.appName}>EvalCap</Text>
          <Text style={styles.subtitle}>Your session is locked</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.unlockBtn} onPress={onUnlock} activeOpacity={0.8}>
            <Text style={styles.unlockBtnText}>{label}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutLink} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign out instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.brandDark,
    zIndex: 999,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoLetter: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
  },
  actions: {
    gap: 14,
    alignItems: 'center',
  },
  unlockBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
  },
  unlockBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brandDark,
  },
  signOutLink: {
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
  },
})

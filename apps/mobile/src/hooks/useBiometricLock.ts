import { useState, useEffect, useRef, useCallback } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import { supabase } from '@/lib/supabase'

const LOCK_AFTER_MS = 5 * 60 * 1000

export type BiometricType = 'faceid' | 'fingerprint' | 'none'

export function useBiometricLock() {
  const [locked, setLocked] = useState(false)
  const [biometricType, setBiometricType] = useState<BiometricType>('none')
  const appState = useRef(AppState.currentState)
  const backgroundedAt = useRef<number | null>(null)

  useEffect(() => {
    async function detectBiometrics() {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      if (!hasHardware) return
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      if (!isEnrolled) return
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('faceid')
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint')
      }
    }
    detectBiometrics()
  }, [])

  useEffect(() => {
    if (biometricType === 'none') return

    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      const prev = appState.current
      appState.current = next

      if (prev === 'active' && next !== 'active') {
        backgroundedAt.current = Date.now()
      } else if (next === 'active' && prev !== 'active') {
        const elapsed = backgroundedAt.current ? Date.now() - backgroundedAt.current : Infinity
        if (elapsed >= LOCK_AFTER_MS) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) setLocked(true)
        }
      }
    })

    return () => sub.remove()
  }, [biometricType])

  const unlock = useCallback(async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock EvalCap',
      fallbackLabel: biometricType === 'faceid' ? 'Use passcode' : 'Use PIN',
      disableDeviceFallback: false,
    })
    if (result.success) setLocked(false)
    return result.success
  }, [biometricType])

  return { locked, biometricType, unlock }
}

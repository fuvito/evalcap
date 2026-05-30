import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import type { Database } from '@/types/database'

// SecureStore has a 2048-byte limit per key. Supabase JWTs exceed this, so we
// split large values across numbered chunk keys and reassemble on read.
const CHUNK_SIZE = 1900

const ChunkedSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const countStr = await SecureStore.getItemAsync(`${key}_n`)
    if (!countStr) return SecureStore.getItemAsync(key)
    const n = parseInt(countStr, 10)
    const parts: string[] = []
    for (let i = 0; i < n; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_${i}`)
      if (chunk === null) return null
      parts.push(chunk)
    }
    return parts.join('')
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await this.removeItem(key)
      return SecureStore.setItemAsync(key, value)
    }
    // Remove any plain key that might exist from a previous short value
    await SecureStore.deleteItemAsync(key)
    const chunks: string[] = []
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE))
    }
    await SecureStore.setItemAsync(`${key}_n`, String(chunks.length))
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${key}_${i}`, c)))
  },

  async removeItem(key: string): Promise<void> {
    const countStr = await SecureStore.getItemAsync(`${key}_n`)
    if (countStr) {
      const n = parseInt(countStr, 10)
      await Promise.all([
        SecureStore.deleteItemAsync(`${key}_n`),
        ...Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}_${i}`)),
      ])
    }
    await SecureStore.deleteItemAsync(key)
  },
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Create apps/mobile/.env.local with:\n' +
    '  EXPO_PUBLIC_SUPABASE_URL=...\n' +
    '  EXPO_PUBLIC_SUPABASE_ANON_KEY=...'
  )
}

const webStorage = {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) => { localStorage.setItem(key, value); return Promise.resolve() },
  removeItem: (key: string) => { localStorage.removeItem(key); return Promise.resolve() },
}

export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : ChunkedSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

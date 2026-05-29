import { useCallback, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth'
import { Colors } from '@/constants/colors'
import type { Profile } from '@/types/database'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useFocusEffect(
    useCallback(() => {
      loadProfile()
    }, [user])
  )

  async function loadProfile() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) {
      setProfile(data)
      setFullName(data.full_name ?? '')
      setJobTitle(data.job_title ?? '')
    }
    setLoading(false)
    setDirty(false)
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null, job_title: jobTitle.trim() || null })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      Alert.alert('Save failed', error.message)
    } else {
      setDirty(false)
      Alert.alert('Saved', 'Profile updated.')
    }
  }

  function confirmSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ])
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={Colors.brand} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(fullName || user?.email || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.emailLabel}>{user?.email}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal info</Text>

          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={v => { setFullName(v); setDirty(true) }}
            placeholder="Your name"
            placeholderTextColor={Colors.text.secondary.light}
            autoComplete="name"
          />

          <Text style={styles.label}>Job title</Text>
          <TextInput
            style={styles.input}
            value={jobTitle}
            onChangeText={v => { setJobTitle(v); setDirty(true) }}
            placeholder="e.g. Senior Software Engineer"
            placeholderTextColor={Colors.text.secondary.light}
          />

          {dirty && (
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Save changes</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <Text style={styles.metaRow}>
              Member since {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.signOutBtn} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.light },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.light },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text.primary.light, marginBottom: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.brand, justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 8,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  emailLabel: { textAlign: 'center', color: Colors.text.secondary.light, fontSize: 14, marginBottom: 24 },
  section: {
    backgroundColor: Colors.surface.light, borderRadius: 12,
    padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border.light,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary.light, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text.primary.light, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: Colors.border.light, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.text.primary.light, backgroundColor: Colors.background.light,
    minHeight: 48, marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: Colors.brand, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 4, minHeight: 44,
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  metaRow: { fontSize: 14, color: Colors.text.secondary.light },
  signOutBtn: {
    borderWidth: 1, borderColor: Colors.error, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 8, minHeight: 48,
    justifyContent: 'center',
  },
  signOutText: { color: Colors.error, fontWeight: '600', fontSize: 15 },
})

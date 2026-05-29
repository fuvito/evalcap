import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import type { JournalEntry } from '@/types/database'

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadEntry()
  }, [id])

  async function loadEntry() {
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .single()
    setEntry(data)
    setLoading(false)
  }

  function confirmDelete() {
    Alert.alert(
      'Delete entry',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ]
    )
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('journal_entries').delete().eq('id', id)
    setDeleting(false)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      router.back()
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={Colors.brand} />
      </SafeAreaView>
    )
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.missing}>Entry not found.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.meta}>
          <View style={[styles.badge, entry.check_in_type === 'daily' ? styles.badgeDaily : styles.badgeWeekly]}>
            <Text style={styles.badgeText}>{entry.check_in_type}</Text>
          </View>
          <Text style={styles.date}>
            {new Date(entry.created_at).toLocaleDateString(undefined, {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </Text>
        </View>

        {entry.prompt_used && (
          <View style={styles.promptBox}>
            <Text style={styles.promptLabel}>Prompt used</Text>
            <Text style={styles.promptText}>{entry.prompt_used}</Text>
          </View>
        )}

        <Text style={styles.content}>{entry.content}</Text>

        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.btnDisabled]}
          onPress={confirmDelete}
          disabled={deleting}
        >
          {deleting
            ? <ActivityIndicator color={Colors.error} size="small" />
            : <Text style={styles.deleteBtnText}>Delete entry</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.light },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.light },
  missing: { color: Colors.text.secondary.light },
  scroll: { padding: 20, paddingBottom: 40 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeDaily: { backgroundColor: '#dbeafe' },
  badgeWeekly: { backgroundColor: '#ede9fe' },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize', color: Colors.text.primary.light },
  date: { fontSize: 13, color: Colors.text.secondary.light },
  promptBox: {
    backgroundColor: '#ede9fe', borderRadius: 8, padding: 12, marginBottom: 16,
  },
  promptLabel: { fontSize: 11, fontWeight: '600', color: Colors.brandDark, marginBottom: 4 },
  promptText: { fontSize: 13, color: Colors.brandDark, lineHeight: 18 },
  content: { fontSize: 16, color: Colors.text.primary.light, lineHeight: 26, marginBottom: 32 },
  deleteBtn: {
    borderWidth: 1, borderColor: Colors.error, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', minHeight: 48, justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  deleteBtnText: { color: Colors.error, fontWeight: '600', fontSize: 15 },
})

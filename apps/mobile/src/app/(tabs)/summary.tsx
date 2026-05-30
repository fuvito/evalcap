import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import { fetchSummary } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'

type SavedSummary = {
  id: string
  content: string
  timeframe_start: string
  timeframe_end: string
  created_at: string
}

export default function SummaryScreen() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [instructions, setInstructions] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [savedSummaries, setSavedSummaries] = useState<SavedSummary[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadSummaries = useCallback(async () => {
    const { data } = await supabase
      .from('summaries')
      .select('id, content, timeframe_start, timeframe_end, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    setSavedSummaries(data ?? [])
    setLoadingList(false)
  }, [])

  useEffect(() => { loadSummaries() }, [loadSummaries])

  async function handleGenerate() {
    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert('Missing dates', 'Enter a start and end date (YYYY-MM-DD).')
      return
    }
    setLoading(true)
    setSummary('')
    setSavedId(null)
    try {
      const res = await fetchSummary({
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        instructions: instructions.trim() || undefined,
      })
      setSummary(res.summary)
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('summaries')
        .insert({
          user_id: user.id,
          content: summary,
          timeframe_start: startDate.trim(),
          timeframe_end: endDate.trim(),
          user_instructions: instructions.trim() || null,
        })
        .select('id')
        .single()
      if (error) throw error
      setSavedId(data.id)
      await loadSummaries()
    } catch {
      Alert.alert('Error', 'Failed to save summary')
    } finally {
      setSaving(false)
    }
  }

  async function handleCopy(text: string) {
    await Clipboard.setStringAsync(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete summary', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('summaries').delete().eq('id', id)
          if (!error) {
            setSavedSummaries(prev => prev.filter(s => s.id !== id))
            if (expandedId === id) setExpandedId(null)
          }
        },
      },
    ])
  }

  function prefillLastMonth() {
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    const start = new Date(end.getFullYear(), end.getMonth(), 1)
    setStartDate(toISO(start))
    setEndDate(toISO(end))
  }

  function prefillThisMonth() {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    setStartDate(toISO(start))
    setEndDate(toISO(now))
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Summary</Text>
        <Text style={styles.subtitle}>AI-powered performance summary from your journal entries</Text>

        <View style={styles.quickDates}>
          <TouchableOpacity style={styles.quickBtn} onPress={prefillThisMonth}>
            <Text style={styles.quickBtnText}>This month</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={prefillLastMonth}>
            <Text style={styles.quickBtnText}>Last month</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Start date</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.text.secondary.light}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>End date</Text>
        <TextInput
          style={styles.input}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.text.secondary.light}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Focus area (optional)</Text>
        <TextInput
          style={styles.input}
          value={instructions}
          onChangeText={setInstructions}
          placeholder="e.g. Emphasize leadership and cross-team collaboration"
          placeholderTextColor={Colors.text.secondary.light}
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.btnDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.generateBtnText}>Generate summary</Text>
          }
        </TouchableOpacity>

        {summary ? (
          <View style={styles.resultBox}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Generated summary</Text>
              <View style={styles.resultActions}>
                <TouchableOpacity onPress={() => handleCopy(summary)} style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
                </TouchableOpacity>
                {!savedId ? (
                  <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.actionBtn, styles.saveBtn]}
                    disabled={saving}
                  >
                    {saving
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.saveBtnText}>Save</Text>
                    }
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.savedBadge}>Saved</Text>
                )}
              </View>
            </View>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Past summaries</Text>

        {loadingList ? (
          <ActivityIndicator color={Colors.brand} style={{ marginTop: 16 }} />
        ) : savedSummaries.length === 0 ? (
          <Text style={styles.emptyText}>No saved summaries yet</Text>
        ) : savedSummaries.map(item => {
          const expanded = expandedId === item.id
          return (
            <View key={item.id} style={styles.savedItem}>
              <View style={styles.savedItemHeader}>
                <TouchableOpacity
                  style={styles.savedItemMeta}
                  onPress={() => setExpandedId(expanded ? null : item.id)}
                >
                  <Text style={styles.savedDateRange}>
                    {formatDate(item.timeframe_start)} – {formatDate(item.timeframe_end)}
                  </Text>
                  <Text style={styles.savedCreatedAt}>Saved {formatDate(item.created_at)}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.savedContent} numberOfLines={expanded ? undefined : 3}>
                {item.content}
              </Text>

              <View style={styles.savedItemFooter}>
                {expanded ? (
                  <>
                    <TouchableOpacity onPress={() => handleCopy(item.content)}>
                      <Text style={styles.footerLink}>Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setExpandedId(null)}>
                      <Text style={styles.footerLink}>Show less</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity onPress={() => setExpandedId(item.id)}>
                    <Text style={styles.footerLink}>Show more</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.light },
  scroll: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text.primary.light, marginBottom: 4 },
  subtitle: { fontSize: 13, color: Colors.text.secondary.light, marginBottom: 20, lineHeight: 18 },
  quickDates: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border.light,
  },
  quickBtnText: { fontSize: 13, color: Colors.text.secondary.light },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text.primary.light, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: Colors.border.light, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.text.primary.light, backgroundColor: Colors.surface.light,
    minHeight: 48, marginBottom: 12,
  },
  generateBtn: {
    backgroundColor: Colors.brand, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
    minHeight: 48, justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  generateBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  resultBox: {
    marginTop: 24, backgroundColor: Colors.surface.light,
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border.light,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultTitle: { fontSize: 15, fontWeight: '600', color: Colors.text.primary.light },
  resultActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: {
    backgroundColor: Colors.surface.light, borderWidth: 1, borderColor: Colors.border.light,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    minHeight: 32, justifyContent: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '500', color: Colors.text.primary.light },
  saveBtn: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  savedBadge: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  summaryText: { fontSize: 14, color: Colors.text.primary.light, lineHeight: 22 },
  sectionTitle: {
    fontSize: 17, fontWeight: '600', color: Colors.text.primary.light,
    marginTop: 32, marginBottom: 12,
  },
  emptyText: { fontSize: 14, color: Colors.text.secondary.light, textAlign: 'center', marginTop: 8 },
  savedItem: {
    backgroundColor: Colors.surface.light, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border.light,
    padding: 14, marginBottom: 12,
  },
  savedItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  savedItemMeta: { flex: 1, marginRight: 8 },
  savedDateRange: { fontSize: 14, fontWeight: '600', color: Colors.text.primary.light },
  savedCreatedAt: { fontSize: 12, color: Colors.text.secondary.light, marginTop: 2 },
  deleteText: { fontSize: 13, color: Colors.error, fontWeight: '500' },
  savedContent: { fontSize: 14, color: Colors.text.primary.light, lineHeight: 21 },
  savedItemFooter: { flexDirection: 'row', gap: 16, marginTop: 10 },
  footerLink: { fontSize: 13, color: Colors.brand, fontWeight: '500' },
})

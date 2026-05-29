import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import { fetchSummary } from '@/lib/api'
import { Colors } from '@/constants/colors'

export default function SummaryScreen() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [instructions, setInstructions] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert('Missing dates', 'Enter a start and end date (YYYY-MM-DD).')
      return
    }
    setLoading(true)
    setSummary('')
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

  async function handleCopy() {
    await Clipboard.setStringAsync(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        <Text style={styles.title}>Generate Summary</Text>
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
              <Text style={styles.resultTitle}>Your summary</Text>
              <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.light },
  scroll: { padding: 20, paddingBottom: 40 },
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
  copyBtn: {
    backgroundColor: Colors.brand, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 8, minHeight: 32, justifyContent: 'center',
  },
  copyBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  summaryText: { fontSize: 14, color: Colors.text.primary.light, lineHeight: 22 },
})

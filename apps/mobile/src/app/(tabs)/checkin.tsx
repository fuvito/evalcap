import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { fetchPrompts } from '@/lib/api'
import { useAuth } from '@/contexts/auth'
import { Colors } from '@/constants/colors'

type CheckInType = 'daily' | 'weekly'

export default function CheckInScreen() {
  const { user } = useAuth()
  const [checkInType, setCheckInType] = useState<CheckInType>('daily')
  const [content, setContent] = useState('')
  const [prompts, setPrompts] = useState<string[]>([])
  const [loadingPrompts, setLoadingPrompts] = useState(false)
  const [saving, setSaving] = useState(false)
  const [promptUsed, setPromptUsed] = useState<string | null>(null)

  async function handleGetPrompts() {
    setLoadingPrompts(true)
    try {
      const res = await fetchPrompts({ checkInType })
      setPrompts(res.prompts)
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load prompts')
    } finally {
      setLoadingPrompts(false)
    }
  }

  function selectPrompt(prompt: string) {
    setPromptUsed(prompt)
    setContent(prev => prev ? `${prev}\n\n${prompt}\n` : `${prompt}\n`)
    setPrompts([])
  }

  async function handleSubmit() {
    if (!content.trim()) {
      Alert.alert('Empty entry', 'Write something before saving.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('journal_entries').insert({
      user_id: user!.id,
      content: content.trim(),
      check_in_type: checkInType,
      prompt_used: promptUsed,
    })
    setSaving(false)
    if (error) {
      Alert.alert('Save failed', error.message)
    } else {
      setContent('')
      setPromptUsed(null)
      Alert.alert('Saved', 'Check-in recorded.')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Check-in</Text>

          <View style={styles.toggle}>
            {(['daily', 'weekly'] as CheckInType[]).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.toggleBtn, checkInType === type && styles.toggleBtnActive]}
                onPress={() => { setCheckInType(type); setPrompts([]) }}
              >
                <Text style={[styles.toggleText, checkInType === type && styles.toggleTextActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.promptsBtn, loadingPrompts && styles.btnDisabled]}
            onPress={handleGetPrompts}
            disabled={loadingPrompts}
          >
            {loadingPrompts
              ? <ActivityIndicator color={Colors.brand} size="small" />
              : <Text style={styles.promptsBtnText}>Get AI prompts</Text>
            }
          </TouchableOpacity>

          {prompts.length > 0 && (
            <View style={styles.promptsList}>
              <Text style={styles.promptsLabel}>Pick a prompt to get started:</Text>
              {prompts.map((p, i) => (
                <TouchableOpacity key={i} style={styles.promptItem} onPress={() => selectPrompt(p)}>
                  <Text style={styles.promptText}>{p}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setPrompts([])}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          {promptUsed && (
            <View style={styles.promptUsedBadge}>
              <Text style={styles.promptUsedText} numberOfLines={2}>Prompt: {promptUsed}</Text>
            </View>
          )}

          <TextInput
            style={styles.textarea}
            value={content}
            onChangeText={setContent}
            placeholder={`What did you accomplish today? What challenged you?`}
            placeholderTextColor={Colors.text.secondary.light}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, (saving || !content.trim()) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={saving || !content.trim()}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.submitBtnText}>Save check-in</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.light },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text.primary.light, marginBottom: 16 },
  toggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border.light,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  toggleText: { fontSize: 14, fontWeight: '500', color: Colors.text.secondary.light },
  toggleTextActive: { color: '#fff' },
  promptsBtn: {
    borderWidth: 1, borderColor: Colors.brand, borderRadius: 8,
    paddingVertical: 10, alignItems: 'center', marginBottom: 16, minHeight: 44,
    justifyContent: 'center',
  },
  promptsBtnText: { color: Colors.brand, fontWeight: '600', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  promptsList: {
    backgroundColor: Colors.surface.light, borderRadius: 10,
    padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border.light,
  },
  promptsLabel: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary.light, marginBottom: 8 },
  promptItem: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  promptText: { fontSize: 14, color: Colors.text.primary.light, lineHeight: 20 },
  dismissText: { marginTop: 10, color: Colors.text.secondary.light, fontSize: 13, textAlign: 'right' },
  promptUsedBadge: {
    backgroundColor: '#ede9fe', borderRadius: 8, padding: 10, marginBottom: 12,
  },
  promptUsedText: { fontSize: 12, color: Colors.brandDark },
  textarea: {
    borderWidth: 1, borderColor: Colors.border.light, borderRadius: 10,
    padding: 14, fontSize: 15, color: Colors.text.primary.light,
    backgroundColor: Colors.surface.light, minHeight: 180, marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: Colors.brand, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', minHeight: 48, justifyContent: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
})

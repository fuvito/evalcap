import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { calculateStreak } from '@/lib/streak'
import { useAuth } from '@/contexts/auth'
import { Colors } from '@/constants/colors'
import type { JournalEntry } from '@/types/database'

interface DashboardStats {
  entryCount: number
  summaryCount: number
  streak: number
  checkedInThisWeek: boolean
  recentEntries: Pick<JournalEntry, 'id' | 'content' | 'check_in_type' | 'created_at'>[]
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadDashboard()
  }, [user])

  async function loadDashboard() {
    setLoading(true)
    const [recentRes, entryCountRes, summaryCountRes, allDatesRes] = await Promise.all([
      supabase.from('journal_entries').select('id, content, check_in_type, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('journal_entries').select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id),
      supabase.from('summaries').select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id),
      supabase.from('journal_entries').select('created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(200),
    ])

    const recentEntries = recentRes.data ?? []
    const allDates = (allDatesRes.data ?? []).map(e => e.created_at)
    const { streak, checkedInThisWeek } = calculateStreak(allDates)

    setStats({
      entryCount: entryCountRes.count ?? 0,
      summaryCount: summaryCountRes.count ?? 0,
      streak,
      checkedInThisWeek,
      recentEntries,
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={Colors.brand} size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Good {greeting()},</Text>
        <Text style={styles.name}>{user?.email?.split('@')[0]}</Text>

        {!stats?.checkedInThisWeek && (
          <TouchableOpacity
            style={styles.nudge}
            onPress={() => router.push('/(tabs)/checkin')}
          >
            <Text style={styles.nudgeText}>
              No check-in this week yet — tap to reflect
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <StatCard label="Entries" value={stats?.entryCount ?? 0} />
          <StatCard label="Summaries" value={stats?.summaryCount ?? 0} />
          <StatCard label="Streak" value={stats?.streak ?? 0} suffix="wk" />
        </View>

        <Text style={styles.sectionTitle}>Recent check-ins</Text>
        {stats?.recentEntries.length === 0 ? (
          <Text style={styles.empty}>No entries yet. Start your first check-in!</Text>
        ) : (
          stats?.recentEntries.map(entry => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={[styles.badge, entry.check_in_type === 'daily' ? styles.badgeDaily : styles.badgeWeekly]}>
                  <Text style={styles.badgeText}>{entry.check_in_type}</Text>
                </View>
                <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
              </View>
              <Text style={styles.entryContent} numberOfLines={3}>{entry.content}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}{suffix ? <Text style={styles.statSuffix}> {suffix}</Text> : null}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.light },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.light },
  scroll: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 15, color: Colors.text.secondary.light },
  name: { fontSize: 24, fontWeight: '700', color: Colors.text.primary.light, marginBottom: 16 },
  nudge: {
    backgroundColor: '#f3e8ff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand,
  },
  nudgeText: { color: Colors.brandDark, fontSize: 14, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface.light,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statValue: { fontSize: 26, fontWeight: '700', color: Colors.brand },
  statSuffix: { fontSize: 14, color: Colors.text.secondary.light, fontWeight: '400' },
  statLabel: { fontSize: 12, color: Colors.text.secondary.light, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary.light, marginBottom: 12 },
  empty: { color: Colors.text.secondary.light, fontSize: 14, textAlign: 'center', marginTop: 20 },
  entryCard: {
    backgroundColor: Colors.surface.light,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeDaily: { backgroundColor: '#dbeafe' },
  badgeWeekly: { backgroundColor: '#ede9fe' },
  badgeText: { fontSize: 11, fontWeight: '600', color: Colors.text.primary.light, textTransform: 'capitalize' },
  entryDate: { fontSize: 12, color: Colors.text.secondary.light },
  entryContent: { fontSize: 14, color: Colors.text.primary.light, lineHeight: 20 },
})

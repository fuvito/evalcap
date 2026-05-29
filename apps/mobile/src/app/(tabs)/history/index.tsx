import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth'
import { Colors } from '@/constants/colors'
import type { JournalEntry } from '@/types/database'

const PAGE_SIZE = 20

export default function HistoryIndexScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useFocusEffect(
    useCallback(() => {
      loadEntries(0, search)
    }, [user])
  )

  async function loadEntries(pageNum: number, query: string) {
    if (!user) return
    setLoading(true)
    let req = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    if (query.trim()) {
      req = req.ilike('content', `%${query.trim()}%`)
    }

    const { data, error } = await req
    setLoading(false)
    if (error || !data) return
    setEntries(pageNum === 0 ? data : prev => [...prev, ...data])
    setHasMore(data.length === PAGE_SIZE)
    setPage(pageNum)
  }

  function handleSearch(text: string) {
    setSearch(text)
    loadEntries(0, text)
  }

  function loadMore() {
    if (!hasMore || loading) return
    loadEntries(page + 1, search)
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Search entries..."
          placeholderTextColor={Colors.text.secondary.light}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {loading && entries.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.brand} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>
            {search ? 'No entries match your search.' : 'No entries yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={e => e.id}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            hasMore && loading ? <ActivityIndicator color={Colors.brand} style={{ marginVertical: 12 }} /> : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/(tabs)/history/[id]', params: { id: item.id } })}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.badge, item.check_in_type === 'daily' ? styles.badgeDaily : styles.badgeWeekly]}>
                  <Text style={styles.badgeText}>{item.check_in_type}</Text>
                </View>
                <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
              </View>
              <Text style={styles.cardContent} numberOfLines={3}>{item.content}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.light },
  searchRow: { padding: 12, paddingBottom: 4 },
  searchInput: {
    backgroundColor: Colors.surface.light,
    borderWidth: 1, borderColor: Colors.border.light,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: Colors.text.primary.light, minHeight: 44,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: Colors.text.secondary.light, fontSize: 14 },
  list: { padding: 12, paddingTop: 8 },
  card: {
    backgroundColor: Colors.surface.light,
    borderRadius: 10, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border.light,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeDaily: { backgroundColor: '#dbeafe' },
  badgeWeekly: { backgroundColor: '#ede9fe' },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize', color: Colors.text.primary.light },
  cardDate: { fontSize: 12, color: Colors.text.secondary.light },
  cardContent: { fontSize: 14, color: Colors.text.primary.light, lineHeight: 20 },
})

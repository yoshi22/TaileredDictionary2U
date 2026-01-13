import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui'
import { colors } from '@/theme/colors'

interface ReviewSession {
  date: string
  total: number
  again: number
  hard: number
  good: number
  easy: number
}

export default function ReviewHistoryScreen() {
  const [sessions, setSessions] = useState<ReviewSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get review data from srs_data where last_reviewed_at is set
      // Group by date
      const { data, error } = await supabase
        .from('srs_data')
        .select('last_reviewed_at')
        .not('last_reviewed_at', 'is', null)
        .order('last_reviewed_at', { ascending: false })

      if (error) throw error

      // Group by date
      const sessionMap = new Map<string, ReviewSession>()

      for (const item of data || []) {
        if (!item.last_reviewed_at) continue

        const date = new Date(item.last_reviewed_at).toISOString().split('T')[0]

        if (!sessionMap.has(date)) {
          sessionMap.set(date, {
            date,
            total: 0,
            again: 0,
            hard: 0,
            good: 0,
            easy: 0,
          })
        }

        const session = sessionMap.get(date)!
        session.total += 1
        // Note: We don't have rating data in srs_data, so we estimate based on interval
        // This is a simplification - in a real app, you'd store review logs
      }

      setSessions(Array.from(sessionMap.values()))
    } catch (error) {
      console.error('Failed to fetch review history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today'
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    }
  }

  const renderItem = ({ item }: { item: ReviewSession }) => (
    <Card style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
        <Text style={styles.sessionTotal}>{item.total} reviews</Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressSegment,
            { flex: 1, backgroundColor: colors.primary[500] },
          ]}
        />
      </View>
    </Card>
  )

  const renderEmpty = () => {
    if (isLoading) return null

    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No review history</Text>
        <Text style={styles.emptyText}>
          Complete some reviews to see your history
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Review History',
          headerBackTitle: 'Back',
        }}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.date}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            sessions.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchHistory}
              tintColor={colors.primary[500]}
            />
          }
          ListHeaderComponent={
            sessions.length > 0 ? (
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Review Sessions</Text>
                <Text style={styles.headerSubtitle}>
                  {sessions.length} {sessions.length === 1 ? 'day' : 'days'} of reviews
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  listContent: {
    paddingBottom: 24,
  },
  sessionCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sessionTotal: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[200],
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressSegment: {
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
})

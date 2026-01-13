import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { Card, Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useStats } from '@/hooks/useStats'
import { colors } from '@/theme/colors'

export default function DashboardScreen() {
  const { user } = useAuth()
  const { stats, isLoading, refresh } = useStats()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.email?.split('@')[0] || 'there'}!
          </Text>
          <Text style={styles.subGreeting}>Ready to learn today?</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Due Today"
            value={stats?.due_entries ?? 0}
            color={colors.primary[500]}
          />
          <StatCard
            label="Total Entries"
            value={stats?.total_entries ?? 0}
            color={colors.success.DEFAULT}
          />
          <StatCard
            label="Decks"
            value={stats?.total_decks ?? 0}
            color={colors.warning.DEFAULT}
          />
          <StatCard
            label="Reviews Today"
            value={stats?.reviews_today ?? 0}
            color={colors.primary[400]}
          />
        </View>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actions}>
            <Link href="/(auth)/(tabs)/review" asChild>
              <Button
                title={`Start Review (${stats?.due_entries ?? 0} due)`}
                size="lg"
                disabled={!stats?.due_entries}
              />
            </Link>
          </View>
        </Card>

        {/* Plan Info */}
        <Card style={styles.planCard}>
          <Text style={styles.sectionTitle}>Your Plan</Text>
          <View style={styles.planInfo}>
            <Text style={styles.planType}>
              {stats?.plan.type === 'plus' ? 'Plus' : 'Free'} Plan
            </Text>
            <Text style={styles.planUsage}>
              AI Generations: {stats?.plan.generation_used ?? 0} /{' '}
              {stats?.plan.generation_limit ?? 20}
            </Text>
            {stats?.plan.type === 'plus' && (
              <Text style={styles.planCredits}>
                Credits: {stats?.plan.credit_balance ?? 0}
              </Text>
            )}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subGreeting: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    padding: 20,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  actionsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  actions: {
    gap: 12,
  },
  planCard: {
    marginBottom: 16,
  },
  planInfo: {
    gap: 8,
  },
  planType: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary[500],
  },
  planUsage: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  planCredits: {
    fontSize: 14,
    color: colors.text.secondary,
  },
})

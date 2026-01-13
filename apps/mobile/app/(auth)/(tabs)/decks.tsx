import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useDecks } from '@/hooks/useDecks'
import { Card } from '@/components/ui'
import { colors } from '@/theme/colors'
import type { Deck } from '@td2u/shared-types'

export default function DecksScreen() {
  const { decks, isLoading, refresh } = useDecks()

  const handleDeckPress = (deck: Deck) => {
    router.push(`/deck/${deck.id}`)
  }

  const handleCreatePress = () => {
    router.push('/deck/new')
  }

  const renderItem = ({ item }: { item: Deck }) => (
    <TouchableOpacity
      style={styles.deckCard}
      onPress={() => handleDeckPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.deckContent}>
        <Text style={styles.deckName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.deckDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.deckFooter}>
          <Text style={styles.entryCount}>
            {item.entry_count} {item.entry_count === 1 ? 'entry' : 'entries'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderEmpty = () => {
    if (isLoading) return null

    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📁</Text>
        <Text style={styles.emptyTitle}>No decks yet</Text>
        <Text style={styles.emptyText}>
          Create a deck to organize your entries
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={decks.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && decks.length === 0}
            onRefresh={refresh}
            tintColor={colors.primary[500]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Decks</Text>
            <Text style={styles.headerSubtitle}>
              {decks.length} {decks.length === 1 ? 'deck' : 'decks'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreatePress}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
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
    paddingBottom: 80,
  },
  deckCard: {
    backgroundColor: colors.background.light,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deckContent: {
    padding: 16,
  },
  deckName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  deckDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  deckFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryCount: {
    fontSize: 12,
    color: colors.text.muted,
  },
  emptyContainer: {
    flex: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.background.light,
    lineHeight: 30,
  },
})

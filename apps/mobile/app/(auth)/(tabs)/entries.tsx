import { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useEntries } from '@/hooks/useEntries'
import { EntryCard } from '@/components/entry'
import { colors } from '@/theme/colors'
import type { EntryWithSrs } from '@td2u/shared-types'

export default function EntriesScreen() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { entries, isLoading, refresh, hasMore, loadMore, total } = useEntries({
    search: debouncedSearch,
  })

  // Debounce search
  const handleSearchChange = useCallback((text: string) => {
    setSearch(text)
    // Simple debounce using setTimeout
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(text)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [])

  const handleEntryPress = (entry: EntryWithSrs) => {
    router.push(`/entry/${entry.id}`)
  }

  const handleCreatePress = () => {
    router.push('/entry/new')
  }

  const renderItem = ({ item }: { item: EntryWithSrs }) => (
    <EntryCard entry={item} onPress={() => handleEntryPress(item)} />
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearchChange}
          placeholder="Search entries..."
          placeholderTextColor={colors.text.muted}
        />
      </View>
      <Text style={styles.countText}>
        {total} {total === 1 ? 'entry' : 'entries'}
      </Text>
    </View>
  )

  const renderEmpty = () => {
    if (isLoading) return null

    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📚</Text>
        <Text style={styles.emptyTitle}>
          {search ? 'No entries found' : 'No entries yet'}
        </Text>
        <Text style={styles.emptyText}>
          {search
            ? 'Try a different search term'
            : 'Create your first entry to start learning'}
        </Text>
      </View>
    )
  }

  const renderFooter = () => {
    if (!hasMore) return null

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={entries.length === 0 ? styles.emptyContainer : undefined}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && entries.length === 0}
            onRefresh={refresh}
            tintColor={colors.primary[500]}
          />
        }
        onEndReached={() => {
          if (hasMore && !isLoading) {
            loadMore()
          }
        }}
        onEndReachedThreshold={0.5}
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
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: colors.background.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  countText: {
    fontSize: 14,
    color: colors.text.secondary,
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
  footer: {
    padding: 16,
    alignItems: 'center',
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

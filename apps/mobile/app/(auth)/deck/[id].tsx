import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useDeck } from '@/hooks/useDeck'
import { EntryCard } from '@/components/entry'
import { Button } from '@/components/ui'
import { colors } from '@/theme/colors'
import type { EntryWithSrs } from '@td2u/shared-types'

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { deck, isLoading, error, refresh, deleteDeck } = useDeck(id)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEntryPress = (entry: EntryWithSrs) => {
    router.push(`/entry/${entry.id}`)
  }

  const handleEdit = () => {
    router.push(`/deck/${id}/edit`)
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Deck',
      'Are you sure you want to delete this deck? Entries in this deck will not be deleted, but will no longer be associated with any deck.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true)
            const success = await deleteDeck()
            setIsDeleting(false)
            if (success) {
              router.back()
            } else {
              Alert.alert('Error', 'Failed to delete deck')
            }
          },
        },
      ]
    )
  }

  const handleAddEntry = () => {
    router.push('/entry/new')
  }

  const renderItem = ({ item }: { item: EntryWithSrs }) => (
    <EntryCard entry={item} onPress={() => handleEntryPress(item)} />
  )

  const renderHeader = () => (
    <View style={styles.header}>
      {deck?.description && (
        <Text style={styles.description}>{deck.description}</Text>
      )}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{deck?.entry_count || 0}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {deck?.entries?.filter(
              (e) => new Date(e.due_date) <= new Date()
            ).length || 0}
          </Text>
          <Text style={styles.statLabel}>Due</Text>
        </View>
      </View>
    </View>
  )

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>No entries yet</Text>
      <Text style={styles.emptyText}>
        Add entries to this deck to start learning
      </Text>
      <Button
        title="Add Entry"
        onPress={handleAddEntry}
        style={{ marginTop: 16 }}
      />
    </View>
  )

  const renderFooter = () => (
    <View style={styles.footer}>
      <Button
        title="Delete Deck"
        onPress={handleDelete}
        loading={isDeleting}
        disabled={isDeleting}
        variant="outline"
        style={styles.deleteButton}
      />
    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !deck) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error?.message || 'Deck not found'}</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: deck.name,
          headerBackTitle: 'Decks',
          headerRight: () => (
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <FlatList
        data={deck.entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={deck.entries.length > 0 ? renderFooter : undefined}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refresh}
            tintColor={colors.primary[500]}
          />
        }
        contentContainerStyle={
          deck.entries.length === 0 ? styles.emptyContainer : undefined
        }
      />
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
    padding: 24,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
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
    marginBottom: 16,
  },
  deleteButton: {
    borderColor: colors.error.DEFAULT,
  },
  editButton: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: colors.error.DEFAULT,
    marginBottom: 16,
    textAlign: 'center',
  },
})

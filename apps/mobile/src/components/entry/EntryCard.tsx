import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors } from '@/theme/colors'
import type { EntryWithSrs } from '@td2u/shared-types'

interface EntryCardProps {
  entry: EntryWithSrs
  onPress: () => void
}

export function EntryCard({ entry, onPress }: EntryCardProps) {
  const isDue = new Date(entry.due_date) <= new Date()

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.term} numberOfLines={1}>
            {entry.term}
          </Text>
          {isDue && <View style={styles.dueBadge} />}
        </View>

        {entry.enrichment?.translation_ja && (
          <Text style={styles.translation} numberOfLines={1}>
            {entry.enrichment.translation_ja}
          </Text>
        )}

        {entry.context && (
          <Text style={styles.context} numberOfLines={2}>
            {entry.context}
          </Text>
        )}

        <View style={styles.footer}>
          {entry.deck_name && (
            <View style={styles.deckBadge}>
              <Text style={styles.deckName}>{entry.deck_name}</Text>
            </View>
          )}
          <Text style={styles.srsInfo}>
            {entry.repetitions} reviews
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.light,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  term: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dueBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  translation: {
    fontSize: 14,
    color: colors.primary[600],
    marginTop: 4,
  },
  context: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  deckBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deckName: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  srsInfo: {
    fontSize: 12,
    color: colors.text.muted,
  },
})

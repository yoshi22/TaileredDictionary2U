import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useEntry } from '@/hooks/useEntry'
import { Button, Card } from '@/components/ui'
import { colors } from '@/theme/colors'

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { entry, isLoading, error, deleteEntry, generateEnrichment } = useEntry(id)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleEdit = () => {
    router.push(`/entry/${id}/edit`)
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true)
            const success = await deleteEntry()
            setIsDeleting(false)
            if (success) {
              router.back()
            } else {
              Alert.alert('Error', 'Failed to delete entry')
            }
          },
        },
      ]
    )
  }

  const handleGenerateEnrichment = async () => {
    setIsGenerating(true)
    const success = await generateEnrichment()
    setIsGenerating(false)
    if (!success) {
      Alert.alert('Error', 'Failed to generate enrichment. Please try again.')
    }
  }

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

  if (error || !entry) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error?.message || 'Entry not found'}</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: entry.term,
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.content}>
        {/* Term Card */}
        <Card style={styles.card}>
          <Text style={styles.term}>{entry.term}</Text>
          {entry.deck_name && (
            <View style={styles.deckBadge}>
              <Text style={styles.deckName}>{entry.deck_name}</Text>
            </View>
          )}
        </Card>

        {/* Context */}
        {entry.context && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Context</Text>
            <Text style={styles.contextText}>{entry.context}</Text>
          </Card>
        )}

        {/* Enrichment */}
        {entry.enrichment ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>AI Enrichment</Text>

            {entry.enrichment.translation_ja && (
              <View style={styles.section}>
                <Text style={styles.label}>Japanese Translation</Text>
                <Text style={styles.value}>{entry.enrichment.translation_ja}</Text>
              </View>
            )}

            {entry.enrichment.translation_en && (
              <View style={styles.section}>
                <Text style={styles.label}>English Translation</Text>
                <Text style={styles.value}>{entry.enrichment.translation_en}</Text>
              </View>
            )}

            {entry.enrichment.summary && (
              <View style={styles.section}>
                <Text style={styles.label}>Summary</Text>
                <Text style={styles.value}>{entry.enrichment.summary}</Text>
              </View>
            )}

            {entry.enrichment.examples && entry.enrichment.examples.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.label}>Examples</Text>
                {entry.enrichment.examples.map((example, index) => (
                  <Text key={index} style={styles.example}>
                    {index + 1}. {example}
                  </Text>
                ))}
              </View>
            )}

            {entry.enrichment.related_terms &&
              entry.enrichment.related_terms.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.label}>Related Terms</Text>
                  <View style={styles.tags}>
                    {entry.enrichment.related_terms.map((term, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{term}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
          </Card>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>AI Enrichment</Text>
            <Text style={styles.noEnrichment}>No enrichment generated yet</Text>
            <Button
              title="Generate Enrichment"
              onPress={handleGenerateEnrichment}
              loading={isGenerating}
              disabled={isGenerating}
              style={{ marginTop: 12 }}
            />
          </Card>
        )}

        {/* SRS Info */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Learning Progress</Text>
          <View style={styles.srsGrid}>
            <View style={styles.srsItem}>
              <Text style={styles.srsValue}>{entry.repetitions}</Text>
              <Text style={styles.srsLabel}>Reviews</Text>
            </View>
            <View style={styles.srsItem}>
              <Text style={styles.srsValue}>{entry.interval_days}</Text>
              <Text style={styles.srsLabel}>Interval (days)</Text>
            </View>
            <View style={styles.srsItem}>
              <Text style={styles.srsValue}>{entry.ease_factor.toFixed(2)}</Text>
              <Text style={styles.srsLabel}>Ease Factor</Text>
            </View>
          </View>
          <Text style={styles.dueDate}>
            Next Review: {new Date(entry.due_date).toLocaleDateString()}
          </Text>
        </Card>

        {/* Delete Button */}
        <View style={styles.deleteContainer}>
          <Button
            title="Delete Entry"
            onPress={handleDelete}
            loading={isDeleting}
            disabled={isDeleting}
            variant="outline"
            style={styles.deleteButton}
          />
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  term: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  deckBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deckName: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  contextText: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
  },
  example: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: colors.primary[600],
  },
  noEnrichment: {
    fontSize: 14,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  srsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  srsItem: {
    alignItems: 'center',
  },
  srsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  srsLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
  dueDate: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
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
  deleteContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  deleteButton: {
    borderColor: colors.error.DEFAULT,
  },
})

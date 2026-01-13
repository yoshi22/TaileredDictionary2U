import { useState } from 'react'
import { StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { EntryForm } from '@/components/entry'
import { useEntries } from '@/hooks/useEntries'
import { useDecks } from '@/hooks/useDecks'
import { colors } from '@/theme/colors'

export default function NewEntryScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createEntry } = useEntries()
  const { decks } = useDecks()

  const handleSubmit = async (data: {
    term: string
    context: string
    deck_id: string | null
  }) => {
    try {
      setIsSubmitting(true)
      const entry = await createEntry({
        term: data.term,
        context: data.context || undefined,
        deck_id: data.deck_id,
      })

      if (entry) {
        // Navigate to the new entry's detail page
        router.replace(`/entry/${entry.id}`)
      } else {
        Alert.alert('Error', 'Failed to create entry. Please try again.')
      }
    } catch (error) {
      console.error('Failed to create entry:', error)
      Alert.alert('Error', 'Failed to create entry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'New Entry',
          headerBackTitle: 'Back',
        }}
      />
      <EntryForm
        decks={decks}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Create Entry"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
})

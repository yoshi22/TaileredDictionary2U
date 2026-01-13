import { useState } from 'react'
import { StyleSheet, ActivityIndicator, View, Text, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { EntryForm } from '@/components/entry'
import { useEntry } from '@/hooks/useEntry'
import { useDecks } from '@/hooks/useDecks'
import { colors } from '@/theme/colors'

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { entry, isLoading, error, updateEntry } = useEntry(id)
  const { decks } = useDecks()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: {
    term: string
    context: string
    deck_id: string | null
  }) => {
    try {
      setIsSubmitting(true)
      const success = await updateEntry({
        term: data.term,
        context: data.context || null,
        deck_id: data.deck_id,
      })

      if (success) {
        router.back()
      } else {
        Alert.alert('Error', 'Failed to update entry. Please try again.')
      }
    } catch (err) {
      console.error('Failed to update entry:', err)
      Alert.alert('Error', 'Failed to update entry. Please try again.')
    } finally {
      setIsSubmitting(false)
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
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Edit Entry',
          headerBackTitle: 'Cancel',
        }}
      />
      <EntryForm
        initialData={{
          term: entry.term,
          context: entry.context || '',
          deck_id: entry.deck_id,
        }}
        decks={decks}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
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
  errorText: {
    fontSize: 16,
    color: colors.error.DEFAULT,
    textAlign: 'center',
  },
})

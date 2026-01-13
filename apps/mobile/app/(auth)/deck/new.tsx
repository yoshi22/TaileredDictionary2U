import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { Button } from '@/components/ui'
import { useDecks } from '@/hooks/useDecks'
import { colors } from '@/theme/colors'

export default function NewDeckScreen() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { createDeck } = useDecks()

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Deck name is required'
    } else if (name.length > 100) {
      newErrors.name = 'Deck name must be 100 characters or less'
    }

    if (description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      setIsSubmitting(true)
      const deck = await createDeck({
        name: name.trim(),
        description: description.trim() || undefined,
      })

      if (deck) {
        router.replace(`/deck/${deck.id}`)
      } else {
        Alert.alert('Error', 'Failed to create deck. Please try again.')
      }
    } catch (error) {
      console.error('Failed to create deck:', error)
      Alert.alert('Error', 'Failed to create deck. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'New Deck',
          headerBackTitle: 'Cancel',
        }}
      />
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Deck Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={setName}
            placeholder="Enter deck name"
            placeholderTextColor={colors.text.muted}
            autoFocus
            maxLength={100}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          <Text style={styles.charCount}>{name.length}/100</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add a description for this deck"
            placeholderTextColor={colors.text.muted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Create Deck"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || !name.trim()}
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
  content: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 100,
  },
  inputError: {
    borderColor: colors.error.DEFAULT,
  },
  errorText: {
    fontSize: 12,
    color: colors.error.DEFAULT,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
})

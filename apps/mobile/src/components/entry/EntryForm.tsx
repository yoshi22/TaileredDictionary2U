import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { colors } from '@/theme/colors'
import { Button } from '@/components/ui'
import type { Deck } from '@td2u/shared-types'

interface EntryFormData {
  term: string
  context: string
  deck_id: string | null
}

interface EntryFormProps {
  initialData?: Partial<EntryFormData>
  decks: Deck[]
  onSubmit: (data: EntryFormData) => Promise<void>
  isSubmitting: boolean
  submitLabel: string
}

export function EntryForm({
  initialData,
  decks,
  onSubmit,
  isSubmitting,
  submitLabel,
}: EntryFormProps) {
  const [term, setTerm] = useState(initialData?.term ?? '')
  const [context, setContext] = useState(initialData?.context ?? '')
  const [deckId, setDeckId] = useState<string | null>(initialData?.deck_id ?? null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setTerm(initialData.term ?? '')
      setContext(initialData.context ?? '')
      setDeckId(initialData.deck_id ?? null)
    }
  }, [initialData])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!term.trim()) {
      newErrors.term = 'Term is required'
    } else if (term.length > 200) {
      newErrors.term = 'Term must be 200 characters or less'
    }

    if (context.length > 500) {
      newErrors.context = 'Context must be 500 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    await onSubmit({
      term: term.trim(),
      context: context.trim() || '',
      deck_id: deckId,
    })
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <Text style={styles.label}>Term *</Text>
        <TextInput
          style={[styles.input, errors.term && styles.inputError]}
          value={term}
          onChangeText={setTerm}
          placeholder="Enter term or phrase"
          placeholderTextColor={colors.text.muted}
          autoFocus
          maxLength={200}
        />
        {errors.term && <Text style={styles.errorText}>{errors.term}</Text>}
        <Text style={styles.charCount}>{term.length}/200</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Context (Optional)</Text>
        <TextInput
          style={[styles.textArea, errors.context && styles.inputError]}
          value={context}
          onChangeText={setContext}
          placeholder="Add context or example sentence"
          placeholderTextColor={colors.text.muted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        {errors.context && <Text style={styles.errorText}>{errors.context}</Text>}
        <Text style={styles.charCount}>{context.length}/500</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Deck (Optional)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.deckList}
        >
          <TouchableOpacity
            style={[styles.deckOption, !deckId && styles.deckOptionSelected]}
            onPress={() => setDeckId(null)}
          >
            <Text
              style={[
                styles.deckOptionText,
                !deckId && styles.deckOptionTextSelected,
              ]}
            >
              No Deck
            </Text>
          </TouchableOpacity>
          {decks.map((deck) => (
            <TouchableOpacity
              key={deck.id}
              style={[
                styles.deckOption,
                deckId === deck.id && styles.deckOptionSelected,
              ]}
              onPress={() => setDeckId(deck.id)}
            >
              <Text
                style={[
                  styles.deckOptionText,
                  deckId === deck.id && styles.deckOptionTextSelected,
                ]}
              >
                {deck.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={submitLabel}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || !term.trim()}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
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
  deckList: {
    flexDirection: 'row',
  },
  deckOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  deckOptionSelected: {
    backgroundColor: colors.primary[500],
  },
  deckOptionText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  deckOptionTextSelected: {
    color: colors.background.light,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
})

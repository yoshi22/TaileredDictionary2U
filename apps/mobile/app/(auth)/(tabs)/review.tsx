import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Card, Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { SrsCalculator } from '@td2u/shared-srs'
import { colors } from '@/theme/colors'
import type { Entry, Enrichment, SrsRating } from '@td2u/shared-types'

interface SimpleSrsData {
  ease_factor: number
  interval_days: number
  repetitions: number
  due_date: string
  last_reviewed_at: string | null
}

interface ReviewEntry {
  entry: Entry & { enrichment: Enrichment | null }
  srs: SimpleSrsData
}

interface SessionStats {
  total: number
  again: number
  hard: number
  good: number
  easy: number
  startTime: Date
}

export default function ReviewScreen() {
  const [entries, setEntries] = useState<ReviewEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    total: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    startTime: new Date(),
  })
  const [showSummary, setShowSummary] = useState(false)
  const [initialCount, setInitialCount] = useState(0)

  const loadDueEntries = useCallback(async (resetSession = false) => {
    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch due entries with SRS data
      const { data, error } = await supabase
        .from('v_entries_with_srs')
        .select('*')
        .eq('user_id', user.id)
        .lte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(20)

      if (error) throw error

      const reviewEntries: ReviewEntry[] = (data || []).map((item: Record<string, unknown>) => ({
        entry: {
          id: item.id as string,
          user_id: item.user_id as string,
          deck_id: item.deck_id as string | null,
          term: item.term as string,
          context: item.context as string | null,
          enrichment: item.enrichment as Enrichment | null,
          created_at: item.created_at as string,
          updated_at: item.updated_at as string,
        },
        srs: {
          entry_id: item.id as string,
          user_id: item.user_id as string,
          ease_factor: (item.ease_factor as number) ?? 2.5,
          interval_days: (item.interval_days as number) ?? 0,
          repetitions: (item.repetitions as number) ?? 0,
          due_date: item.due_date as string,
          last_reviewed_at: item.last_reviewed_at as string | null,
        },
      }))

      setEntries(reviewEntries)
      setCurrentIndex(0)
      setInitialCount(reviewEntries.length)
      setShowSummary(false)

      if (resetSession) {
        setSessionStats({
          total: 0,
          again: 0,
          hard: 0,
          good: 0,
          easy: 0,
          startTime: new Date(),
        })
      }
    } catch (error) {
      console.error('Failed to load due entries:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load due entries on mount
  useEffect(() => {
    loadDueEntries(true)
  }, [loadDueEntries])

  const handleRating = async (rating: SrsRating) => {
    const current = entries[currentIndex]
    if (!current || isSubmitting) return

    try {
      setIsSubmitting(true)

      // Calculate next SRS state using the correct API
      const calculator = new SrsCalculator()
      const nextState = calculator.calculate({
        currentState: {
          easeFactor: current.srs.ease_factor,
          intervalDays: current.srs.interval_days,
          repetitions: current.srs.repetitions,
        },
        rating,
        reviewedAt: new Date(),
      })

      // Update SRS data
      const { error } = await supabase
        .from('srs_data')
        .update({
          ease_factor: nextState.ease_factor,
          interval_days: nextState.interval_days,
          repetitions: nextState.repetitions,
          due_date: nextState.due_date.toISOString(),
          last_reviewed_at: new Date().toISOString(),
        })
        .eq('entry_id', current.entry.id)

      if (error) throw error

      // Update session stats
      setSessionStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        again: rating === 0 ? prev.again + 1 : prev.again,
        hard: rating === 1 ? prev.hard + 1 : prev.hard,
        good: rating === 2 ? prev.good + 1 : prev.good,
        easy: rating === 3 ? prev.easy + 1 : prev.easy,
      }))

      // Handle "Again" - add back to queue
      if (rating === 0) {
        setEntries((prev) => {
          const updated = [...prev]
          const item = updated.splice(currentIndex, 1)[0]
          // Add back to end with reset SRS
          updated.push({
            ...item,
            srs: {
              ...item.srs,
              ease_factor: nextState.ease_factor,
              interval_days: nextState.interval_days,
              repetitions: nextState.repetitions,
            },
          })
          return updated
        })
        setIsFlipped(false)
      } else {
        // Move to next entry or show summary
        if (currentIndex < entries.length - 1) {
          setCurrentIndex((prev) => prev + 1)
          setIsFlipped(false)
        } else {
          // Session complete - show summary
          setEntries((prev) => prev.filter((_, i) => i !== currentIndex))
          setShowSummary(true)
          setIsFlipped(false)
        }
      }
    } catch (error) {
      console.error('Failed to submit rating:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSessionDuration = () => {
    const duration = Math.floor(
      (new Date().getTime() - sessionStats.startTime.getTime()) / 1000
    )
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}m ${seconds}s`
  }

  const getAccuracyRate = () => {
    if (sessionStats.total === 0) return 0
    const correct = sessionStats.good + sessionStats.easy
    return Math.round((correct / sessionStats.total) * 100)
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // No entries due
  if (entries.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>
            No reviews due right now. Check back later!
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Get current entry for rendering
  const current = entries[currentIndex]

  // Session summary
  if (showSummary || (!current && sessionStats.total > 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.summaryContainer}>
          <Text style={styles.summaryIcon}>🎉</Text>
          <Text style={styles.summaryTitle}>Session Complete!</Text>
          <Text style={styles.summarySubtitle}>
            Great job! Here's your summary
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Reviews</Text>
              <Text style={styles.summaryValue}>{sessionStats.total}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{getSessionDuration()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Accuracy</Text>
              <Text style={styles.summaryValue}>{getAccuracyRate()}%</Text>
            </View>
          </View>

          <View style={styles.ratingBreakdown}>
            <Text style={styles.breakdownTitle}>Rating Breakdown</Text>
            <View style={styles.breakdownGrid}>
              <View style={styles.breakdownItem}>
                <View
                  style={[
                    styles.breakdownDot,
                    { backgroundColor: colors.error.DEFAULT },
                  ]}
                />
                <Text style={styles.breakdownLabel}>Again</Text>
                <Text style={styles.breakdownValue}>{sessionStats.again}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <View
                  style={[
                    styles.breakdownDot,
                    { backgroundColor: colors.warning.DEFAULT },
                  ]}
                />
                <Text style={styles.breakdownLabel}>Hard</Text>
                <Text style={styles.breakdownValue}>{sessionStats.hard}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <View
                  style={[
                    styles.breakdownDot,
                    { backgroundColor: colors.success.DEFAULT },
                  ]}
                />
                <Text style={styles.breakdownLabel}>Good</Text>
                <Text style={styles.breakdownValue}>{sessionStats.good}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <View
                  style={[
                    styles.breakdownDot,
                    { backgroundColor: colors.primary[500] },
                  ]}
                />
                <Text style={styles.breakdownLabel}>Easy</Text>
                <Text style={styles.breakdownValue}>{sessionStats.easy}</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryActions}>
            <Button
              title="Start New Session"
              onPress={() => loadDueEntries(true)}
              style={{ marginBottom: 12 }}
            />
            <Button
              title="View History"
              variant="outline"
              onPress={() => router.push('/review/history')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyTitle}>Session Complete!</Text>
          <Text style={styles.emptyText}>Great job! You've finished this review session.</Text>
          <Button title="Load More" onPress={() => loadDueEntries(true)} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {entries.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / entries.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.reviewCard}
          onPress={() => setIsFlipped(!isFlipped)}
          activeOpacity={0.9}
        >
          {!isFlipped ? (
            // Front - Term
            <View style={styles.cardContent}>
              <Text style={styles.cardTerm}>{current.entry.term}</Text>
              {current.entry.context && (
                <Text style={styles.cardContext}>{current.entry.context}</Text>
              )}
              <Text style={styles.tapHint}>Tap to reveal answer</Text>
            </View>
          ) : (
            // Back - Enrichment
            <View style={styles.cardContent}>
              <Text style={styles.cardTerm}>{current.entry.term}</Text>
              {current.entry.enrichment ? (
                <>
                  {current.entry.enrichment.translation_ja && (
                    <Text style={styles.translation}>
                      {current.entry.enrichment.translation_ja}
                    </Text>
                  )}
                  {current.entry.enrichment.summary && (
                    <Text style={styles.summary}>
                      {current.entry.enrichment.summary}
                    </Text>
                  )}
                  {current.entry.enrichment.examples &&
                    current.entry.enrichment.examples.length > 0 && (
                      <View style={styles.examples}>
                        <Text style={styles.examplesTitle}>Examples:</Text>
                        {current.entry.enrichment.examples
                          .slice(0, 2)
                          .map((ex, i) => (
                            <Text key={i} style={styles.example}>
                              • {ex}
                            </Text>
                          ))}
                      </View>
                    )}
                </>
              ) : (
                <Text style={styles.noEnrichment}>
                  No enrichment available
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Rating Buttons */}
      {isFlipped && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>How well did you know this?</Text>
          <View style={styles.ratingButtons}>
            <RatingButton
              label="Again"
              sublabel="<1min"
              color={colors.error.DEFAULT}
              onPress={() => handleRating(0)}
              disabled={isSubmitting}
            />
            <RatingButton
              label="Hard"
              sublabel="~6min"
              color={colors.warning.DEFAULT}
              onPress={() => handleRating(1)}
              disabled={isSubmitting}
            />
            <RatingButton
              label="Good"
              sublabel="~10min"
              color={colors.success.DEFAULT}
              onPress={() => handleRating(2)}
              disabled={isSubmitting}
            />
            <RatingButton
              label="Easy"
              sublabel="4d"
              color={colors.primary[500]}
              onPress={() => handleRating(3)}
              disabled={isSubmitting}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

function RatingButton({
  label,
  sublabel,
  color,
  onPress,
  disabled,
}: {
  label: string
  sublabel: string
  color: string
  onPress: () => void
  disabled: boolean
}) {
  return (
    <TouchableOpacity
      style={[styles.ratingButton, { borderColor: color }, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.ratingLabel, { color }]}>{label}</Text>
      <Text style={styles.ratingSublabel}>{sublabel}</Text>
    </TouchableOpacity>
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
  loadingText: {
    marginTop: 16,
    color: colors.text.secondary,
  },
  emptyIcon: {
    fontSize: 64,
    color: colors.success.DEFAULT,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  progress: {
    padding: 16,
  },
  progressText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
  },
  cardContainer: {
    flex: 1,
    padding: 16,
  },
  reviewCard: {
    flex: 1,
    backgroundColor: colors.background.light,
    borderRadius: 16,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTerm: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  cardContext: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tapHint: {
    position: 'absolute',
    bottom: 24,
    color: colors.text.muted,
    fontSize: 14,
  },
  translation: {
    fontSize: 22,
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  summary: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  examples: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  example: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  noEnrichment: {
    fontSize: 16,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  ratingContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: colors.background.light,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingSublabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  // Summary styles
  summaryContainer: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  summarySubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.background.light,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  ratingBreakdown: {
    width: '100%',
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  summaryActions: {
    width: '100%',
    marginTop: 8,
  },
})

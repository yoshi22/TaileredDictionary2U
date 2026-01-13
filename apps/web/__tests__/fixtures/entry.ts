import type { Entry, EntryWithSrs, Enrichment } from '@td2u/shared-types'

/**
 * Sample enrichment data
 */
export const sampleEnrichment: Enrichment = {
  translation_ja: 'テスト用語の日本語訳',
  translation_en: 'English translation of test term',
  summary: 'This is a test term used for testing purposes. It demonstrates the enrichment feature.',
  examples: [
    'Example sentence using test term.',
    'Another example with test term in context.',
  ],
  related_terms: ['related1', 'related2', 'related3'],
  reference_links: [
    { title: 'Reference 1', url: 'https://example.com/ref1' },
  ],
  generated_at: '2025-01-07T10:00:00Z',
  model: 'gpt-4o-mini',
}

/**
 * Entry without enrichment
 */
export const entryWithoutEnrichment: Entry = {
  id: 'entry-1',
  user_id: 'user-1',
  deck_id: 'deck-1',
  term: 'test term',
  context: 'This is the context for test term.',
  enrichment: null,
  created_at: '2025-01-07T10:00:00Z',
  updated_at: '2025-01-07T10:00:00Z',
}

/**
 * Entry with enrichment
 */
export const entryWithEnrichment: Entry = {
  id: 'entry-2',
  user_id: 'user-1',
  deck_id: 'deck-1',
  term: 'enriched term',
  context: 'Context for enriched term.',
  enrichment: sampleEnrichment,
  created_at: '2025-01-07T10:00:00Z',
  updated_at: '2025-01-07T11:00:00Z',
}

/**
 * Entry without deck (default deck)
 */
export const entryNoDeck: Entry = {
  id: 'entry-3',
  user_id: 'user-1',
  deck_id: null,
  term: 'no deck term',
  context: null,
  enrichment: null,
  created_at: '2025-01-07T10:00:00Z',
  updated_at: '2025-01-07T10:00:00Z',
}

/**
 * Entry with SRS data - new (first review)
 */
export const entryWithSrsNew: EntryWithSrs = {
  id: 'entry-srs-1',
  user_id: 'user-1',
  deck_id: 'deck-1',
  term: 'new srs term',
  context: 'Context for new SRS term.',
  enrichment: sampleEnrichment,
  created_at: '2025-01-07T10:00:00Z',
  updated_at: '2025-01-07T10:00:00Z',
  ease_factor: 2.5,
  interval_days: 0,
  repetitions: 0,
  due_date: '2025-01-07T00:00:00Z',
  last_reviewed_at: null,
  deck_name: 'Test Deck',
}

/**
 * Entry with SRS data - reviewed multiple times
 */
export const entryWithSrsReviewed: EntryWithSrs = {
  id: 'entry-srs-2',
  user_id: 'user-1',
  deck_id: 'deck-1',
  term: 'reviewed srs term',
  context: 'Context for reviewed SRS term.',
  enrichment: sampleEnrichment,
  created_at: '2025-01-01T10:00:00Z',
  updated_at: '2025-01-07T10:00:00Z',
  ease_factor: 2.6,
  interval_days: 6,
  repetitions: 3,
  due_date: '2025-01-13T00:00:00Z',
  last_reviewed_at: '2025-01-07T10:00:00Z',
  deck_name: 'Test Deck',
}

/**
 * Entry due for review (due_date in the past)
 */
export const entryDueForReview: EntryWithSrs = {
  id: 'entry-srs-3',
  user_id: 'user-1',
  deck_id: 'deck-1',
  term: 'due term',
  context: 'Context for due term.',
  enrichment: sampleEnrichment,
  created_at: '2025-01-01T10:00:00Z',
  updated_at: '2025-01-05T10:00:00Z',
  ease_factor: 2.4,
  interval_days: 2,
  repetitions: 2,
  due_date: '2025-01-06T00:00:00Z', // Past due
  last_reviewed_at: '2025-01-04T10:00:00Z',
  deck_name: 'Test Deck',
}

/**
 * Multiple entries for list tests
 */
export const entryList: Entry[] = [
  entryWithoutEnrichment,
  entryWithEnrichment,
  entryNoDeck,
]

/**
 * Multiple entries with SRS for review tests
 */
export const entryWithSrsList: EntryWithSrs[] = [
  entryWithSrsNew,
  entryWithSrsReviewed,
  entryDueForReview,
]

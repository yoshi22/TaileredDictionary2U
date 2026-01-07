/**
 * AI生成リファレンスリンク
 */
export interface ReferenceLink {
  title: string;
  url: string;
}

/**
 * AI生成Enrichmentデータ
 */
export interface Enrichment {
  translation_ja: string;
  translation_en: string;
  summary: string;
  examples: string[];
  related_terms: string[];
  reference_links: ReferenceLink[];
  generated_at: string;
  model: string;
}

/**
 * Entry（単語・フレーズ登録）
 */
export interface Entry {
  id: string;
  user_id: string;
  deck_id: string | null;
  term: string;
  context: string | null;
  enrichment: Enrichment | null;
  created_at: string;
  updated_at: string;
}

/**
 * Entry作成用
 */
export interface CreateEntry {
  term: string;
  context?: string | null;
  deck_id?: string | null;
}

/**
 * Entry更新用
 */
export interface UpdateEntry {
  term?: string;
  context?: string | null;
  deck_id?: string | null;
  enrichment?: Enrichment | null;
}

/**
 * EntryとSRSデータを結合した型
 */
export interface EntryWithSrs extends Entry {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_date: string;
  last_reviewed_at: string | null;
  deck_name: string | null;
}

/**
 * SRS評価（SM-2ベース）
 * 0: Again - 完全に忘れた
 * 1: Hard - 思い出すのに苦労した
 * 2: Good - 思い出せた
 * 3: Easy - 簡単に思い出せた
 */
export type SrsRating = 0 | 1 | 2 | 3;

/**
 * SRS評価ラベル
 */
export const SRS_RATING_LABELS: Record<SrsRating, string> = {
  0: 'Again',
  1: 'Hard',
  2: 'Good',
  3: 'Easy',
} as const;

/**
 * SRSデータ
 */
export interface SrsData {
  id: string;
  entry_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_date: string;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * SRS計算結果
 */
export interface SrsCalculationResult {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_date: Date;
}

/**
 * 復習セッションサマリー
 */
export interface ReviewSessionSummary {
  total_reviewed: number;
  again_count: number;
  hard_count: number;
  good_count: number;
  easy_count: number;
  session_duration_seconds: number;
}

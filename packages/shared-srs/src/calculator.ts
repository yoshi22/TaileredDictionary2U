import type { SrsRating, SrsCalculationResult } from '@td2u/shared-types';

/**
 * SRSパラメータ設定
 */
export interface SrsParams {
  /** 初期ease factor */
  initialEaseFactor: number;
  /** 最小ease factor */
  minEaseFactor: number;
  /** 最大ease factor */
  maxEaseFactor: number;
  /** "Again"時のinterval（日） */
  againInterval: number;
  /** 初回正解時のinterval（日） */
  firstInterval: number;
  /** 2回目正解時のinterval（日） */
  secondInterval: number;
}

/**
 * デフォルトSRSパラメータ（SM-2ベース）
 */
export const DEFAULT_SRS_PARAMS: SrsParams = {
  initialEaseFactor: 2.5,
  minEaseFactor: 1.3,
  maxEaseFactor: 2.5,
  againInterval: 1,
  firstInterval: 1,
  secondInterval: 6,
};

/**
 * 現在のSRS状態
 */
export interface SrsState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

/**
 * SRS計算入力
 */
export interface SrsInput {
  currentState: SrsState;
  rating: SrsRating;
  reviewedAt?: Date;
}

/**
 * SM-2ベースのSRS計算クラス
 *
 * ## アルゴリズム概要
 *
 * ### 評価による処理
 * - **Again (0)**: repetitions=0にリセット、interval=1日
 * - **Hard (1)**: repetitionsそのまま、interval×1.2
 * - **Good (2)**: 標準計算
 * - **Easy (3)**: 標準計算、bonus適用
 *
 * ### Ease Factor更新
 * EF' = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
 * ただし q = rating + 2 (SM-2の0-5スケールに変換)
 *
 * ### Interval計算
 * - repetitions=1: firstInterval (1日)
 * - repetitions=2: secondInterval (6日)
 * - repetitions>2: interval × easeFactor
 */
export class SrsCalculator {
  private params: SrsParams;

  constructor(params: Partial<SrsParams> = {}) {
    this.params = { ...DEFAULT_SRS_PARAMS, ...params };
  }

  /**
   * 新規カード用の初期状態を取得
   */
  getInitialState(): SrsState {
    return {
      easeFactor: this.params.initialEaseFactor,
      intervalDays: 0,
      repetitions: 0,
    };
  }

  /**
   * 復習結果に基づいて次の状態を計算
   */
  calculate(input: SrsInput): SrsCalculationResult {
    const { currentState, rating, reviewedAt = new Date() } = input;
    let { easeFactor, intervalDays, repetitions } = currentState;

    // Rating 0 (Again): リセット
    if (rating === 0) {
      return {
        ease_factor: Math.max(easeFactor - 0.2, this.params.minEaseFactor),
        interval_days: this.params.againInterval,
        repetitions: 0,
        due_date: this.addDays(reviewedAt, this.params.againInterval),
      };
    }

    // Ease Factor更新 (SM-2式)
    // q = rating + 2 で 0-5 スケールに変換（rating 0-3 → q 2-5）
    const q = rating + 2;
    const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    easeFactor = Math.max(
      this.params.minEaseFactor,
      Math.min(this.params.maxEaseFactor, easeFactor + efDelta)
    );

    // Repetitions更新
    repetitions += 1;

    // Interval計算
    if (repetitions === 1) {
      intervalDays = this.params.firstInterval;
    } else if (repetitions === 2) {
      intervalDays = this.params.secondInterval;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }

    // Rating別の調整
    if (rating === 1) {
      // Hard: intervalを短めに
      intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
    } else if (rating === 3) {
      // Easy: intervalを長めに（ボーナス）
      intervalDays = Math.round(intervalDays * 1.3);
    }

    return {
      ease_factor: easeFactor,
      interval_days: intervalDays,
      repetitions,
      due_date: this.addDays(reviewedAt, intervalDays),
    };
  }

  /**
   * 次回復習予定の各評価での日付を計算（プレビュー用）
   */
  previewNextDueDates(
    currentState: SrsState,
    reviewedAt: Date = new Date()
  ): Record<SrsRating, Date> {
    return {
      0: this.calculate({ currentState, rating: 0, reviewedAt }).due_date,
      1: this.calculate({ currentState, rating: 1, reviewedAt }).due_date,
      2: this.calculate({ currentState, rating: 2, reviewedAt }).due_date,
      3: this.calculate({ currentState, rating: 3, reviewedAt }).due_date,
    };
  }

  /**
   * 日付に日数を加算
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

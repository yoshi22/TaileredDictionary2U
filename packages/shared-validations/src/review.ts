import { z } from 'zod';

/**
 * SRS評価スキーマ
 */
export const SrsRatingSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

/**
 * 復習結果送信スキーマ
 */
export const SubmitReviewSchema = z.object({
  rating: SrsRatingSchema,
});

export type SubmitReviewInput = z.infer<typeof SubmitReviewSchema>;

/**
 * 復習セッション開始スキーマ
 */
export const StartReviewSessionSchema = z.object({
  deck_id: z.string().uuid().optional().nullable(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type StartReviewSessionInput = z.infer<typeof StartReviewSessionSchema>;

/**
 * Due Entries取得クエリスキーマ
 */
export const GetDueEntriesQuerySchema = z.object({
  deck_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetDueEntriesQuery = z.infer<typeof GetDueEntriesQuerySchema>;

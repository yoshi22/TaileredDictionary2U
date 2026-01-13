import { z } from 'zod';
import { sanitizeText, sanitizeOptionalText } from './sanitize';

/**
 * Entry作成スキーマ
 * - term: サニタイズ (trim, 制御文字除去, Unicode正規化) 後に検証
 * - context: サニタイズ後に検証 (オプショナル)
 */
export const CreateEntrySchema = z.object({
  term: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(1, '用語を入力してください')
        .max(200, '用語は200文字以内で入力してください')
    ),
  context: z
    .string()
    .optional()
    .nullable()
    .transform(sanitizeOptionalText)
    .pipe(
      z
        .string()
        .max(500, '文脈は500文字以内で入力してください')
        .optional()
        .nullable()
    ),
  deck_id: z.string().uuid().optional().nullable(),
});

export type CreateEntryInput = z.infer<typeof CreateEntrySchema>;

/**
 * Entry更新スキーマ
 * - term: サニタイズ後に検証 (オプショナル)
 * - context: サニタイズ後に検証 (オプショナル)
 */
export const UpdateEntrySchema = z.object({
  term: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? sanitizeText(val) : undefined))
    .pipe(
      z
        .string()
        .min(1, '用語を入力してください')
        .max(200, '用語は200文字以内で入力してください')
        .optional()
    ),
  context: z
    .string()
    .optional()
    .nullable()
    .transform(sanitizeOptionalText)
    .pipe(
      z
        .string()
        .max(500, '文脈は500文字以内で入力してください')
        .optional()
        .nullable()
    ),
  deck_id: z.string().uuid().optional().nullable(),
});

export type UpdateEntryInput = z.infer<typeof UpdateEntrySchema>;

/**
 * Entryリスト取得クエリスキーマ
 */
export const GetEntriesQuerySchema = z.object({
  deck_id: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['created_at', 'term', 'due_date']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type GetEntriesQuery = z.infer<typeof GetEntriesQuerySchema>;

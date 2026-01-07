import { z } from 'zod';

/**
 * Entry作成スキーマ
 */
export const CreateEntrySchema = z.object({
  term: z
    .string()
    .min(1, '用語を入力してください')
    .max(200, '用語は200文字以内で入力してください'),
  context: z
    .string()
    .max(500, '文脈は500文字以内で入力してください')
    .optional()
    .nullable(),
  deck_id: z.string().uuid().optional().nullable(),
});

export type CreateEntryInput = z.infer<typeof CreateEntrySchema>;

/**
 * Entry更新スキーマ
 */
export const UpdateEntrySchema = z.object({
  term: z
    .string()
    .min(1, '用語を入力してください')
    .max(200, '用語は200文字以内で入力してください')
    .optional(),
  context: z
    .string()
    .max(500, '文脈は500文字以内で入力してください')
    .optional()
    .nullable(),
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

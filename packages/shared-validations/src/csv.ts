import { z } from 'zod';

/**
 * CSV行バリデーションスキーマ
 * インポート時の各行のバリデーションに使用
 */
export const CsvRowSchema = z.object({
  term: z
    .string()
    .min(1, 'Term is required')
    .max(200, 'Term must be 200 characters or less'),
  context: z
    .string()
    .max(500, 'Context must be 500 characters or less')
    .optional()
    .nullable()
    .transform((v) => v || null),
  deck_id: z
    .string()
    .uuid('Invalid deck_id format')
    .optional()
    .nullable()
    .transform((v) => v || null),
});

export type CsvRowInput = z.infer<typeof CsvRowSchema>;

/**
 * CSVインポートオプションスキーマ
 */
export const CsvImportOptionsSchema = z.object({
  deck_id: z.string().uuid().optional().nullable(),
  skip_duplicates: z.coerce.boolean().default(false),
});

export type CsvImportOptionsInput = z.infer<typeof CsvImportOptionsSchema>;

/**
 * CSVエクスポートクエリスキーマ
 */
export const CsvExportQuerySchema = z.object({
  deck_id: z.string().uuid().optional(),
});

export type CsvExportQuery = z.infer<typeof CsvExportQuerySchema>;

import { z } from 'zod';
import { sanitizeText, sanitizeOptionalText } from './sanitize';

/**
 * Deck作成スキーマ
 * - name: サニタイズ (trim, 制御文字除去, Unicode正規化) 後に検証
 * - description: サニタイズ後に検証 (オプショナル)
 */
export const CreateDeckSchema = z.object({
  name: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(1, 'Deck名を入力してください')
        .max(100, 'Deck名は100文字以内で入力してください')
    ),
  description: z
    .string()
    .optional()
    .nullable()
    .transform(sanitizeOptionalText)
    .pipe(
      z
        .string()
        .max(500, '説明は500文字以内で入力してください')
        .optional()
        .nullable()
    ),
});

export type CreateDeckInput = z.infer<typeof CreateDeckSchema>;

/**
 * Deck更新スキーマ
 * - name: サニタイズ後に検証 (オプショナル)
 * - description: サニタイズ後に検証 (オプショナル)
 */
export const UpdateDeckSchema = z.object({
  name: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? sanitizeText(val) : undefined))
    .pipe(
      z
        .string()
        .min(1, 'Deck名を入力してください')
        .max(100, 'Deck名は100文字以内で入力してください')
        .optional()
    ),
  description: z
    .string()
    .optional()
    .nullable()
    .transform(sanitizeOptionalText)
    .pipe(
      z
        .string()
        .max(500, '説明は500文字以内で入力してください')
        .optional()
        .nullable()
    ),
});

export type UpdateDeckInput = z.infer<typeof UpdateDeckSchema>;

import { z } from 'zod';

/**
 * Deck作成スキーマ
 */
export const CreateDeckSchema = z.object({
  name: z
    .string()
    .min(1, 'Deck名を入力してください')
    .max(100, 'Deck名は100文字以内で入力してください'),
  description: z
    .string()
    .max(500, '説明は500文字以内で入力してください')
    .optional()
    .nullable(),
});

export type CreateDeckInput = z.infer<typeof CreateDeckSchema>;

/**
 * Deck更新スキーマ
 */
export const UpdateDeckSchema = z.object({
  name: z
    .string()
    .min(1, 'Deck名を入力してください')
    .max(100, 'Deck名は100文字以内で入力してください')
    .optional(),
  description: z
    .string()
    .max(500, '説明は500文字以内で入力してください')
    .optional()
    .nullable(),
});

export type UpdateDeckInput = z.infer<typeof UpdateDeckSchema>;

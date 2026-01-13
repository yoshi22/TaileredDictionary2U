import { z } from 'zod';

/**
 * リファレンスリンクスキーマ
 */
export const ReferenceLinkSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});

/**
 * AI生成Enrichmentスキーマ
 */
export const EnrichmentSchema = z.object({
  translation_ja: z.string(),
  translation_en: z.string(),
  summary: z.string(),
  examples: z.array(z.string()).min(1).max(5),
  related_terms: z.array(z.string()).min(1).max(10),
  reference_links: z.array(ReferenceLinkSchema).max(5),
  generated_at: z.string().datetime().optional(),
  model: z.string().optional(),
});

export type EnrichmentInput = z.infer<typeof EnrichmentSchema>;

/**
 * Enrichment生成リクエストスキーマ
 */
export const GenerateEnrichmentRequestSchema = z.object({
  entry_id: z.string().uuid(),
  force_regenerate: z.boolean().optional().default(false),
});

export type GenerateEnrichmentRequest = z.infer<typeof GenerateEnrichmentRequestSchema>;

/**
 * LLMレスポンス（パース前）スキーマ
 * LLMからの生のJSONをバリデーション
 */
export const LLMEnrichmentResponseSchema = z.object({
  translation_ja: z.string(),
  translation_en: z.string(),
  summary: z.string(),
  examples: z.array(z.string()),
  related_terms: z.array(z.string()),
  reference_links: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
    })
  ),
});

export type LLMEnrichmentResponse = z.infer<typeof LLMEnrichmentResponseSchema>;

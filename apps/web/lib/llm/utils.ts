import fs from 'fs'
import path from 'path'
import type { EnrichmentInput } from './types'

/**
 * Load prompt template from file
 */
export function loadPromptTemplate(templateName: string): string {
  const promptPath = path.join(process.cwd(), 'prompts', `${templateName}.txt`)
  return fs.readFileSync(promptPath, 'utf-8')
}

/**
 * Build enrichment prompt from template and input
 */
export function buildEnrichmentPrompt(input: EnrichmentInput): string {
  const template = loadPromptTemplate('enrichment')

  let prompt = template.replace('{{term}}', input.term)

  // Handle conditional context section using simple string replacement
  if (input.context) {
    prompt = prompt.replace('{{#if context}}\n', '')
    prompt = prompt.replace('{{/if}}\n', '')
    prompt = prompt.replace('{{context}}', input.context)
  } else {
    // Remove the entire context block
    prompt = prompt.replace(/\{\{#if context\}\}[\s\S]*?\{\{\/if\}\}\n?/g, '')
  }

  return prompt
}

/**
 * Extract JSON from LLM response (handles markdown code blocks)
 */
export function extractJSON(content: string): string {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }

  // Try to find JSON object directly
  const objectMatch = content.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    return objectMatch[0]
  }

  return content.trim()
}

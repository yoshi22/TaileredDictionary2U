import { describe, it, expect } from 'vitest'
import { buildEnrichmentPrompt, extractJSON } from '../utils'

describe('buildEnrichmentPrompt', () => {
  it('should build prompt with term only', () => {
    const result = buildEnrichmentPrompt({ term: 'machine learning' })

    expect(result).toContain('TERM: machine learning')
    expect(result).not.toContain('CONTEXT:')
    expect(result).not.toContain('{{#if context}}')
    expect(result).not.toContain('{{/if}}')
  })

  it('should build prompt with term and context', () => {
    const result = buildEnrichmentPrompt({
      term: 'API',
      context: 'In the context of web development',
    })

    expect(result).toContain('TERM: API')
    expect(result).toContain('CONTEXT: In the context of web development')
    expect(result).not.toContain('{{#if context}}')
    expect(result).not.toContain('{{/if}}')
    expect(result).not.toContain('{{context}}')
    expect(result).not.toContain('{{term}}')
  })

  it('should handle null context same as no context', () => {
    const result = buildEnrichmentPrompt({ term: 'test', context: null })

    expect(result).toContain('TERM: test')
    expect(result).not.toContain('CONTEXT:')
  })

  it('should preserve JSON format instructions', () => {
    const result = buildEnrichmentPrompt({ term: 'test' })

    expect(result).toContain('translation_ja')
    expect(result).toContain('translation_en')
    expect(result).toContain('summary')
    expect(result).toContain('examples')
    expect(result).toContain('related_terms')
    expect(result).toContain('reference_links')
  })
})

describe('extractJSON', () => {
  it('should extract JSON from markdown code block with json language', () => {
    const content = `Here is the response:
\`\`\`json
{"key": "value"}
\`\`\`
Done!`

    const result = extractJSON(content)
    expect(result).toBe('{"key": "value"}')
  })

  it('should extract JSON from markdown code block without language', () => {
    const content = `\`\`\`
{"key": "value"}
\`\`\``

    const result = extractJSON(content)
    expect(result).toBe('{"key": "value"}')
  })

  it('should extract JSON object directly when no code block', () => {
    const content = 'Some text before {"key": "value"} some text after'

    const result = extractJSON(content)
    expect(result).toBe('{"key": "value"}')
  })

  it('should extract complex nested JSON', () => {
    const json = `{
      "translation_ja": "テスト",
      "examples": ["example 1", "example 2"],
      "nested": {"inner": "value"}
    }`
    const content = `\`\`\`json
${json}
\`\`\``

    const result = extractJSON(content)
    expect(() => JSON.parse(result)).not.toThrow()
    expect(JSON.parse(result).translation_ja).toBe('テスト')
  })

  it('should return trimmed content when no JSON pattern found', () => {
    const content = '  plain text response  '

    const result = extractJSON(content)
    expect(result).toBe('plain text response')
  })

  it('should handle multi-line JSON object', () => {
    const content = `{
      "key1": "value1",
      "key2": "value2"
    }`

    const result = extractJSON(content)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('should extract the first JSON code block when multiple exist', () => {
    const content = `\`\`\`json
{"first": true}
\`\`\`
\`\`\`json
{"second": true}
\`\`\``

    const result = extractJSON(content)
    expect(JSON.parse(result).first).toBe(true)
  })

  it('should handle whitespace in code blocks', () => {
    const content = `\`\`\`json

  {"key": "value"}

\`\`\``

    const result = extractJSON(content)
    expect(result).toBe('{"key": "value"}')
  })
})

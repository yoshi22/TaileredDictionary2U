import { describe, it, expect } from 'vitest'
import {
  stripControlChars,
  normalizeUnicode,
  sanitizeText,
  isValidUrl,
  getSafeUrl,
  sanitizeOptionalText,
} from '../sanitize'

describe('stripControlChars', () => {
  it('should remove null character', () => {
    expect(stripControlChars('hello\x00world')).toBe('helloworld')
  })

  it('should remove other control characters (0x01-0x08)', () => {
    expect(stripControlChars('a\x01b\x02c\x08d')).toBe('abcd')
  })

  it('should preserve tab character', () => {
    expect(stripControlChars('hello\tworld')).toBe('hello\tworld')
  })

  it('should preserve newline character', () => {
    expect(stripControlChars('hello\nworld')).toBe('hello\nworld')
  })

  it('should preserve carriage return', () => {
    expect(stripControlChars('hello\rworld')).toBe('hello\rworld')
  })

  it('should remove DEL character (0x7F)', () => {
    expect(stripControlChars('hello\x7Fworld')).toBe('helloworld')
  })

  it('should remove vertical tab and form feed', () => {
    expect(stripControlChars('a\x0Bb\x0Cc')).toBe('abc')
  })

  it('should handle empty string', () => {
    expect(stripControlChars('')).toBe('')
  })

  it('should handle string with no control characters', () => {
    expect(stripControlChars('Hello World!')).toBe('Hello World!')
  })
})

describe('normalizeUnicode', () => {
  it('should normalize composed characters to NFC', () => {
    // e + combining acute accent (NFD) -> e with acute (NFC)
    const nfd = 'e\u0301' // e + combining acute accent
    const nfc = '\u00E9' // e with acute
    expect(normalizeUnicode(nfd)).toBe(nfc)
  })

  it('should handle already normalized strings', () => {
    expect(normalizeUnicode('hello')).toBe('hello')
  })

  it('should handle Japanese characters', () => {
    const text = '\u3053\u3093\u306B\u3061\u306F' // konnichiwa in hiragana
    expect(normalizeUnicode(text)).toBe(text)
  })

  it('should handle empty string', () => {
    expect(normalizeUnicode('')).toBe('')
  })
})

describe('sanitizeText', () => {
  it('should trim whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello')
  })

  it('should remove control characters', () => {
    expect(sanitizeText('hello\x00world')).toBe('helloworld')
  })

  it('should normalize unicode', () => {
    const nfd = 'cafe\u0301' // cafe + combining acute
    expect(sanitizeText(nfd)).toBe('caf\u00E9') // cafe with e-acute
  })

  it('should apply all transformations', () => {
    const input = '  hello\x00world\u0301  '
    const result = sanitizeText(input)
    expect(result).not.toContain('\x00')
    expect(result).not.toMatch(/^\s/)
    expect(result).not.toMatch(/\s$/)
  })

  it('should preserve meaningful whitespace in middle', () => {
    expect(sanitizeText('hello world')).toBe('hello world')
  })

  it('should handle empty string', () => {
    expect(sanitizeText('')).toBe('')
  })

  it('should handle string with only whitespace', () => {
    expect(sanitizeText('   ')).toBe('')
  })
})

describe('isValidUrl', () => {
  it('should accept http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('should accept https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
  })

  it('should accept URLs with paths', () => {
    expect(isValidUrl('https://example.com/path/to/page')).toBe(true)
  })

  it('should accept URLs with query strings', () => {
    expect(isValidUrl('https://example.com?foo=bar&baz=qux')).toBe(true)
  })

  it('should accept URLs with ports', () => {
    expect(isValidUrl('https://example.com:8080/api')).toBe(true)
  })

  it('should reject javascript: URLs', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })

  it('should reject data: URLs', () => {
    expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('should reject vbscript: URLs', () => {
    expect(isValidUrl('vbscript:msgbox("xss")')).toBe(false)
  })

  it('should reject file: URLs', () => {
    expect(isValidUrl('file:///etc/passwd')).toBe(false)
  })

  it('should reject about: URLs', () => {
    expect(isValidUrl('about:blank')).toBe(false)
  })

  it('should reject blob: URLs', () => {
    expect(isValidUrl('blob:https://example.com/uuid')).toBe(false)
  })

  it('should reject invalid URL format', () => {
    expect(isValidUrl('not a url')).toBe(false)
  })

  it('should reject empty string', () => {
    expect(isValidUrl('')).toBe(false)
  })

  it('should reject relative paths', () => {
    expect(isValidUrl('/path/to/page')).toBe(false)
  })

  it('should reject protocol-relative URLs', () => {
    expect(isValidUrl('//example.com')).toBe(false)
  })
})

describe('getSafeUrl', () => {
  it('should return the URL for valid http URLs', () => {
    expect(getSafeUrl('http://example.com')).toBe('http://example.com')
  })

  it('should return the URL for valid https URLs', () => {
    expect(getSafeUrl('https://example.com')).toBe('https://example.com')
  })

  it('should return null for javascript: URLs', () => {
    expect(getSafeUrl('javascript:alert(1)')).toBeNull()
  })

  it('should return null for JAVASCRIPT: URLs (case insensitive)', () => {
    expect(getSafeUrl('JAVASCRIPT:alert(1)')).toBeNull()
  })

  it('should return null for JavaScript: URLs (mixed case)', () => {
    expect(getSafeUrl('JavaScript:alert(1)')).toBeNull()
  })

  it('should return null for data: URLs', () => {
    expect(getSafeUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(getSafeUrl('')).toBeNull()
  })

  it('should return null for null input', () => {
    // @ts-expect-error testing null input
    expect(getSafeUrl(null)).toBeNull()
  })

  it('should return null for undefined input', () => {
    // @ts-expect-error testing undefined input
    expect(getSafeUrl(undefined)).toBeNull()
  })

  it('should return null for non-string input', () => {
    // @ts-expect-error testing non-string input
    expect(getSafeUrl(123)).toBeNull()
  })

  it('should handle whitespace-padded javascript URLs', () => {
    expect(getSafeUrl('  javascript:alert(1)')).toBeNull()
  })
})

describe('sanitizeOptionalText', () => {
  it('should return null for null input', () => {
    expect(sanitizeOptionalText(null)).toBeNull()
  })

  it('should return undefined for undefined input', () => {
    expect(sanitizeOptionalText(undefined)).toBeUndefined()
  })

  it('should sanitize non-null string', () => {
    expect(sanitizeOptionalText('  hello\x00world  ')).toBe('helloworld')
  })

  it('should handle empty string', () => {
    expect(sanitizeOptionalText('')).toBe('')
  })
})

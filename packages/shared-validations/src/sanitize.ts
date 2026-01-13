/**
 * Sanitization utilities for input validation
 *
 * Provides functions to sanitize user input and validate URLs
 * to prevent XSS, control character injection, and other security issues.
 */

/**
 * Strips control characters from a string while preserving
 * common whitespace characters (newline, tab, carriage return)
 *
 * Control characters (0x00-0x1F and 0x7F) can cause display issues
 * and potential security problems in databases and rendering.
 *
 * @param str - The input string to sanitize
 * @returns The string with control characters removed
 */
export function stripControlChars(str: string): string {
  // Remove control characters except:
  // - \t (0x09) - tab
  // - \n (0x0A) - newline
  // - \r (0x0D) - carriage return
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Normalizes a string to Unicode NFC (Canonical Decomposition, followed by Canonical Composition)
 *
 * NFC normalization ensures consistent representation of characters,
 * which is important for:
 * - Search and comparison operations
 * - Database storage consistency
 * - Preventing homograph attacks
 *
 * @param str - The input string to normalize
 * @returns The NFC-normalized string
 */
export function normalizeUnicode(str: string): string {
  return str.normalize('NFC');
}

/**
 * Sanitizes text input by applying multiple transformations:
 * 1. Trims leading/trailing whitespace
 * 2. Strips control characters (preserving tabs and newlines)
 * 3. Normalizes Unicode to NFC form
 *
 * This function should be used for all user text inputs
 * such as entry terms, contexts, deck names, and descriptions.
 *
 * @param str - The input string to sanitize
 * @returns The sanitized string
 */
export function sanitizeText(str: string): string {
  return normalizeUnicode(stripControlChars(str.trim()));
}

/**
 * List of allowed URL protocols for external links
 * Only http and https are considered safe for user-facing links
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * List of dangerous URL protocols that should never be allowed
 * These can execute code or cause security issues when clicked
 */
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
  'blob:',
];

/**
 * Validates if a URL is safe to use in href attributes
 *
 * Only allows http:// and https:// URLs to prevent:
 * - javascript: protocol XSS attacks
 * - data: URL content injection
 * - Other potentially dangerous protocols
 *
 * @param url - The URL string to validate
 * @returns true if the URL is safe, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Returns a safe URL or null if the URL is invalid or dangerous
 *
 * This function should be used when rendering external links
 * to ensure only safe URLs are clickable.
 *
 * @param url - The URL string to validate
 * @returns The original URL if safe, null if dangerous or invalid
 *
 * @example
 * ```tsx
 * const safeUrl = getSafeUrl(link.url);
 * if (safeUrl) {
 *   return <a href={safeUrl}>Click here</a>;
 * }
 * ```
 */
export function getSafeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Quick check for obviously dangerous protocols (case-insensitive)
  const lowerUrl = url.toLowerCase().trim();
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lowerUrl.startsWith(protocol)) {
      return null;
    }
  }

  // Validate URL format and protocol
  if (isValidUrl(url)) {
    return url;
  }

  return null;
}

/**
 * Sanitizes text for use in optional/nullable fields
 * Returns null/undefined as-is, otherwise applies sanitization
 *
 * @param str - The input string to sanitize, or null/undefined
 * @returns The sanitized string, or null/undefined if input was null/undefined
 */
export function sanitizeOptionalText(
  str: string | null | undefined
): string | null | undefined {
  if (str === null || str === undefined) {
    return str;
  }
  return sanitizeText(str);
}

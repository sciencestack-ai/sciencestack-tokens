/**
 * Utility functions for arXiv ID validation and extraction
 */

/**
 * Validates if a string is a valid arXiv ID
 * @param id - The string to validate
 * @returns true if the string matches arXiv ID format
 *
 * Supports two formats:
 * - Old format: subject-class/YYMMnnn (e.g., math-ph/0301001)
 * - New format: YYMM.nnnnn[vN] (e.g., 2407.21783, 1234.56789v1)
 */
export const isValidArxivId = (id: string): boolean => {
  // arXiv ID formats:
  // Old format: subject-class/YYMMnnn[vN] (e.g., math-ph/0301001, math/0502125v1)
  // New format: YYMM.nnnnn[vN] (e.g., 2407.21783, 1234.56789v1)
  //   - 4 digits (YYMM)
  //   - dot
  //   - 4-5 digits (paper number, 5 digits is standard now)
  //   - optional: v followed by version number
  const oldFormat = /^[a-z-]+(\.[A-Z]{2})?\/\d{7}(v\d+)?$/;
  const newFormat = /^\d{4}\.\d{4,5}(v\d+)?$/;
  return oldFormat.test(id) || newFormat.test(id);
};

/**
 * Extracts arXiv ID from a string using pattern matching
 * @param text - The text to search for arXiv IDs
 * @returns The first valid arXiv ID found, or undefined
 *
 * Searches for patterns like:
 * - "arXiv:2407.21783"
 * - "arxiv:1234.56789v1"
 * - "arXiv preprint arXiv:2407.21783"
 * - "2407.21783" (if it's a valid arXiv ID)
 * - "math-ph/0301001"
 */
export const extractArxivId = (text: string): string | undefined => {
  if (!text) return undefined;

  // Pattern 1: Explicit arXiv prefix (case insensitive)
  // Matches: "arXiv:2407.21783", "arxiv:1234.56789v1", etc.
  const arxivPrefixPattern = /arxiv:\s*(\d{4}\.\d{4,5}(?:v\d+)?)/i;
  const prefixMatch = text.match(arxivPrefixPattern);
  if (prefixMatch && prefixMatch[1]) {
    return prefixMatch[1];
  }

  // Pattern 2: Old format with explicit arXiv prefix
  // Matches: "arXiv:math-ph/0301001", "arXiv:math/0502125v1"
  const arxivOldFormatPattern = /arxiv:\s*([a-z-]+(?:\.[A-Z]{2})?\/\d{7}(?:v\d+)?)/i;
  const oldFormatMatch = text.match(arxivOldFormatPattern);
  if (oldFormatMatch && oldFormatMatch[1]) {
    return oldFormatMatch[1];
  }

  // Pattern 3: New format anywhere in text (more permissive)
  // Matches: "2407.21783" or "1234.56789v1" as standalone
  const newFormatPattern = /\b(\d{4}\.\d{4,5}(?:v\d+)?)\b/;
  const newFormatMatch = text.match(newFormatPattern);
  if (newFormatMatch && newFormatMatch[1] && isValidArxivId(newFormatMatch[1])) {
    return newFormatMatch[1];
  }

  // Pattern 4: Old format anywhere in text
  // Matches: "math-ph/0301001", "math/0502125v1" as standalone
  const oldFormatAnywherePattern = /\b([a-z-]+(?:\.[A-Z]{2})?\/\d{7}(?:v\d+)?)\b/;
  const oldAnywhereMatch = text.match(oldFormatAnywherePattern);
  if (oldAnywhereMatch && oldAnywhereMatch[1] && isValidArxivId(oldAnywhereMatch[1])) {
    return oldAnywhereMatch[1];
  }

  return undefined;
};

/**
 * Encodes an arXiv ID for use in URLs
 * @param arxivId - The arXiv ID to encode
 * @returns URL-encoded arXiv ID
 *
 * Old-format arXiv IDs (e.g., "math/0502125v1") contain slashes that need
 * to be encoded as %2F for use in URL paths. New-format IDs are returned as-is.
 */
export const encodeArxivIdForUrl = (arxivId: string): string => {
  return encodeURIComponent(arxivId);
};

/**
 * Extracts arXiv ID from BibTeX fields
 * @param fields - BibTeX fields object
 * @returns The arXiv ID if found, or undefined
 *
 * Searches in order:
 * 1. eprint field (standard BibTeX field for arXiv)
 * 2. archiveprefix/eprinttype field (if it's arXiv)
 * 3. journal field (e.g., "arXiv preprint arXiv:1234.5678")
 * 4. note field
 * 5. url field
 */
export const extractArxivIdFromBibtexFields = (fields: Record<string, string>): string | undefined => {
  if (!fields) return undefined;

  // 1. Check eprint field (standard for arXiv)
  if (fields['eprint']) {
    const eprintValue = fields['eprint'];
    if (isValidArxivId(eprintValue)) {
      return eprintValue;
    }
  }

  // 2. Check archiveprefix/eprinttype to confirm it's arXiv
  const archivePrefix = fields['archiveprefix'] || fields['eprinttype'];
  if (archivePrefix && archivePrefix.toLowerCase().includes('arxiv') && fields['eprint']) {
    return fields['eprint'];
  }

  // 3. Check journal field (e.g., "ArXiv", "arXiv preprint arXiv:1234.5678")
  if (fields['journal']) {
    const extracted = extractArxivId(fields['journal']);
    if (extracted) return extracted;
  }

  // 4. Check note field
  if (fields['note']) {
    const extracted = extractArxivId(fields['note']);
    if (extracted) return extracted;
  }

  // 5. Check url field
  if (fields['url']) {
    const extracted = extractArxivId(fields['url']);
    if (extracted) return extracted;
  }

  return undefined;
};

/**
 * Normalizes an arXiv ID by removing the version suffix (e.g., "2301.12345v3" -> "2301.12345")
 * This ensures canonical URLs for papers regardless of version updates.
 *
 * @param arxivId - The arXiv ID, potentially with version suffix
 * @returns The normalized arXiv ID without version suffix
 */
export function normalizeArxivId(arxivId: string | null | undefined): string | null {
  if (!arxivId) return null;

  // Remove version suffix (vN where N is one or more digits)
  // Handles formats like: "2301.12345v3", "hep-th/9901001v2", "1234.5678v10"
  return arxivId.replace(/v\d+$/, '');
}

/**
 * MarkdownNormalizer - Text normalizer for Markdown content
 *
 * Handles Markdown-specific transformations that should be ignored when matching:
 * - Strips HTML comments <!-- ... -->
 * - Strips reference-style link definitions [id]: url
 * - Normalizes whitespace
 */

import { TextNormalizer, NormalizationResult } from './SpanMatcher';

/**
 * Patterns to strip from Markdown text during normalization.
 */
const STRIP_PATTERNS: RegExp[] = [
  // HTML comments: <!-- ... -->
  /<!--[\s\S]*?-->/g,
  // Reference-style link definitions at start of line: [id]: url "title"
  /^\s*\[[^\]]+\]:\s+\S+(?:\s+"[^"]*")?$/gm,
];

/**
 * Patterns to normalize (replace with standard form).
 */
const NORMALIZE_PATTERNS: Array<[RegExp, string]> = [
  // Normalize multiple spaces to single space
  [/  +/g, ' '],
  // Normalize multiple newlines to double newline (preserve paragraph breaks)
  [/\n{3,}/g, '\n\n'],
  // Normalize trailing whitespace on lines
  [/[ \t]+$/gm, ''],
];

/**
 * Build a position map that maps normalized positions back to original positions.
 */
function buildPositionMap(
  original: string,
  removals: Array<{ start: number; length: number }>
): { normalized: string; posMap: number[] } {
  // Sort removals by start position
  const sortedRemovals = [...removals].sort((a, b) => a.start - b.start);

  const posMap: number[] = [];
  let normalized = '';
  let origIndex = 0;
  let removalIndex = 0;

  while (origIndex < original.length) {
    // Check if we're at a removal point
    if (
      removalIndex < sortedRemovals.length &&
      origIndex === sortedRemovals[removalIndex].start
    ) {
      // Skip over the removed content
      origIndex += sortedRemovals[removalIndex].length;
      removalIndex++;
    } else {
      // Copy character and record position mapping
      posMap.push(origIndex);
      normalized += original[origIndex];
      origIndex++;
    }
  }

  return { normalized, posMap };
}

/**
 * MarkdownNormalizer strips and normalizes Markdown-specific syntax for better matching
 */
export const MarkdownNormalizer: TextNormalizer = {
  normalize(text: string): NormalizationResult {
    // Find all positions to remove
    const removals: Array<{ start: number; length: number }> = [];

    for (const pattern of STRIP_PATTERNS) {
      // Reset regex state
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        removals.push({ start: match.index, length: match[0].length });
      }
    }

    // Build initial position map with removals
    let { normalized, posMap } = buildPositionMap(text, removals);

    // Apply normalization patterns
    for (const [pattern, replacement] of NORMALIZE_PATTERNS) {
      const prevNormalized = normalized;
      normalized = normalized.replace(pattern, replacement);

      // Rebuild position map if length changed
      if (normalized.length !== prevNormalized.length) {
        const newPosMap: number[] = [];
        let origIdx = 0;
        let normIdx = 0;

        while (normIdx < normalized.length && origIdx < posMap.length) {
          if (normalized[normIdx] === prevNormalized[origIdx]) {
            newPosMap.push(posMap[origIdx]);
            normIdx++;
            origIdx++;
          } else {
            newPosMap.push(posMap[Math.min(origIdx, posMap.length - 1)]);
            normIdx++;
          }
        }

        while (normIdx < normalized.length) {
          newPosMap.push(posMap[posMap.length - 1] ?? text.length - 1);
          normIdx++;
        }

        posMap = newPosMap;
      }
    }

    return { normalized, posMap };
  },
};

export default MarkdownNormalizer;

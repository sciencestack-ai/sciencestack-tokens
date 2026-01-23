/**
 * LatexNormalizer - Text normalizer for LaTeX content
 *
 * Handles LaTeX-specific transformations that should be ignored when matching:
 * - Strips \label{...} commands
 * - Normalizes display math delimiters (\[...\] vs $$...$$)
 * - Normalizes whitespace around commands
 * - Strips comments
 */

import { TextNormalizer, NormalizationResult } from './SpanMatcher';

/**
 * Patterns to strip from LaTeX text during normalization.
 * Each pattern is removed and replaced with empty string.
 */
const STRIP_PATTERNS: RegExp[] = [
  // \label{...} commands
  /\\label\{[^}]*\}/g,
  // LaTeX comments (% to end of line, but not escaped \%)
  /(?<!\\)%[^\n]*/g,
];

/**
 * Patterns to normalize (replace with standard form).
 * [pattern, replacement]
 */
const NORMALIZE_PATTERNS: Array<[RegExp, string]> = [
  // Normalize display math: $$ ... $$ -> \[ ... \]
  [/\$\$([\s\S]*?)\$\$/g, '\\[$1\\]'],
  // Normalize multiple spaces to single space
  [/  +/g, ' '],
  // Normalize multiple newlines to double newline
  [/\n{3,}/g, '\n\n'],
];

/**
 * Build a position map that maps normalized positions back to original positions.
 * This tracks removals and keeps the mapping accurate.
 */
function buildPositionMap(
  original: string,
  removals: Array<{ start: number; length: number }>
): { normalized: string; posMap: number[] } {
  // Sort removals by start position (descending) for safe removal
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
 * LatexNormalizer strips and normalizes LaTeX-specific syntax for better matching
 */
export const LatexNormalizer: TextNormalizer = {
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

    // Apply normalization patterns that change content
    // For these, we rebuild the position map
    for (const [pattern, replacement] of NORMALIZE_PATTERNS) {
      // Track positions before and after normalization
      const newRemovals: Array<{ start: number; length: number }> = [];
      const additions: Array<{ pos: number; text: string }> = [];

      pattern.lastIndex = 0;
      let match;
      let offset = 0;

      while ((match = pattern.exec(normalized)) !== null) {
        const matchLen = match[0].length;
        const replaceLen = replacement.length;

        // For simplicity, we just do the replacement and accept
        // that position mapping becomes approximate for normalized sections
        if (matchLen !== replaceLen) {
          // Length changed - just do simple replacement
          // Position accuracy is reduced but excerpt matching still works
        }
      }

      // Apply the pattern replacement
      const prevNormalized = normalized;
      normalized = normalized.replace(pattern, replacement);

      // Rebuild position map if length changed
      if (normalized.length !== prevNormalized.length) {
        // Simple approach: rebuild map based on character-by-character comparison
        const newPosMap: number[] = [];
        let origIdx = 0;
        let normIdx = 0;

        while (normIdx < normalized.length && origIdx < posMap.length) {
          if (normalized[normIdx] === prevNormalized[origIdx]) {
            // Character matches, keep mapping
            newPosMap.push(posMap[origIdx]);
            normIdx++;
            origIdx++;
          } else {
            // Characters differ - normalization changed this region
            // Map to the start of the original region
            newPosMap.push(posMap[Math.min(origIdx, posMap.length - 1)]);
            normIdx++;
          }
        }

        // Handle any remaining characters
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

export default LatexNormalizer;

/**
 * LatexNormalizer - Text normalizer for LaTeX content
 *
 * Handles LaTeX-specific transformations that should be ignored when matching:
 * - Strips \label{...} commands
 * - Normalizes display math delimiters (\[...\] vs $$...$$)
 * - Normalizes all whitespace (newlines, tabs, spaces) to single space
 * - Strips comments
 */

import { TextNormalizer, NormalizationResult } from './SpanMatcher';
import {
  NormalizerOptions,
  applyRemovals,
  applyReplacements,
  normalizeWhitespace,
} from './normalizeWhitespace';

/**
 * Patterns to strip from LaTeX text during normalization.
 */
const STRIP_PATTERNS: RegExp[] = [
  // \label{...} commands
  /\\label\{[^}]*\}/g,
  // LaTeX comments (% to end of line, but not escaped \%)
  /(?<!\\)%[^\n]*/g,
];

/**
 * Patterns to normalize (replace with standard form).
 */
const NORMALIZE_PATTERNS: Array<[RegExp, string]> = [
  // Normalize display math: $$ ... $$ -> \[ ... \]
  [/\$\$([\s\S]*?)\$\$/g, '\\[$1\\]'],
];

/**
 * Create a LaTeX normalizer with custom options
 */
export function createLatexNormalizer(options?: NormalizerOptions): TextNormalizer {
  return {
    normalize(text: string): NormalizationResult {
      // Step 1: Remove stripped patterns
      let { text: current, posMap } = applyRemovals(text, STRIP_PATTERNS);

      // Step 2: Apply replacements
      ({ text: current, posMap } = applyReplacements(current, posMap, NORMALIZE_PATTERNS));

      // Step 3: Normalize whitespace (this is the key fix for newline handling)
      const result = normalizeWhitespace(current, posMap, options);

      return { normalized: result.normalized, posMap: result.posMap };
    },
  };
}

/**
 * Default LatexNormalizer - normalizes whitespace but doesn't strip it all
 */
export const LatexNormalizer: TextNormalizer = createLatexNormalizer();

export default LatexNormalizer;

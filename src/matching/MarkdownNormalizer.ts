/**
 * MarkdownNormalizer - Text normalizer for Markdown content
 *
 * Handles Markdown-specific transformations that should be ignored when matching:
 * - Strips HTML comments <!-- ... -->
 * - Strips reference-style link definitions [id]: url
 * - Normalizes all whitespace (newlines, tabs, spaces) to single space
 */

import { TextNormalizer, NormalizationResult } from './SpanMatcher';
import {
  NormalizerOptions,
  applyRemovals,
  normalizeWhitespace,
} from './normalizeWhitespace';

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
 * Create a Markdown normalizer with custom options
 */
export function createMarkdownNormalizer(options?: NormalizerOptions): TextNormalizer {
  return {
    normalize(text: string): NormalizationResult {
      // Step 1: Remove stripped patterns
      let { text: current, posMap } = applyRemovals(text, STRIP_PATTERNS);

      // Step 2: Normalize whitespace
      const result = normalizeWhitespace(current, posMap, options);

      return { normalized: result.normalized, posMap: result.posMap };
    },
  };
}

/**
 * Default MarkdownNormalizer - normalizes whitespace but doesn't strip it all
 */
export const MarkdownNormalizer: TextNormalizer = createMarkdownNormalizer();

export default MarkdownNormalizer;

/**
 * Matching utilities for finding text excerpts in AST node spans
 */

export {
  SpanMatcher,
  SpanInfo,
  MatchResult,
  TextNormalizer,
  NormalizationResult,
} from './SpanMatcher';

export { LatexNormalizer, createLatexNormalizer } from './LatexNormalizer';
export { MarkdownNormalizer, createMarkdownNormalizer } from './MarkdownNormalizer';
export { NormalizerOptions } from './normalizeWhitespace';

/**
 * SpanMatcher - Utility for matching text excerpts to AST node spans
 *
 * Works with the output of toLatexWithSpans / toMarkdownWithSpans to find
 * which nodes contain a given text excerpt.
 */

/**
 * Information about a span in the exported content
 */
export interface SpanInfo {
  start: number;
  end: number;
  type: string;
}

/**
 * Result of matching an excerpt to nodes
 */
export interface MatchResult {
  /** The node ID that matched */
  nodeId: string;
  /** The token type of the matched node */
  nodeType: string;
  /** Whether this node contains the start, end, or entire match */
  matchType: 'start' | 'end' | 'single' | 'contains';
  /** Character offset within the node where the match begins (for start/single) or ends (for end) */
  offset?: number;
}

/**
 * Interface for text normalization to handle format-specific transformations
 * before matching. Normalization should preserve the ability to map back
 * to original positions.
 */
export interface TextNormalizer {
  /**
   * Normalize text for matching purposes
   * @param text - The original text
   * @returns Object with normalized text and position map from normalized -> original positions
   */
  normalize(text: string): NormalizationResult;
}

export interface NormalizationResult {
  /** The normalized text */
  normalized: string;
  /**
   * Position map: posMap[normalizedIndex] = originalIndex
   * Maps each character position in normalized text back to original text
   */
  posMap: number[];
}

/**
 * SpanMatcher finds which AST nodes contain given text excerpts
 */
export class SpanMatcher {
  private sortedSpans: Array<{ nodeId: string; span: SpanInfo }>;
  private normalizedText: string;
  private posMap: number[];

  /**
   * Create a SpanMatcher
   * @param spans - Map of node IDs to their span info from *WithSpans() output
   * @param fullText - The full exported text content
   * @param normalizer - Optional text normalizer for format-specific preprocessing
   */
  constructor(
    private spans: Map<string, SpanInfo>,
    private fullText: string,
    private normalizer?: TextNormalizer
  ) {
    // Pre-sort spans by start position for efficient lookup
    this.sortedSpans = Array.from(spans.entries())
      .map(([nodeId, span]) => ({ nodeId, span }))
      .sort((a, b) => a.span.start - b.span.start);

    // Apply normalization if provided
    if (normalizer) {
      const result = normalizer.normalize(fullText);
      this.normalizedText = result.normalized;
      this.posMap = result.posMap;
    } else {
      this.normalizedText = fullText;
      this.posMap = Array.from({ length: fullText.length }, (_, i) => i);
    }
  }

  /**
   * Find the node containing a specific position in the text
   * @param pos - Character position in the original (non-normalized) text
   * @returns The span info with nodeId, or null if no node contains this position
   */
  findNodeAtPosition(pos: number): (SpanInfo & { nodeId: string }) | null {
    // Find the smallest (most specific) span containing this position
    let bestMatch: { nodeId: string; span: SpanInfo } | null = null;

    for (const { nodeId, span } of this.sortedSpans) {
      if (pos >= span.start && pos < span.end) {
        // Prefer smaller (more specific) spans
        if (!bestMatch || (span.end - span.start) < (bestMatch.span.end - bestMatch.span.start)) {
          bestMatch = { nodeId, span };
        }
      }
    }

    if (bestMatch) {
      return { ...bestMatch.span, nodeId: bestMatch.nodeId };
    }
    return null;
  }

  /**
   * Find all nodes at a position, from most specific to least specific
   * @param pos - Character position in the original (non-normalized) text
   * @returns Array of matching spans, sorted by size (smallest first)
   */
  findAllNodesAtPosition(pos: number): Array<SpanInfo & { nodeId: string }> {
    const matches: Array<{ nodeId: string; span: SpanInfo }> = [];

    for (const { nodeId, span } of this.sortedSpans) {
      if (pos >= span.start && pos < span.end) {
        matches.push({ nodeId, span });
      }
    }

    // Sort by span size (smallest = most specific first)
    matches.sort((a, b) => (a.span.end - a.span.start) - (b.span.end - b.span.start));

    return matches.map(({ nodeId, span }) => ({ ...span, nodeId }));
  }

  /**
   * Match an excerpt of text to find which nodes contain it
   * @param excerpt - The text excerpt to find
   * @param options - Match options
   * @returns Array of MatchResults describing which nodes contain the excerpt
   */
  matchExcerpt(
    excerpt: string,
    options?: {
      /** If true, use normalized text for matching */
      useNormalization?: boolean;
      /** If true, find all occurrences instead of just the first */
      findAll?: boolean;
    }
  ): MatchResult[] {
    const useNorm = options?.useNormalization ?? !!this.normalizer;
    const findAll = options?.findAll ?? false;

    // Normalize the excerpt if using normalization
    let searchExcerpt = excerpt;
    let excerptPosMap: number[] | null = null;
    if (useNorm && this.normalizer) {
      const result = this.normalizer.normalize(excerpt);
      searchExcerpt = result.normalized;
      excerptPosMap = result.posMap;
    }

    const searchText = useNorm ? this.normalizedText : this.fullText;
    const results: MatchResult[] = [];
    let searchStart = 0;

    while (true) {
      const matchIndex = searchText.indexOf(searchExcerpt, searchStart);
      if (matchIndex === -1) break;

      // Map back to original positions if using normalization
      const originalStart = useNorm ? this.posMap[matchIndex] : matchIndex;
      const originalEnd = useNorm
        ? this.posMap[matchIndex + searchExcerpt.length - 1] + 1
        : matchIndex + excerpt.length;

      // Find nodes that contain this range
      const matchResults = this.findNodesForRange(originalStart, originalEnd);
      results.push(...matchResults);

      if (!findAll) break;
      searchStart = matchIndex + 1;
    }

    return results;
  }

  /**
   * Find nodes that overlap with a given range in the original text
   */
  private findNodesForRange(start: number, end: number): MatchResult[] {
    const results: MatchResult[] = [];
    const matchingNodes: Array<{ nodeId: string; span: SpanInfo }> = [];

    // Find all spans that overlap with this range
    for (const { nodeId, span } of this.sortedSpans) {
      const overlaps = span.start < end && span.end > start;
      if (overlaps) {
        matchingNodes.push({ nodeId, span });
      }
    }

    // Sort by span size to get most specific nodes first
    matchingNodes.sort((a, b) => (a.span.end - a.span.start) - (b.span.end - b.span.start));

    // Determine match type for each node
    for (const { nodeId, span } of matchingNodes) {
      const containsStart = start >= span.start && start < span.end;
      const containsEnd = end > span.start && end <= span.end;

      let matchType: MatchResult['matchType'];
      let offset: number | undefined;

      if (containsStart && containsEnd) {
        // Node fully contains the match
        matchType = 'single';
        offset = start - span.start;
      } else if (containsStart) {
        // Match starts in this node but extends beyond
        matchType = 'start';
        offset = start - span.start;
      } else if (containsEnd) {
        // Match ends in this node but started before
        matchType = 'end';
        offset = end - span.start;
      } else {
        // Match spans across this entire node
        matchType = 'contains';
      }

      results.push({
        nodeId,
        nodeType: span.type,
        matchType,
        offset,
      });
    }

    return results;
  }

  /**
   * Get the original text for a given node
   * @param nodeId - The node ID
   * @returns The text content of that node, or null if not found
   */
  getNodeText(nodeId: string): string | null {
    const span = this.spans.get(nodeId);
    if (!span) return null;
    return this.fullText.slice(span.start, span.end);
  }

  /**
   * Get the span info for a given node
   * @param nodeId - The node ID
   * @returns The span info, or null if not found
   */
  getSpan(nodeId: string): SpanInfo | null {
    return this.spans.get(nodeId) ?? null;
  }
}

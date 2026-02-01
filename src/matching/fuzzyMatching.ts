/**
 * Fuzzy text matching algorithms for mapping LLM-generated excerpts to AST nodes
 *
 * Provides fuzzy matching with multiple fallback strategies:
 * 1. Exact match via SpanMatcher
 * 2. Ellipsis-split partial matching
 * 3. Fuzzy LCS-based matching with position mapping
 */

import { SpanMatcher, MatchResult } from "./SpanMatcher";
import { LEAF_TOKEN_TYPES } from "../types";

// ============================================================================
// Text Normalization & Similarity (internal)
// ============================================================================

/**
 * Normalize text for fuzzy comparison.
 * Lowercases, removes punctuation, collapses whitespace.
 */
export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate similarity ratio between two strings (0-1).
 * Uses longest common subsequence ratio.
 */
export function similarity(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;
  if (a === b) return 1;

  const m = a.length;
  const n = b.length;

  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
  }

  const lcsLength = prev[n];
  return (2 * lcsLength) / (m + n);
}

/**
 * Build position mapping from normalized string positions to original positions.
 * Returns array where posMap[normIndex] = originalIndex.
 */
export function buildPositionMap(original: string): number[] {
  const posMap: number[] = [];
  let inWhitespace = false;

  for (let i = 0; i < original.length; i++) {
    const char = original[i].toLowerCase();
    const isAlphaNum = /[a-z0-9]/.test(char);
    const isSpace = /\s/.test(char);

    if (isAlphaNum) {
      posMap.push(i);
      inWhitespace = false;
    } else if (isSpace && !inWhitespace && posMap.length > 0) {
      posMap.push(i);
      inWhitespace = true;
    }
  }

  // Trim trailing whitespace
  while (posMap.length > 0 && /\s/.test(original[posMap[posMap.length - 1]])) {
    posMap.pop();
  }

  return posMap;
}

// ============================================================================
// Fuzzy Matching
// ============================================================================

/**
 * Find best fuzzy match position in content for excerpt
 */
export function findFuzzyMatch(
  content: string,
  excerpt: string,
  threshold = 0.7
): { start: number; end: number; score: number } | null {
  const normExcerpt = normalizeForComparison(excerpt);
  if (normExcerpt.length < 10) return null;

  const normContent = normalizeForComparison(content);
  const posMap = buildPositionMap(content);

  const windowSize = normExcerpt.length;
  const tolerance = Math.floor(windowSize * 0.3);

  let bestScore = 0;
  let bestStart = -1;
  let bestEnd = -1;

  for (let size = windowSize - tolerance; size <= windowSize + tolerance; size++) {
    if (size > normContent.length) continue;

    for (let i = 0; i <= normContent.length - size; i += Math.max(1, Math.floor(size / 10))) {
      const window = normContent.slice(i, i + size);
      const score = similarity(normExcerpt, window);

      if (score > bestScore) {
        bestScore = score;
        bestStart = i;
        bestEnd = i + size;
      }

      if (score > 0.95) break;
    }
    if (bestScore > 0.95) break;
  }

  if (bestScore >= threshold && bestStart >= 0 && bestEnd <= posMap.length) {
    // Map normalized positions back to original using the position map
    let origStart = posMap[bestStart] ?? 0;
    const origEnd = posMap[Math.min(bestEnd - 1, posMap.length - 1)] ?? content.length;

    // Refine start position: fuzzy match may include leading chars that aren't in excerpt
    // Look for the first word of the excerpt in the matched range
    const firstWord = excerpt.trim().split(/\s+/)[0];
    if (firstWord && firstWord.length >= 3) {
      const refinedStart = content.indexOf(firstWord, origStart);
      if (refinedStart >= 0 && refinedStart < origEnd && refinedStart - origStart < 20) {
        origStart = refinedStart;
      }
    }

    return {
      start: origStart,
      end: origEnd,
      score: bestScore,
    };
  }

  return null;
}

// ============================================================================
// Ellipsis Handling (internal)
// ============================================================================

/**
 * Split excerpt on ellipsis markers
 */
function splitOnEllipsis(excerpt: string): string[] {
  return excerpt
    .split(/\.{3,}|\u2026/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

// ============================================================================
// SpanMatcher Integration
// ============================================================================

/**
 * Build MatchResult array from a fuzzy-matched range
 * Finds all nodes overlapping the range and returns them with proper matchType
 */
function buildMatchesFromRange(
  matcher: SpanMatcher,
  start: number,
  end: number
): MatchResult[] {
  const results: MatchResult[] = [];

  // Find nodes at start and end positions
  const startNodes = matcher.findAllNodesAtPosition(start);
  const endNodes = matcher.findAllNodesAtPosition(end > 0 ? end - 1 : end);

  // Add start node (smallest/most specific first)
  if (startNodes.length > 0) {
    const node = startNodes[0];
    results.push({
      nodeId: node.nodeId,
      nodeType: node.type,
      matchType: "start",
      offset: start - node.start,
    });
  }

  // Add end node if different from start
  if (endNodes.length > 0) {
    const node = endNodes[0];
    if (results.length === 0 || node.nodeId !== results[0].nodeId) {
      results.push({
        nodeId: node.nodeId,
        nodeType: node.type,
        matchType: "end",
        offset: end - node.start,
      });
    } else if (results.length === 1) {
      // Same node - mark as single
      results[0].matchType = "single";
    }
  }

  return results;
}

/**
 * Filter match results to only leaf text tokens and return start/end range
 * Returns at most 2 results: the start node and end node (or just one for single matches)
 */
export function filterToLeafRange(matches: MatchResult[]): MatchResult[] {
  if (matches.length === 0) return [];

  // Filter to only nodes that are actual leaf tokens (not containers)
  const leafMatches = matches.filter((m) => {
    // Skip 'contains' matches - those are parent containers
    if (m.matchType === "contains") return false;
    // Only include leaf token types
    return LEAF_TOKEN_TYPES.has(m.nodeType);
  });

  // If no leaf matches found, try to get the smallest nodes with start/end/single
  const candidates =
    leafMatches.length > 0
      ? leafMatches
      : matches.filter((m) => m.matchType !== "contains");

  if (candidates.length === 0) return [];

  // Find start and end nodes
  const startNode = candidates.find((m) => m.matchType === "start" || m.matchType === "single");
  const endNode = candidates.find((m) => m.matchType === "end");

  // Return just start/end (1-2 nodes)
  if (startNode && endNode && startNode.nodeId !== endNode.nodeId) {
    return [startNode, endNode];
  }
  if (startNode) {
    return [startNode];
  }
  // Fallback: return smallest match (first in sorted array)
  return [candidates[0]];
}

/**
 * Try matching excerpt with multiple fallback strategies:
 * 1. Exact match via SpanMatcher
 * 2. Ellipsis-split partial matching
 * 3. Fuzzy LCS-based matching (if content provided)
 *
 * @param matcher - SpanMatcher instance
 * @param excerpt - Text excerpt to find (caller should preprocess/clean as needed)
 * @param content - Full text content for fuzzy matching (optional)
 */
export function matchExcerptWithFallback(
  matcher: SpanMatcher,
  excerpt: string,
  content?: string
): MatchResult[] {
  // Strategy 1: Try exact match first
  const fullMatch = matcher.matchExcerpt(excerpt);
  if (fullMatch.length > 0) return filterToLeafRange(fullMatch);

  // Strategy 2: Split on ellipsis and try each part
  const parts = splitOnEllipsis(excerpt);
  for (const part of parts) {
    const partMatch = matcher.matchExcerpt(part);
    if (partMatch.length > 0) return filterToLeafRange(partMatch);
  }

  // Strategy 3: Fuzzy match (if content provided)
  if (content) {
    const fuzzyResult = findFuzzyMatch(content, excerpt);
    if (fuzzyResult) {
      const matches = buildMatchesFromRange(matcher, fuzzyResult.start, fuzzyResult.end);
      if (matches.length > 0) return filterToLeafRange(matches);
    }

    for (const part of parts) {
      const partFuzzy = findFuzzyMatch(content, part);
      if (partFuzzy) {
        const matches = buildMatchesFromRange(matcher, partFuzzy.start, partFuzzy.end);
        if (matches.length > 0) return filterToLeafRange(matches);
      }
    }
  }

  return [];
}

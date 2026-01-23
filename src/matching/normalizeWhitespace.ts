/**
 * Shared whitespace normalization utilities for all normalizers
 */

import { NormalizationResult } from './SpanMatcher';

export interface NormalizerOptions {
  /** Remove ALL whitespace for aggressive matching (default: false) */
  stripAllWhitespace?: boolean;
}

/**
 * Normalize whitespace in text, building position map.
 * By default: collapses all whitespace (spaces, tabs, newlines) to single space.
 * With stripAllWhitespace: removes all whitespace entirely.
 */
export function normalizeWhitespace(
  text: string,
  posMap: number[],
  options?: NormalizerOptions
): { normalized: string; posMap: number[] } {
  const stripAll = options?.stripAllWhitespace ?? false;
  const newPosMap: number[] = [];
  let normalized = '';
  let i = 0;
  let lastWasSpace = false;

  while (i < text.length) {
    const char = text[i];
    const isWhitespace = /\s/.test(char);

    if (isWhitespace) {
      if (stripAll) {
        // Skip all whitespace
        i++;
        continue;
      } else {
        // Collapse to single space
        if (!lastWasSpace) {
          newPosMap.push(posMap[i]);
          normalized += ' ';
          lastWasSpace = true;
        }
        i++;
        continue;
      }
    }

    // Non-whitespace character
    newPosMap.push(posMap[i]);
    normalized += char;
    lastWasSpace = false;
    i++;
  }

  return { normalized, posMap: newPosMap };
}

/**
 * Build initial position map (identity map)
 */
export function buildIdentityPosMap(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}

/**
 * Apply regex removals and build position map
 */
export function applyRemovals(
  text: string,
  patterns: RegExp[]
): { text: string; posMap: number[] } {
  const removals: Array<{ start: number; length: number }> = [];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      removals.push({ start: match.index, length: match[0].length });
    }
  }

  // Sort by start position
  removals.sort((a, b) => a.start - b.start);

  const posMap: number[] = [];
  let normalized = '';
  let origIndex = 0;
  let removalIndex = 0;

  while (origIndex < text.length) {
    if (
      removalIndex < removals.length &&
      origIndex === removals[removalIndex].start
    ) {
      origIndex += removals[removalIndex].length;
      removalIndex++;
    } else {
      posMap.push(origIndex);
      normalized += text[origIndex];
      origIndex++;
    }
  }

  return { text: normalized, posMap };
}

/**
 * Apply regex replacements, updating position map approximately
 */
export function applyReplacements(
  text: string,
  posMap: number[],
  patterns: Array<[RegExp, string]>
): { text: string; posMap: number[] } {
  let currentText = text;
  let currentPosMap = posMap;

  for (const [pattern, replacement] of patterns) {
    const prevText = currentText;
    currentText = currentText.replace(pattern, replacement);

    if (currentText.length !== prevText.length) {
      // Rebuild position map approximately
      const newPosMap: number[] = [];
      let origIdx = 0;
      let normIdx = 0;

      while (normIdx < currentText.length && origIdx < currentPosMap.length) {
        if (currentText[normIdx] === prevText[origIdx]) {
          newPosMap.push(currentPosMap[origIdx]);
          normIdx++;
          origIdx++;
        } else {
          newPosMap.push(currentPosMap[Math.min(origIdx, currentPosMap.length - 1)]);
          normIdx++;
        }
      }

      while (normIdx < currentText.length) {
        newPosMap.push(currentPosMap[currentPosMap.length - 1] ?? 0);
        normIdx++;
      }

      currentPosMap = newPosMap;
    }
  }

  return { text: currentText, posMap: currentPosMap };
}

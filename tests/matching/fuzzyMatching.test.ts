import { describe, it, expect } from "vitest";
import {
  normalizeForComparison,
  similarity,
  filterToLeafRange,
  buildPositionMap,
} from "../../src/matching/fuzzyMatching";
import { TokenType } from "../../src/types";

describe("normalizeForComparison", () => {
  it("lowercases text", () => {
    expect(normalizeForComparison("Hello World")).toBe("hello world");
  });

  it("removes punctuation", () => {
    expect(normalizeForComparison("Hello, world!")).toBe("hello world");
  });

  it("collapses whitespace", () => {
    expect(normalizeForComparison("hello   world")).toBe("hello world");
  });

  it("handles LaTeX-like content", () => {
    expect(normalizeForComparison("Let $x = 5$")).toBe("let x 5");
  });

  it("trims whitespace", () => {
    expect(normalizeForComparison("  hello  ")).toBe("hello");
  });
});

describe("similarity", () => {
  it("returns 1 for identical strings", () => {
    expect(similarity("hello", "hello")).toBe(1);
  });

  it("returns 0 for empty strings", () => {
    expect(similarity("", "hello")).toBe(0);
    expect(similarity("hello", "")).toBe(0);
  });

  it("returns high score for similar strings", () => {
    const score = similarity("hello world", "hello worlds");
    expect(score).toBeGreaterThan(0.9);
  });

  it("returns low score for different strings", () => {
    const score = similarity("hello", "goodbye");
    expect(score).toBeLessThan(0.5);
  });

  it("handles substring relationships", () => {
    const score = similarity("theorem", "theorem 3.1");
    expect(score).toBeGreaterThan(0.5);
  });
});

describe("filterToLeafRange", () => {
  it("returns empty array for empty input", () => {
    expect(filterToLeafRange([])).toEqual([]);
  });

  it("filters out container matches (matchType: contains) and preserves offset", () => {
    const matches = [
      { nodeId: "sec:4:6:35:0", nodeType: TokenType.TEXT, matchType: "single" as const, offset: 42 },
      { nodeId: "sec:4:6:35", nodeType: TokenType.GROUP, matchType: "contains" as const },
      { nodeId: "sec:4:6", nodeType: TokenType.SECTION, matchType: "contains" as const },
      { nodeId: "sec:4", nodeType: TokenType.SECTION, matchType: "contains" as const },
    ];
    const result = filterToLeafRange(matches);
    expect(result).toHaveLength(1);
    expect(result[0].nodeId).toBe("sec:4:6:35:0");
    expect(result[0].offset).toBe(42);
  });

  it("returns only start and end nodes with their offsets preserved", () => {
    const matches = [
      { nodeId: "sec:4:6:31:0", nodeType: TokenType.TEXT, matchType: "start" as const, offset: 5 },
      { nodeId: "sec:4:6:32:0", nodeType: TokenType.TEXT, matchType: "contains" as const },
      { nodeId: "sec:4:6:33:0", nodeType: TokenType.TEXT, matchType: "contains" as const },
      { nodeId: "sec:4:6:35:0", nodeType: TokenType.TEXT, matchType: "end" as const, offset: 10 },
      { nodeId: "sec:4:6", nodeType: TokenType.SECTION, matchType: "contains" as const },
    ];
    const result = filterToLeafRange(matches);
    expect(result).toHaveLength(2);
    expect(result[0].nodeId).toBe("sec:4:6:31:0");
    expect(result[0].offset).toBe(5);
    expect(result[1].nodeId).toBe("sec:4:6:35:0");
    expect(result[1].offset).toBe(10);
  });

  it("returns single node for single match type", () => {
    const matches = [
      { nodeId: "sec:4:6:35:0", nodeType: TokenType.TEXT, matchType: "single" as const, offset: 0 },
      { nodeId: "sec:4:6:35", nodeType: TokenType.GROUP, matchType: "contains" as const },
    ];
    const result = filterToLeafRange(matches);
    expect(result).toHaveLength(1);
    expect(result[0].nodeId).toBe("sec:4:6:35:0");
  });

  it("includes equation nodes as leaf nodes", () => {
    const matches = [
      { nodeId: "sec:4:6:35:0", nodeType: TokenType.EQUATION, matchType: "single" as const, offset: 0 },
      { nodeId: "sec:4:6", nodeType: TokenType.SECTION, matchType: "contains" as const },
    ];
    const result = filterToLeafRange(matches);
    expect(result).toHaveLength(1);
    expect(result[0].nodeType).toBe(TokenType.EQUATION);
  });

  it("includes equation_array nodes as leaf nodes", () => {
    const matches = [
      { nodeId: "sec:4:6:35:0", nodeType: TokenType.EQUATION_ARRAY, matchType: "single" as const, offset: 0 },
      { nodeId: "sec:4:6", nodeType: TokenType.SECTION, matchType: "contains" as const },
    ];
    const result = filterToLeafRange(matches);
    expect(result).toHaveLength(1);
    expect(result[0].nodeType).toBe(TokenType.EQUATION_ARRAY);
  });

  it("includes code nodes as leaf nodes", () => {
    const matches = [
      { nodeId: "sec:4:6:35:0", nodeType: TokenType.CODE, matchType: "single" as const, offset: 0 },
      { nodeId: "sec:4:6", nodeType: TokenType.SECTION, matchType: "contains" as const },
    ];
    const result = filterToLeafRange(matches);
    expect(result).toHaveLength(1);
    expect(result[0].nodeType).toBe(TokenType.CODE);
  });

  it("includes ref nodes as leaf nodes", () => {
    const matches = [
      { nodeId: "sec:4:6:23", nodeType: TokenType.REF, matchType: "single" as const, offset: 0 },
      { nodeId: "sec:4:6", nodeType: TokenType.SECTION, matchType: "contains" as const },
    ];
    const result = filterToLeafRange(matches);
    expect(result).toHaveLength(1);
    expect(result[0].nodeType).toBe(TokenType.REF);
  });

  it("includes citation nodes as leaf nodes", () => {
    const matches = [
      { nodeId: "sec:4:6:23", nodeType: TokenType.CITATION, matchType: "single" as const, offset: 0 },
      { nodeId: "sec:4:6", nodeType: TokenType.SECTION, matchType: "contains" as const },
    ];
    const result = filterToLeafRange(matches);
    expect(result).toHaveLength(1);
    expect(result[0].nodeType).toBe(TokenType.CITATION);
  });

  it("falls back to smallest non-contains match if no leaf types found", () => {
    const matches = [
      { nodeId: "sec:4:6:35", nodeType: TokenType.CAPTION, matchType: "single" as const, offset: 0 },
      { nodeId: "sec:4:6", nodeType: TokenType.SECTION, matchType: "contains" as const },
    ];
    const result = filterToLeafRange(matches);
    expect(result).toHaveLength(1);
    expect(result[0].nodeId).toBe("sec:4:6:35");
  });
});

describe("buildPositionMap", () => {
  it("maps simple text positions correctly", () => {
    const text = "hello world";
    const posMap = buildPositionMap(text);
    expect(posMap.length).toBe(11);
    expect(posMap[0]).toBe(0); // 'h'
    expect(posMap[5]).toBe(5); // space
    expect(posMap[6]).toBe(6); // 'w'
  });

  it("handles punctuation removal correctly", () => {
    const text = "hello, world!";
    const posMap = buildPositionMap(text);
    // normalized: "hello world" (11 chars)
    expect(posMap.length).toBe(11);
    expect(posMap[0]).toBe(0);  // 'h'
    expect(posMap[4]).toBe(4);  // 'o'
    expect(posMap[5]).toBe(6);  // space (after comma)
    expect(posMap[6]).toBe(7);  // 'w'
  });

  it("collapses multiple whitespace into single position", () => {
    const text = "hello   world";
    const posMap = buildPositionMap(text);
    // normalized: "hello world" (11 chars)
    expect(posMap.length).toBe(11);
    expect(posMap[5]).toBe(5);  // first space
    expect(posMap[6]).toBe(8);  // 'w' (after 3 spaces)
  });

  it("handles LaTeX-like content with math symbols", () => {
    const text = "Hence $x = 5$";
    const posMap = buildPositionMap(text);
    // normalized: "hence x 5" (9 chars)
    expect(posMap.length).toBe(9);
    expect(posMap[0]).toBe(0);  // 'H'
    expect(posMap[5]).toBe(5);  // space after Hence
    expect(posMap[6]).toBe(7);  // 'x'
  });

  it("handles complex LaTeX with display math", () => {
    const text = "Hence\n$$\n\\|T\\|=5\n$$";
    const posMap = buildPositionMap(text);
    const normalized = normalizeForComparison(text);
    expect(normalized).toBe("hence t5");
    expect(posMap.length).toBe(8);
    expect(posMap[0]).toBe(0);  // 'H'
    expect(posMap[5]).toBe(5);  // '\n' (space)
    expect(posMap[6]).toBe(11); // 'T'
    expect(posMap[7]).toBe(15); // '5'
  });

  it("maps normalized positions back to original content correctly", () => {
    const text = "Translation covariance gives $\\|T_{g_m}\\|=c_m$. Hence";
    const posMap = buildPositionMap(text);
    const normalized = normalizeForComparison(text);

    const henceIdx = normalized.indexOf("hence");
    expect(henceIdx).toBeGreaterThan(0);

    const origPos = posMap[henceIdx];
    expect(text[origPos].toLowerCase()).toBe("h");
  });

  it("position mapping is consistent with normalizeForComparison", () => {
    const testCases = [
      "Hello, world!",
      "Let $x = 5$ be defined",
      "Hence\n$$\nf(x) = x^2\n$$\nfor all $x$.",
      "Proposition \\ref{prop:main} yields $C_0$.",
    ];

    for (const text of testCases) {
      const posMap = buildPositionMap(text);
      const normalized = normalizeForComparison(text);

      expect(posMap.length).toBe(normalized.length);

      for (let i = 0; i < posMap.length; i++) {
        const origChar = text[posMap[i]].toLowerCase();
        const normChar = normalized[i];
        const isMatch = origChar === normChar || (/\s/.test(origChar) && normChar === " ");
        expect(isMatch).toBe(true);
      }
    }
  });
});

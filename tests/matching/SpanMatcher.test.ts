import { describe, it, expect } from "vitest";
import {
  SpanMatcher,
  SpanInfo,
  LatexNormalizer,
  MarkdownNormalizer,
} from "../../src/matching";
import { TokenExporter } from "../../src/TokenExporter";
import { TokenNodeFactory } from "../../src/base/TokenNodeFactory";
import { TokenType, TextToken, SectionToken, ReferenceToken } from "../../src/types";

describe("SpanMatcher", () => {
  describe("findNodeAtPosition", () => {
    it("should find the node containing a position", () => {
      const spans = new Map<string, SpanInfo>([
        ["node-1", { start: 0, end: 6, type: "text" }],
        ["node-2", { start: 6, end: 11, type: "text" }],
      ]);
      const fullText = "Hello World";

      const matcher = new SpanMatcher(spans, fullText);

      // Position in first node
      const result1 = matcher.findNodeAtPosition(3);
      expect(result1).toBeDefined();
      expect(result1!.nodeId).toBe("node-1");
      expect(result1!.type).toBe("text");

      // Position in second node
      const result2 = matcher.findNodeAtPosition(8);
      expect(result2).toBeDefined();
      expect(result2!.nodeId).toBe("node-2");

      // Position at boundary (exclusive end)
      const result3 = matcher.findNodeAtPosition(6);
      expect(result3!.nodeId).toBe("node-2");
    });

    it("should return null for position outside all spans", () => {
      const spans = new Map<string, SpanInfo>([
        ["node-1", { start: 0, end: 5, type: "text" }],
      ]);
      const fullText = "Hello World";

      const matcher = new SpanMatcher(spans, fullText);

      const result = matcher.findNodeAtPosition(10);
      expect(result).toBeNull();
    });

    it("should prefer more specific (smaller) spans when nested", () => {
      // Parent span contains child span
      const spans = new Map<string, SpanInfo>([
        ["parent", { start: 0, end: 20, type: "section" }],
        ["child", { start: 5, end: 10, type: "text" }],
      ]);
      const fullText = "prefix some text suffix";

      const matcher = new SpanMatcher(spans, fullText);

      // Position inside child should return child
      const result = matcher.findNodeAtPosition(7);
      expect(result!.nodeId).toBe("child");

      // Position outside child but inside parent should return parent
      const result2 = matcher.findNodeAtPosition(2);
      expect(result2!.nodeId).toBe("parent");
    });
  });

  describe("findAllNodesAtPosition", () => {
    it("should return all nodes at a position, sorted by specificity", () => {
      const spans = new Map<string, SpanInfo>([
        ["section", { start: 0, end: 50, type: "section" }],
        ["paragraph", { start: 10, end: 40, type: "paragraph" }],
        ["text", { start: 15, end: 25, type: "text" }],
      ]);
      const fullText = "x".repeat(50);

      const matcher = new SpanMatcher(spans, fullText);

      const results = matcher.findAllNodesAtPosition(20);

      expect(results).toHaveLength(3);
      // Should be sorted smallest first
      expect(results[0].nodeId).toBe("text"); // smallest
      expect(results[1].nodeId).toBe("paragraph"); // medium
      expect(results[2].nodeId).toBe("section"); // largest
    });

    it("should return empty array for position outside all spans", () => {
      const spans = new Map<string, SpanInfo>([
        ["node-1", { start: 0, end: 5, type: "text" }],
      ]);

      const matcher = new SpanMatcher(spans, "Hello World");
      const results = matcher.findAllNodesAtPosition(10);

      expect(results).toEqual([]);
    });
  });

  describe("matchExcerpt", () => {
    it("should find a simple excerpt in the text", () => {
      const spans = new Map<string, SpanInfo>([
        ["node-1", { start: 0, end: 6, type: "text" }],
        ["node-2", { start: 6, end: 11, type: "text" }],
      ]);
      const fullText = "Hello World";

      const matcher = new SpanMatcher(spans, fullText);

      const results = matcher.matchExcerpt("World");

      expect(results).toHaveLength(1);
      expect(results[0].nodeId).toBe("node-2");
      expect(results[0].matchType).toBe("single");
      expect(results[0].offset).toBe(0); // "World" starts at position 0 within node-2
    });

    it("should find excerpt that spans multiple nodes", () => {
      const spans = new Map<string, SpanInfo>([
        ["node-1", { start: 0, end: 6, type: "text" }],
        ["node-2", { start: 6, end: 11, type: "text" }],
      ]);
      const fullText = "Hello World";

      const matcher = new SpanMatcher(spans, fullText);

      const results = matcher.matchExcerpt("lo Wo");

      // Should match across both nodes
      expect(results.length).toBeGreaterThanOrEqual(2);

      const node1Match = results.find((r) => r.nodeId === "node-1");
      const node2Match = results.find((r) => r.nodeId === "node-2");

      expect(node1Match).toBeDefined();
      expect(node1Match!.matchType).toBe("start");
      expect(node1Match!.offset).toBe(3); // "lo " starts at position 3 in "Hello "

      expect(node2Match).toBeDefined();
      expect(node2Match!.matchType).toBe("end");
    });

    it("should find all occurrences with findAll option", () => {
      const spans = new Map<string, SpanInfo>([
        ["node-1", { start: 0, end: 10, type: "text" }],
        ["node-2", { start: 10, end: 20, type: "text" }],
      ]);
      const fullText = "foo bar foo bar foo";

      const matcher = new SpanMatcher(spans, fullText);

      const results = matcher.matchExcerpt("foo", { findAll: true });

      // Should find all 3 occurrences
      expect(results.length).toBeGreaterThanOrEqual(3);
    });

    it("should return empty array when excerpt not found", () => {
      const spans = new Map<string, SpanInfo>([
        ["node-1", { start: 0, end: 11, type: "text" }],
      ]);
      const fullText = "Hello World";

      const matcher = new SpanMatcher(spans, fullText);

      const results = matcher.matchExcerpt("xyz");
      expect(results).toEqual([]);
    });

    it("should handle excerpt that completely contains a node", () => {
      const spans = new Map<string, SpanInfo>([
        ["outer", { start: 0, end: 20, type: "section" }],
        ["inner", { start: 5, end: 10, type: "text" }],
      ]);
      const fullText = "12345INNER1234567890";

      const matcher = new SpanMatcher(spans, fullText);

      // Search for "INNER" which is exactly the inner node
      const results = matcher.matchExcerpt("INNER");

      const innerMatch = results.find((r) => r.nodeId === "inner");
      expect(innerMatch).toBeDefined();
      expect(innerMatch!.matchType).toBe("single");
    });
  });

  describe("getNodeText", () => {
    it("should return the text content of a node", () => {
      const spans = new Map<string, SpanInfo>([
        ["node-1", { start: 0, end: 5, type: "text" }],
        ["node-2", { start: 5, end: 10, type: "text" }],
      ]);
      const fullText = "HelloWorld";

      const matcher = new SpanMatcher(spans, fullText);

      expect(matcher.getNodeText("node-1")).toBe("Hello");
      expect(matcher.getNodeText("node-2")).toBe("World");
    });

    it("should return null for unknown node id", () => {
      const spans = new Map<string, SpanInfo>();
      const matcher = new SpanMatcher(spans, "test");

      expect(matcher.getNodeText("unknown")).toBeNull();
    });
  });

  describe("getSpan", () => {
    it("should return span info for a node", () => {
      const spans = new Map<string, SpanInfo>([
        ["node-1", { start: 0, end: 5, type: "text" }],
      ]);

      const matcher = new SpanMatcher(spans, "Hello");

      const span = matcher.getSpan("node-1");
      expect(span).toEqual({ start: 0, end: 5, type: "text" });
    });

    it("should return null for unknown node id", () => {
      const spans = new Map<string, SpanInfo>();
      const matcher = new SpanMatcher(spans, "test");

      expect(matcher.getSpan("unknown")).toBeNull();
    });
  });
});

describe("LatexNormalizer", () => {
  it("should strip \\label{...} commands", () => {
    const text = "\\section{Intro}\\label{sec:intro} Some text";
    const result = LatexNormalizer.normalize(text);

    expect(result.normalized).toBe("\\section{Intro} Some text");
  });

  it("should strip multiple labels", () => {
    const text = "A\\label{a}B\\label{b}C";
    const result = LatexNormalizer.normalize(text);

    expect(result.normalized).toBe("ABC");
  });

  it("should strip LaTeX comments", () => {
    const text = "Hello % this is a comment\nWorld";
    const result = LatexNormalizer.normalize(text);

    expect(result.normalized).toBe("Hello \nWorld");
  });

  it("should not strip escaped percent signs", () => {
    const text = "50\\% discount";
    const result = LatexNormalizer.normalize(text);

    expect(result.normalized).toBe("50\\% discount");
  });

  it("should normalize display math delimiters", () => {
    const text = "$$E=mc^2$$";
    const result = LatexNormalizer.normalize(text);

    expect(result.normalized).toBe("\\[E=mc^2\\]");
  });

  it("should normalize multiple spaces", () => {
    const text = "Hello    World";
    const result = LatexNormalizer.normalize(text);

    expect(result.normalized).toBe("Hello World");
  });

  it("should maintain position mapping after stripping", () => {
    const text = "A\\label{x}B";
    const result = LatexNormalizer.normalize(text);

    expect(result.normalized).toBe("AB");
    expect(result.posMap[0]).toBe(0); // 'A' maps to original position 0
    // 'B' should map to original position 10 (after \label{x})
    expect(result.posMap[1]).toBe(10);
  });

  it("should work with SpanMatcher for normalized matching", () => {
    const spans = new Map<string, SpanInfo>([
      ["node-1", { start: 0, end: 30, type: "section" }],
    ]);
    const fullText = "\\section{Intro}\\label{sec:1} Text";

    const matcher = new SpanMatcher(spans, fullText, LatexNormalizer);

    // Match "Intro}" which would fail if labels weren't stripped
    const results = matcher.matchExcerpt("Intro} Text", {
      useNormalization: true,
    });

    expect(results.length).toBeGreaterThan(0);
  });
});

describe("MarkdownNormalizer", () => {
  it("should strip HTML comments", () => {
    const text = "Hello <!-- comment --> World";
    const result = MarkdownNormalizer.normalize(text);

    // After stripping comment, spaces are normalized too
    expect(result.normalized).toBe("Hello World");
    expect(result.normalized).not.toContain("<!--");
  });

  it("should strip multiline HTML comments", () => {
    const text = "Hello <!-- \nmultiline\ncomment --> World";
    const result = MarkdownNormalizer.normalize(text);

    // After stripping comment, spaces are normalized too
    expect(result.normalized).toBe("Hello World");
    expect(result.normalized).not.toContain("<!--");
  });

  it("should strip reference-style link definitions", () => {
    const text = 'Some text\n[ref]: https://example.com "Title"\nMore text';
    const result = MarkdownNormalizer.normalize(text);

    expect(result.normalized).not.toContain("[ref]:");
    expect(result.normalized).toContain("Some text");
    expect(result.normalized).toContain("More text");
  });

  it("should normalize multiple spaces", () => {
    const text = "Hello    World";
    const result = MarkdownNormalizer.normalize(text);

    expect(result.normalized).toBe("Hello World");
  });

  it("should normalize excessive newlines", () => {
    const text = "Hello\n\n\n\nWorld";
    const result = MarkdownNormalizer.normalize(text);

    expect(result.normalized).toBe("Hello\n\nWorld");
  });

  it("should work with SpanMatcher for normalized matching", () => {
    const spans = new Map<string, SpanInfo>([
      ["node-1", { start: 0, end: 50, type: "section" }],
    ]);
    const fullText = "Hello <!-- hidden --> World is great";

    const matcher = new SpanMatcher(spans, fullText, MarkdownNormalizer);

    // Match across the comment (spaces normalized to single)
    const results = matcher.matchExcerpt("Hello World", {
      useNormalization: true,
    });

    expect(results.length).toBeGreaterThan(0);
  });
});

describe("SpanMatcher integration with TokenExporter", () => {
  const factory = new TokenNodeFactory();

  it("should work with toLatexWithSpans output", () => {
    const nodes = [
      factory.createNode({
        type: TokenType.TEXT,
        content: "Hello ",
      } as TextToken)!,
      factory.createNode({
        type: TokenType.TEXT,
        content: "World",
      } as TextToken)!,
    ];

    const { content, spans } = TokenExporter.toLatexWithSpans(nodes);
    const matcher = new SpanMatcher(spans, content);

    // Find "World"
    const results = matcher.matchExcerpt("World");
    expect(results).toHaveLength(1);
    expect(results[0].nodeId).toBe(nodes[1].id);
    expect(results[0].matchType).toBe("single");
  });

  it("should work with section containing references", () => {
    const sectionNode = factory.createNode({
      type: TokenType.SECTION,
      title: [{ type: TokenType.TEXT, content: "Introduction" }],
      content: [
        { type: TokenType.TEXT, content: "See " },
        { type: TokenType.REF, content: ["fig:1"] } as ReferenceToken,
        { type: TokenType.TEXT, content: " for details." },
      ],
      level: 1,
    } as SectionToken)!;

    const { content, spans } = TokenExporter.toLatexWithSpans([sectionNode]);
    const matcher = new SpanMatcher(spans, content);

    // Find the reference
    const results = matcher.matchExcerpt("\\ref{fig:1}");

    expect(results.length).toBeGreaterThan(0);
    const refMatch = results.find((r) => r.nodeType === TokenType.REF);
    expect(refMatch).toBeDefined();
    expect(refMatch!.matchType).toBe("single");
  });

  it("should work with toMarkdownWithSpans output", () => {
    const nodes = [
      factory.createNode({
        type: TokenType.TEXT,
        content: "Hello ",
      } as TextToken)!,
      factory.createNode({
        type: TokenType.TEXT,
        content: "World",
      } as TextToken)!,
    ];

    const { content, spans } = TokenExporter.toMarkdownWithSpans(nodes);
    const matcher = new SpanMatcher(spans, content);

    // Find "World"
    const results = matcher.matchExcerpt("World");
    expect(results).toHaveLength(1);
    expect(results[0].nodeId).toBe(nodes[1].id);
  });

  it("should find position within a nested section", () => {
    const sectionNode = factory.createNode({
      type: TokenType.SECTION,
      title: [{ type: TokenType.TEXT, content: "Methods" }],
      content: [
        { type: TokenType.TEXT, content: "We used the following approach." },
      ],
      level: 1,
    } as SectionToken)!;

    const { content, spans } = TokenExporter.toLatexWithSpans([sectionNode]);
    const matcher = new SpanMatcher(spans, content);

    // Find text within the section
    const results = matcher.matchExcerpt("following approach");

    expect(results.length).toBeGreaterThan(0);
    const textMatch = results.find((r) => r.nodeType === TokenType.TEXT);
    expect(textMatch).toBeDefined();

    // Verify the offset is correct
    const nodeText = matcher.getNodeText(textMatch!.nodeId);
    expect(nodeText).toContain("following approach");
  });
});

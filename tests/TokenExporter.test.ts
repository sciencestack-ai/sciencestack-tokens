import { describe, it, expect } from "vitest";
import { TokenExporter } from "../src/TokenExporter";
import { TokenNodeFactory } from "../src/base/TokenNodeFactory";
import {
  TokenType,
  BaseToken,
  TextToken,
  SectionToken,
  EquationToken,
  DisplayType,
  ReferenceToken,
} from "../src/types";
import { TabularTokenNode } from "../src";

describe("TokenExporter", () => {
  const factory = new TokenNodeFactory();

  // Helper to create test nodes with proper types
  const createTextNode = (content: string, styles?: string[]) => {
    const token: TextToken = { type: TokenType.TEXT, content, styles };
    return factory.createNode(token)!;
  };

  const createSectionNode = (title: string, content: string, level = 1) => {
    const token: SectionToken = {
      type: TokenType.SECTION,
      title: [{ type: TokenType.TEXT, content: title }],
      content: [{ type: TokenType.TEXT, content }],
      level,
    };
    return factory.createNode(token)!;
  };

  const createEquationNode = (
    content: string,
    display: DisplayType = DisplayType.BLOCK,
    numbering?: string
  ) => {
    const token: EquationToken = {
      type: TokenType.EQUATION,
      content,
      display,
      numbering,
    };
    return factory.createNode(token)!;
  };

  describe("Static methods - literal output tests", () => {
    it("toText should return plain text", () => {
      const nodes = [createTextNode("Hello World")];
      expect(TokenExporter.toText(nodes)).toBe("Hello World");
    });

    it("toLatex should wrap styled text correctly", () => {
      const nodes = [createTextNode("bold text", ["bold"])];
      expect(TokenExporter.toLatex(nodes)).toBe("\\textbf{bold text}");
    });

    it("toLatex should wrap italic text correctly", () => {
      const nodes = [createTextNode("italic text", ["italic"])];
      expect(TokenExporter.toLatex(nodes)).toBe("\\emph{italic text}");
    });

    it("toMarkdown should wrap bold text correctly", () => {
      const nodes = [createTextNode("bold text", ["bold"])];
      expect(TokenExporter.toMarkdown(nodes)).toBe("**bold text**");
    });

    it("toMarkdown should wrap italic text correctly", () => {
      const nodes = [createTextNode("italic text", ["italic"])];
      expect(TokenExporter.toMarkdown(nodes)).toBe("*italic text*");
    });

    it("toLatex should format inline equation correctly", () => {
      const nodes = [createEquationNode("E = mc^2", DisplayType.INLINE)];
      expect(TokenExporter.toLatex(nodes)).toBe("$E = mc^2$");
    });

    it("toLatex should format block equation correctly", () => {
      const nodes = [createEquationNode("E = mc^2", DisplayType.BLOCK)];
      expect(TokenExporter.toLatex(nodes).trim()).toBe("$$\nE = mc^2\n$$");
    });

    it("toLatex should format numbered equation correctly", () => {
      const nodes = [createEquationNode("E = mc^2", DisplayType.BLOCK, "1")];
      expect(TokenExporter.toLatex(nodes).trim()).toBe(
        "\\begin{equation}\nE = mc^2\n\\end{equation}"
      );
    });

    it("toMarkdown should format inline equation correctly", () => {
      const nodes = [createEquationNode("x^2", DisplayType.INLINE)];
      expect(TokenExporter.toMarkdown(nodes).trim()).toBe("$x^2$");
    });

    it("toMarkdown should format block equation correctly", () => {
      const nodes = [createEquationNode("x^2", DisplayType.BLOCK)];
      expect(TokenExporter.toMarkdown(nodes).trim()).toBe(
        "$$\nx^2 \\notag\n$$"
      );
    });

    it("toLatex should format section correctly", () => {
      const nodes = [createSectionNode("My Section", "Section content")];
      const result = TokenExporter.toLatex(nodes);
      expect(result).toContain("\\section{My Section}");
      expect(result).toContain("Section content");
    });

    it("toMarkdown should format section with heading correctly", () => {
      const nodes = [createSectionNode("My Section", "Section content")];
      const result = TokenExporter.toMarkdown(nodes);
      expect(result).toContain("## My Section");
      expect(result).toContain("Section content");
    });

    it("toJSON should preserve token structure", () => {
      const nodes = [createTextNode("Test")];
      const result = TokenExporter.toJSON(nodes);
      expect(result).toEqual([{ type: TokenType.TEXT, content: "Test" }]);
    });

    it("tokensToText should convert raw tokens to text", () => {
      const tokens: BaseToken[] = [
        { type: TokenType.TEXT, content: "Hello " },
        { type: TokenType.TEXT, content: "World" },
      ];
      expect(TokenExporter.tokensToText(tokens)).toBe("Hello World");
    });
  });

  describe("Static export() method", () => {
    it("should export to text format", () => {
      const nodes = [createTextNode("Test")];
      expect(TokenExporter.export(nodes, "text")).toBe("Test");
    });

    it("should export to markdown format with styles", () => {
      const nodes = [createTextNode("bold", ["bold"])];
      expect(TokenExporter.export(nodes, "markdown")).toBe("**bold**");
    });

    it("should export to latex format with styles", () => {
      const nodes = [createTextNode("bold", ["bold"])];
      expect(TokenExporter.export(nodes, "latex")).toBe("\\textbf{bold}");
    });

    it("should export to json format", () => {
      const nodes = [createTextNode("Test")];
      const result = TokenExporter.export(nodes, "json");
      expect(Array.isArray(result)).toBe(true);
    });

    it("should throw on unknown format", () => {
      const nodes = [createTextNode("Test")];
      expect(() => TokenExporter.export(nodes, "unknown" as any)).toThrow(
        "unknown format 'unknown'"
      );
    });
  });

  describe("Instance methods with factory", () => {
    const exporter = new TokenExporter(factory);

    it("should convert raw tokens to markdown using factory", () => {
      const tokens: BaseToken[] = [
        {
          type: TokenType.TEXT,
          content: "styled",
          styles: ["bold"],
        } as TextToken,
      ];
      expect(exporter.toMarkdown(tokens)).toBe("**styled**");
    });

    it("should convert raw tokens to latex using factory", () => {
      const tokens: BaseToken[] = [
        {
          type: TokenType.TEXT,
          content: "styled",
          styles: ["italic"],
        } as TextToken,
      ];
      expect(exporter.toLatex(tokens)).toBe("\\emph{styled}");
    });

    it("should convert raw equation tokens using factory", () => {
      const tokens: BaseToken[] = [
        {
          type: TokenType.EQUATION,
          content: "a^2 + b^2",
          display: DisplayType.INLINE,
        } as EquationToken,
      ];
      expect(exporter.toLatex(tokens)).toBe("$a^2 + b^2$");
    });

    it("should handle mixed token types", () => {
      const tokens: BaseToken[] = [
        { type: TokenType.TEXT, content: "The formula " } as TextToken,
        {
          type: TokenType.EQUATION,
          content: "E=mc^2",
          display: DisplayType.INLINE,
        } as EquationToken,
        { type: TokenType.TEXT, content: " is famous." } as TextToken,
      ];
      const result = exporter.toLatex(tokens);
      expect(result).toContain("The formula");
      expect(result).toContain("$E=mc^2$");
      expect(result).toContain("is famous.");
    });
  });

  describe("Instance export() unified method", () => {
    const exporter = new TokenExporter(factory);

    it("should export raw tokens to all formats", () => {
      const tokens: BaseToken[] = [
        {
          type: TokenType.TEXT,
          content: "Test",
          styles: ["bold"],
        } as TextToken,
      ];

      expect(exporter.export(tokens, "text")).toBe("Test");
      expect(exporter.export(tokens, "markdown")).toBe("**Test**");
      expect(exporter.export(tokens, "latex")).toBe("\\textbf{Test}");
      expect(Array.isArray(exporter.export(tokens, "json"))).toBe(true);
    });

    it("should throw on unknown format", () => {
      const tokens: BaseToken[] = [{ type: TokenType.TEXT, content: "Test" }];
      expect(() => exporter.export(tokens, "unknown" as any)).toThrow(
        "unknown format 'unknown'"
      );
    });
  });

  describe("Instance without factory", () => {
    const exporterNoFactory = new TokenExporter();

    it("should work with pre-built token nodes", () => {
      const nodes = [createTextNode("Test")];
      expect(exporterNoFactory.toText(nodes)).toBe("Test");
      expect(exporterNoFactory.toMarkdown(nodes)).toBe("Test");
      expect(exporterNoFactory.toLatex(nodes)).toBe("Test");
    });

    it("should throw when converting raw tokens without factory", () => {
      const tokens: BaseToken[] = [{ type: TokenType.TEXT, content: "Test" }];
      expect(() => exporterNoFactory.toText(tokens)).toThrow(
        "factory required"
      );
    });
  });

  describe("Empty input handling", () => {
    it("should handle empty node array", () => {
      expect(TokenExporter.toText([])).toBe("");
      expect(TokenExporter.toMarkdown([])).toBe("");
      expect(TokenExporter.toLatex([])).toBe("");
      expect(TokenExporter.toJSON([])).toEqual([]);
    });

    it("should handle empty token array", () => {
      expect(TokenExporter.tokensToText([])).toBe("");
    });
  });

  describe("LaTeX special character escaping", () => {
    it("should escape special characters in text", () => {
      const nodes = [createTextNode("50% off & more")];
      expect(TokenExporter.toLatex(nodes)).toBe("50\\% off \\& more");
    });

    it("should escape underscores", () => {
      const nodes = [createTextNode("snake_case")];
      expect(TokenExporter.toLatex(nodes)).toBe("snake\\_case");
    });
  });

  describe("assetPathResolver", () => {
    it("should resolve asset paths with custom resolver", () => {
      const token = {
        type: TokenType.INCLUDEGRAPHICS,
        path: "papers/123/figs/image.png",
        content: null,
      };
      const node = factory.createNode(token)!;

      const result = node.getMarkdownContent({
        assetPathResolver: (path) => `https://cdn.example.com/${path}`,
      });

      expect(result).toBe(
        "![ ](https://cdn.example.com/papers/123/figs/image.png)"
      );
    });

    it("should return path as-is without resolver", () => {
      const token = {
        type: TokenType.INCLUDEGRAPHICS,
        path: "figs/image.png",
        content: null,
      };
      const node = factory.createNode(token)!;

      const result = node.getMarkdownContent();
      expect(result).toBe("![ ](figs/image.png)");
    });
  });

  describe("Tabular markdown export", () => {
    it("should use GFM table for simple tables", () => {
      const token = {
        type: TokenType.TABULAR,
        content: [
          [
            { content: [{ type: TokenType.TEXT, content: "A" }] },
            { content: [{ type: TokenType.TEXT, content: "B" }] },
          ],
          [
            { content: [{ type: TokenType.TEXT, content: "1" }] },
            { content: [{ type: TokenType.TEXT, content: "2" }] },
          ],
        ],
      };
      const node = factory.createNode(token)!;
      const result = node.getMarkdownContent();

      expect(result).toContain("| A | B |");
      expect(result).toContain("| --- | --- |");
      expect(result).toContain("| 1 | 2 |");
      expect(result).not.toContain("<table>");
    });

    it("should use HTML table for tables with colspan", () => {
      const token = {
        type: TokenType.TABULAR,
        content: [
          [
            {
              content: [{ type: TokenType.TEXT, content: "Header" }],
              colspan: 2,
            },
          ],
          [
            { content: [{ type: TokenType.TEXT, content: "1" }] },
            { content: [{ type: TokenType.TEXT, content: "2" }] },
          ],
        ],
      };
      const node = factory.createNode(token)!;
      const result = node.getMarkdownContent();

      expect(result).toContain("<table>");
      expect(result).toContain('colspan="2"');
      expect(result).toContain('<th colspan="2">Header</th>');
    });

    it("should use HTML table for tables with rowspan", () => {
      const token = {
        type: TokenType.TABULAR,
        content: [
          [
            {
              content: [{ type: TokenType.TEXT, content: "Spans" }],
              rowspan: 2,
            },
            { content: [{ type: TokenType.TEXT, content: "B" }] },
          ],
          [
            { content: [] }, // placeholder for rowspan
            { content: [{ type: TokenType.TEXT, content: "C" }] },
          ],
        ],
      };
      const node = factory.createNode(token)!;
      const result = node.getMarkdownContent();

      expect(result).toContain("<table>");
      expect(result).toContain('rowspan="2"');
      expect(result).toContain("<td>C</td>");
      // Placeholder should be skipped, not rendered
      expect(result).not.toContain("<td></td>");
    });

    it("should render actual empty cells (not placeholders)", () => {
      const token = {
        type: TokenType.TABULAR,
        content: [
          [
            { content: [{ type: TokenType.TEXT, content: "A" }] },
            { content: [] }, // actual empty cell, not a placeholder
            { content: [{ type: TokenType.TEXT, content: "C" }] },
          ],
        ],
      };
      const node = factory.createNode(token)!;
      const result = node.getMarkdownContent();

      // Simple table without rowspan/colspan uses GFM
      expect(result).toContain("| A |  | C |");
    });

    it("getResolvedCells should return cells with computed positions", () => {
      const token = {
        type: TokenType.TABULAR,
        content: [
          [{ content: [{ type: TokenType.TEXT, content: "A" }], colspan: 2 }],
          [
            { content: [{ type: TokenType.TEXT, content: "B" }] },
            { content: [{ type: TokenType.TEXT, content: "C" }] },
          ],
        ],
      };
      const node = factory.createNode(token) as any;
      const resolved = node.getResolvedCells();

      expect(resolved).toHaveLength(3);

      // First cell: colspan 2, header
      expect(resolved[0].row).toBe(0);
      expect(resolved[0].col).toBe(0);
      expect(resolved[0].colSpan).toBe(2);
      expect(resolved[0].isHeader).toBe(true);

      // Second row cells
      expect(resolved[1].row).toBe(1);
      expect(resolved[1].col).toBe(0);
      expect(resolved[1].isHeader).toBe(false);

      expect(resolved[2].row).toBe(1);
      expect(resolved[2].col).toBe(1);
    });

    it("getResolvedCells should handle rowspan correctly", () => {
      // Backend produces placeholder cells for occupied positions
      const token = {
        type: TokenType.TABULAR,
        content: [
          [
            { content: [{ type: TokenType.TEXT, content: "A" }], rowspan: 2 },
            { content: [{ type: TokenType.TEXT, content: "B" }] },
          ],
          [
            { content: [] }, // placeholder for rowspan
            { content: [{ type: TokenType.TEXT, content: "C" }] },
          ],
        ],
      };
      const node = factory.createNode(token) as TabularTokenNode;
      const resolved = node.getResolvedCells();

      // Placeholder is skipped, so we get 3 cells
      expect(resolved).toHaveLength(3);

      // First row
      expect(resolved[0].row).toBe(0);
      expect(resolved[0].col).toBe(0);
      expect(resolved[0].rowSpan).toBe(2);

      expect(resolved[1].row).toBe(0);
      expect(resolved[1].col).toBe(1);

      // Second row - C at col 1 (placeholder at col 0 was skipped)
      expect(resolved[2].row).toBe(1);
      expect(resolved[2].col).toBe(1);
    });
  });

  describe("toLatexWithSpans", () => {
    it("should return content and spans for flat list of text nodes", () => {
      const nodes = [
        factory.createNode({ type: TokenType.TEXT, content: "Hello " } as TextToken)!,
        factory.createNode({ type: TokenType.TEXT, content: "World" } as TextToken)!,
      ];

      const { content, spans } = TokenExporter.toLatexWithSpans(nodes);

      expect(content).toBe("Hello World");
      expect(spans.size).toBe(2);

      const span0 = spans.get(nodes[0].id);
      const span1 = spans.get(nodes[1].id);

      expect(span0).toEqual({ start: 0, end: 6 }); // "Hello "
      expect(span1).toEqual({ start: 6, end: 11 }); // "World"
    });

    it("should track span for section node", () => {
      const sectionNode = factory.createNode({
        type: TokenType.SECTION,
        title: [{ type: TokenType.TEXT, content: "Intro" }],
        content: [{ type: TokenType.TEXT, content: "Hello" }],
        level: 1,
      } as SectionToken)!;

      const { content, spans } = TokenExporter.toLatexWithSpans([sectionNode]);

      // Section span should encompass everything
      const sectionSpan = spans.get(sectionNode.id);
      expect(sectionSpan).toBeDefined();
      expect(sectionSpan!.start).toBe(0);
      expect(sectionSpan!.end).toBe(content.length);

      // Content should include section header and text
      expect(content).toContain("\\section{Intro}");
      expect(content).toContain("Hello");
    });

    it("should work with instance method", () => {
      const exporter = new TokenExporter(factory);
      const tokens: BaseToken[] = [
        { type: TokenType.TEXT, content: "Test" } as TextToken,
      ];

      const { content, spans } = exporter.toLatexWithSpans(tokens);

      expect(content).toBe("Test");
      expect(spans.size).toBe(1);
    });

    it("should track spans for simple container with children", () => {
      // Use GROUP which has no wrapper, just children
      const groupNode = factory.createNode({
        type: TokenType.GROUP,
        content: [
          { type: TokenType.TEXT, content: "A" },
          { type: TokenType.TEXT, content: "B" },
        ],
      })!;

      const { content, spans } = TokenExporter.toLatexWithSpans([groupNode]);

      // Should have spans for group + 2 text children
      expect(spans.size).toBe(3);

      // Content should be A + B
      expect(content).toContain("A");
      expect(content).toContain("B");

      // Group span encompasses everything
      const groupSpan = spans.get(groupNode.id);
      expect(groupSpan).toBeDefined();
      expect(groupSpan!.start).toBe(0);
    });

    it("should correctly position text nodes in group", () => {
      const groupNode = factory.createNode({
        type: TokenType.GROUP,
        content: [
          { type: TokenType.TEXT, content: "Hello" },
          { type: TokenType.TEXT, content: "World" },
        ],
      })!;

      const { content, spans } = TokenExporter.toLatexWithSpans([groupNode]);

      // Find the text node spans by looking at children
      const children = groupNode.getChildren();
      const spanA = spans.get(children[0].id);
      const spanB = spans.get(children[1].id);

      expect(spanA).toBeDefined();
      expect(spanB).toBeDefined();

      // Verify content at those positions matches
      expect(content.substring(spanA!.start, spanA!.end)).toBe("Hello");
      expect(content.substring(spanB!.start, spanB!.end)).toBe("World");
    });

    it("should correctly position realistic section with text and refs", () => {
      // Create: \section{Introduction} some text \ref{fig:1} another text
      const sectionNode = factory.createNode({
        type: TokenType.SECTION,
        title: [{ type: TokenType.TEXT, content: "Introduction" }],
        content: [
          { type: TokenType.TEXT, content: "some text " },
          { type: TokenType.REF, content: ["fig:1"] } as ReferenceToken,
          { type: TokenType.TEXT, content: " another text" },
        ],
        level: 1,
      } as SectionToken)!;

      const { content, spans } = TokenExporter.toLatexWithSpans([sectionNode]);

      // Verify the output looks correct
      expect(content).toContain("\\section{Introduction}");
      expect(content).toContain("some text");
      expect(content).toContain("\\ref{fig:1}");
      expect(content).toContain("another text");

      // Verify section span encompasses everything
      const sectionSpan = spans.get(sectionNode.id);
      expect(sectionSpan).toBeDefined();
      expect(content.substring(sectionSpan!.start, sectionSpan!.end)).toBe(content);

      // Get all children
      const children = sectionNode.getChildren();
      expect(children.length).toBe(4); // 1 title + 3 content

      // Title span should point to "Introduction"
      const titleSpan = spans.get(children[0].id);
      expect(titleSpan).toBeDefined();
      expect(content.substring(titleSpan!.start, titleSpan!.end)).toBe("Introduction");

      // Content spans should point to correct content
      const textSpan1 = spans.get(children[1].id);
      const refSpan = spans.get(children[2].id);
      const textSpan2 = spans.get(children[3].id);

      expect(textSpan1).toBeDefined();
      expect(refSpan).toBeDefined();
      expect(textSpan2).toBeDefined();

      expect(content.substring(textSpan1!.start, textSpan1!.end)).toBe("some text ");
      expect(content.substring(refSpan!.start, refSpan!.end)).toBe("\\ref{fig:1}");
      expect(content.substring(textSpan2!.start, textSpan2!.end)).toBe(" another text");

      // Spans should be in order and non-overlapping
      expect(textSpan1!.end).toBeLessThanOrEqual(refSpan!.start);
      expect(refSpan!.end).toBeLessThanOrEqual(textSpan2!.start);
    });

    it("should handle deeply nested structure (section > subsection > text)", () => {
      // Create nested sections:
      // \section{Intro}
      //   Some intro text
      //   \subsection{Details}
      //     Detail text \ref{eq:1} more details
      const innerSection = {
        type: TokenType.SECTION,
        title: [{ type: TokenType.TEXT, content: "Details" }],
        content: [
          { type: TokenType.TEXT, content: "Detail text " },
          { type: TokenType.REF, content: ["eq:1"] } as ReferenceToken,
          { type: TokenType.TEXT, content: " more details" },
        ],
        level: 2, // subsection
      } as SectionToken;

      const outerSection = factory.createNode({
        type: TokenType.SECTION,
        title: [{ type: TokenType.TEXT, content: "Intro" }],
        content: [
          { type: TokenType.TEXT, content: "Some intro text" },
          innerSection,
        ],
        level: 1,
      } as SectionToken)!;

      const { content, spans } = TokenExporter.toLatexWithSpans([outerSection]);

      // Verify structure
      expect(content).toContain("\\section{Intro}");
      expect(content).toContain("\\subsection{Details}");
      expect(content).toContain("Some intro text");
      expect(content).toContain("Detail text");
      expect(content).toContain("\\ref{eq:1}");
      expect(content).toContain("more details");

      // Outer section span should encompass everything
      const outerSpan = spans.get(outerSection.id);
      expect(outerSpan).toBeDefined();
      expect(outerSpan!.start).toBe(0);
      expect(outerSpan!.end).toBe(content.length);

      // Find all children recursively and verify they have spans
      const allChildren = outerSection.getChildren();
      for (const child of allChildren) {
        const span = spans.get(child.id);
        expect(span).toBeDefined();
        // Verify the span content is within the output
        const spanContent = content.substring(span!.start, span!.end);
        expect(spanContent.length).toBeGreaterThan(0);
      }

      // Find the inner section (subsection)
      const innerSectionNode = allChildren.find(c => c.type === TokenType.SECTION);
      expect(innerSectionNode).toBeDefined();

      // Inner section's children should also have spans
      const innerChildren = innerSectionNode!.getChildren();
      for (const child of innerChildren) {
        const span = spans.get(child.id);
        expect(span).toBeDefined();

        // Verify content matches
        const spanContent = content.substring(span!.start, span!.end);
        if (child.type === TokenType.TEXT) {
          expect(["Details", "Detail text ", " more details"]).toContain(spanContent);
        } else if (child.type === TokenType.REF) {
          expect(spanContent).toBe("\\ref{eq:1}");
        }
      }
    });
  });

  describe("toMarkdownWithSpans", () => {
    it("should return content and spans for flat list of text nodes", () => {
      const nodes = [
        factory.createNode({ type: TokenType.TEXT, content: "Hello " } as TextToken)!,
        factory.createNode({ type: TokenType.TEXT, content: "World" } as TextToken)!,
      ];

      const { content, spans } = TokenExporter.toMarkdownWithSpans(nodes);

      expect(content).toBe("Hello World");
      expect(spans.size).toBe(2);

      const span0 = spans.get(nodes[0].id);
      const span1 = spans.get(nodes[1].id);

      expect(span0).toEqual({ start: 0, end: 6 });
      expect(span1).toEqual({ start: 6, end: 11 });
    });

    it("should track spans for section with children in markdown", () => {
      const sectionNode = factory.createNode({
        type: TokenType.SECTION,
        title: [{ type: TokenType.TEXT, content: "Introduction" }],
        content: [
          { type: TokenType.TEXT, content: "some text " },
          { type: TokenType.TEXT, content: "more text" },
        ],
        level: 1,
      } as SectionToken)!;

      const { content, spans } = TokenExporter.toMarkdownWithSpans([sectionNode]);

      // Verify markdown structure
      expect(content).toContain("## Introduction");
      expect(content).toContain("some text");
      expect(content).toContain("more text");

      // Section span should encompass everything
      const sectionSpan = spans.get(sectionNode.id);
      expect(sectionSpan).toBeDefined();
      expect(sectionSpan!.start).toBe(0);
      expect(sectionSpan!.end).toBe(content.length);

      // Children should have spans
      const children = sectionNode.getChildren();
      for (const child of children) {
        const span = spans.get(child.id);
        expect(span).toBeDefined();
        expect(span!.end).toBeGreaterThan(span!.start);
      }
    });

    it("should work with instance method", () => {
      const exporter = new TokenExporter(factory);
      const tokens: BaseToken[] = [
        { type: TokenType.TEXT, content: "Test" } as TextToken,
      ];

      const { content, spans } = exporter.toMarkdownWithSpans(tokens);

      expect(content).toBe("Test");
      expect(spans.size).toBe(1);
    });
  });
});

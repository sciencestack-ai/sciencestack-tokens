import { describe, it, expect } from "vitest";
import { TokenExporter } from "../src/TokenExporter";
import { TokenNodeFactory } from "../src/base/TokenNodeFactory";
import { AbstractTokenNode } from "../src/base/AbstractTokenNode";
import {
  TokenType,
  BaseToken,
  TextToken,
  SectionToken,
  EquationToken,
  DisplayType,
  TabularToken,
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

  describe("onNode callback", () => {
    it("should call onNode for each node via TokenExporter.toLatex", () => {
      const sectionNode = factory.createNode({
        type: TokenType.SECTION,
        title: [{ type: TokenType.TEXT, content: "Introduction" }],
        content: [
          { type: TokenType.TEXT, content: "Hello " },
          { type: TokenType.TEXT, content: "World" },
        ],
        level: 1,
      } as SectionToken)!;

      const visitedNodes: { id: string; type: string }[] = [];

      TokenExporter.toLatex([sectionNode], {
        onNode: (node, defaultLatex) => {
          const n = node as AbstractTokenNode;
          visitedNodes.push({ id: n.id, type: n.type });
          return defaultLatex;
        },
      });

      // Section + title text + 2 content texts = 4 nodes
      expect(visitedNodes.length).toBeGreaterThanOrEqual(4);
      expect(visitedNodes.some((n) => n.type === TokenType.SECTION)).toBe(true);
      expect(visitedNodes.filter((n) => n.type === TokenType.TEXT).length).toBeGreaterThanOrEqual(3);
    });

    it("should support span tracking pattern via exporter", () => {
      const nodes = [
        factory.createNode({ type: TokenType.TEXT, content: "Hello " } as TextToken)!,
        factory.createNode({ type: TokenType.TEXT, content: "World" } as TextToken)!,
      ];

      const spans: { nodeId: string; start: number; end: number }[] = [];
      let position = 0;

      const result = TokenExporter.toLatex(nodes, {
        onNode: (node, defaultLatex) => {
          const n = node as AbstractTokenNode;
          spans.push({
            nodeId: n.id,
            start: position,
            end: position + defaultLatex.length,
          });
          position += defaultLatex.length;
          return defaultLatex;
        },
      });

      expect(spans).toHaveLength(2);
      expect(spans[0].start).toBe(0);
      expect(spans[0].end).toBe(6); // "Hello "
      expect(spans[1].start).toBe(6);
      expect(spans[1].end).toBe(11); // "World"
      expect(result).toContain("Hello");
      expect(result).toContain("World");
    });

    it("should allow transforming output (strip labels)", () => {
      const eqNode = factory.createNode({
        type: TokenType.EQUATION,
        content: "E = mc^2",
        display: DisplayType.BLOCK,
        labels: ["eq:einstein"],
      } as EquationToken)!;

      const result = TokenExporter.toLatex([eqNode], {
        onNode: (node, defaultLatex) => {
          return defaultLatex.replace(/\\label\{[^}]*\}/g, "");
        },
      });

      expect(result).not.toContain("\\label");
      expect(result).toContain("E = mc^2");
    });
  });
});

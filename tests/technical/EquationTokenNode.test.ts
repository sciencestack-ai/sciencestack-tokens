import { describe, it, expect } from "vitest";
import { EquationTokenNode } from "../../src/technical/EquationTokenNode";
import { TokenType, DisplayType } from "../../src/types";
import { TokenNodeFactory } from "../../src/base/TokenNodeFactory";

describe("EquationTokenNode", () => {
  const factory = new TokenNodeFactory();

  describe("Inline equations", () => {
    it("should create an inline equation", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "x = y",
        display: DisplayType.INLINE,
      };
      const node = factory.createNode(token) as EquationTokenNode;

      expect(node).toBeDefined();
      expect(node.isInline).toBe(true);
    });

    it("should export inline equation to LaTeX", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "E = mc^2",
        display: DisplayType.INLINE,
      };
      const node = factory.createNode(token) as EquationTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toBe("$E = mc^2$");
    });

    it("should export inline equation to Markdown", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "a^2 + b^2 = c^2",
        display: DisplayType.INLINE,
      };
      const node = factory.createNode(token) as EquationTokenNode;

      expect(node).toBeDefined();
      const markdown = node.getMarkdownContent();
      expect(markdown).toContain("$a^2 + b^2 = c^2$");
    });
  });

  describe("Block equations", () => {
    it("should create a block equation", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "x = y",
        display: DisplayType.BLOCK,
      };
      const node = factory.createNode(token) as EquationTokenNode;

      expect(node).toBeDefined();
      expect(node.isInline).toBe(false);
    });

    it("should export block equation to LaTeX without numbering", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "E = mc^2",
        display: DisplayType.BLOCK,
      };
      const node = factory.createNode(token) as EquationTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toContain("$$");
      expect(latex).toContain("E = mc^2");
      expect(latex).not.toContain("\\begin{equation}");
    });

    it("should export numbered equation to LaTeX", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "a^2 + b^2 = c^2",
        display: DisplayType.BLOCK,
        numbering: "1",
      };
      const node = factory.createNode(token) as EquationTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toContain("\\begin{equation}");
      expect(latex).toContain("a^2 + b^2 = c^2");
      expect(latex).toContain("\\end{equation}");
    });

    it("should include numbering in markdown", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "x = y + z",
        display: DisplayType.BLOCK,
        numbering: "2",
      };
      const node = factory.createNode(token) as EquationTokenNode;

      expect(node).toBeDefined();
      const markdown = node.getMarkdownContent();
      expect(markdown).toContain("x = y + z");
      expect(markdown).toContain("\\tag{2}");
    });

    it("should support postProcess callback for adding anchors", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "x = y",
        display: DisplayType.BLOCK,
        numbering: "1",
        labels: ["eq:test"],
        id: "eq-test",
      };
      const node = factory.createNode(token) as EquationTokenNode;

      expect(node).toBeDefined();
      // Use postProcess to add anchor via static GetMarkdownContent
      // postProcess is applied at the collection level
      const markdown = EquationTokenNode.GetMarkdownContent([node], {
        postProcess: (n, md) => {
          const nodeId = (n as EquationTokenNode).token.id;
          if (nodeId) {
            return `<a id="${nodeId}"></a>\n\n${md}`;
          }
          return md;
        },
      });
      expect(markdown).toContain('<a id="eq-test">');
    });
  });

  describe("Reference text", () => {
    it("should return reference text for numbered equations", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "x = y",
        display: DisplayType.BLOCK,
        numbering: "3",
      };
      const node = factory.createNode(token) as EquationTokenNode;

      expect(node).toBeDefined();
      expect(node.getReferenceText()).toBe("(3)");
    });

    it("should return null for unnumbered equations", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "x = y",
        display: DisplayType.BLOCK,
      };
      const node = factory.createNode(token) as EquationTokenNode;

      expect(node).toBeDefined();
      expect(node.getReferenceText()).toBeNull();
    });
  });

  describe("Label export", () => {
    it("should include labels in block equation LaTeX export", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "E = mc^2",
        display: DisplayType.BLOCK,
        labels: ["eq:einstein"],
      };
      const node = factory.createNode(token) as EquationTokenNode;

      const latex = node.getLatexContent();
      expect(latex).toContain("\\label{eq:einstein}");
      expect(latex).toContain("E = mc^2");
    });

    it("should include labels in numbered equation LaTeX export", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "a^2 + b^2 = c^2",
        display: DisplayType.BLOCK,
        numbering: "1",
        labels: ["eq:pythagoras"],
      };
      const node = factory.createNode(token) as EquationTokenNode;

      const latex = node.getLatexContent();
      expect(latex).toContain("\\begin{equation}");
      expect(latex).toContain("\\label{eq:pythagoras}");
      expect(latex).toContain("\\end{equation}");
    });

    it("should not include labels for inline equations", () => {
      const token = {
        type: TokenType.EQUATION,
        content: "x = y",
        display: DisplayType.INLINE,
        labels: ["eq:inline"],
      };
      const node = factory.createNode(token) as EquationTokenNode;

      const latex = node.getLatexContent();
      expect(latex).not.toContain("\\label");
      expect(latex).toBe("$x = y$");
    });
  });
});

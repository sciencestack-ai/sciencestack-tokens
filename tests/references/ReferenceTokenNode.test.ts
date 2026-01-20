import { describe, it, expect } from "vitest";
import { ReferenceTokenNode } from "../../src/references/ReferenceTokenNode";
import { TokenType } from "../../src/types";
import { TokenNodeFactory } from "../../src/base/TokenNodeFactory";

describe("ReferenceTokenNode", () => {
  const factory = new TokenNodeFactory();

  describe("Basic functionality", () => {
    it("should create a reference node", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:example"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();
      expect(node.type).toBe(TokenType.REF);
      expect(node.getData()).toEqual(["fig:example"]);
    });

    it("should be inline", () => {
      const token = {
        type: TokenType.REF,
        content: ["sec:intro"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();
      expect(node.isInline).toBe(true);
    });

    it("should handle multiple references", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:1", "fig:2", "fig:3"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();
      expect(node.getData()).toEqual(["fig:1", "fig:2", "fig:3"]);
    });
  });

  describe("LaTeX export", () => {
    it("should export to LaTeX format", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:example"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toBe("\\ref{fig:example}");
    });

    it("should handle multiple references in LaTeX", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:1", "fig:2"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toBe("\\ref{fig:1,fig:2}");
    });

    it("should include title in LaTeX if provided", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:example"],
        title: [{ type: TokenType.TEXT, content: "Figure" }],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toContain("[Figure]");
      expect(latex).toContain("fig:example");
    });
  });

  describe("Markdown export without resolver", () => {
    it("should export to markdown with label as fallback", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:example"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();
      const markdown = node.getMarkdownContent();
      expect(markdown).toBe("[fig:example](#fig:example)");
    });

    it("should handle multiple references", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:1", "fig:2"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();
      const markdown = node.getMarkdownContent();
      expect(markdown).toContain("[fig:1](#fig:1)");
      expect(markdown).toContain("[fig:2](#fig:2)");
      expect(markdown).toContain(", ");
    });

    it("should handle references in math mode", () => {
      const token = {
        type: TokenType.REF,
        content: ["eq:example"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();
      const markdown = node.getMarkdownContent({ math: true });
      expect(markdown).toContain("\\text{Ref eq:example}");
      expect(markdown).not.toContain("#");
    });
  });

  describe("Markdown export with labelResolver", () => {
    it("should use labelResolver to resolve reference text", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:example"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();

      // Create a mock resolver
      const resolver = (label: string) => {
        if (label === "fig:example") {
          return {
            getReferenceText: () => "Figure 1",
          };
        }
        return null;
      };

      const markdown = node.getMarkdownContent({ labelResolver: resolver });
      expect(markdown).toBe("[Figure 1](#fig:example)");
    });

    it("should handle multiple references with resolver", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:1", "fig:2"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();

      const resolver = (label: string) => {
        const mapping: Record<string, string> = {
          "fig:1": "Figure 1",
          "fig:2": "Figure 2",
        };

        const resolved = mapping[label];
        if (resolved) {
          return {
            getReferenceText: () => resolved,
          };
        }
        return null;
      };

      const markdown = node.getMarkdownContent({ labelResolver: resolver });
      expect(markdown).toContain("[Figure 1](#fig:1)");
      expect(markdown).toContain("[Figure 2](#fig:2)");
    });

    it("should fallback to label if resolver returns null", () => {
      const token = {
        type: TokenType.REF,
        content: ["unknown:ref"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();

      const resolver = () => null;

      const markdown = node.getMarkdownContent({ labelResolver: resolver });
      expect(markdown).toBe("[unknown:ref](#unknown:ref)");
    });

    it("should handle partial resolution (only reference text)", () => {
      const token = {
        type: TokenType.REF,
        content: ["sec:intro"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();

      const resolver = () => ({
        getReferenceText: () => "Section 1",
      });

      const markdown = node.getMarkdownContent({ labelResolver: resolver });
      expect(markdown).toBe("[Section 1](#sec:intro)");
    });

    it("should use id for anchor href when provided", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:example"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();

      const resolver = (label: string) => {
        if (label === "fig:example") {
          return {
            id: "sec:5",
            getReferenceText: () => "sec:5",
          };
        }
        return null;
      };

      const markdown = node.getMarkdownContent({ labelResolver: resolver });
      expect(markdown).toBe("[sec:5](#sec:5)");
    });

    it("should use id for anchor href with different display text", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:example"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();

      const resolver = (label: string) => {
        if (label === "fig:example") {
          return {
            id: "node-123",
            getReferenceText: () => "Figure 1",
          };
        }
        return null;
      };

      const markdown = node.getMarkdownContent({ labelResolver: resolver });
      expect(markdown).toBe("[Figure 1](#node-123)");
    });

    it("should handle multiple references with id in resolver", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:1", "fig:2"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();

      const labelMap: Record<string, string> = {
        "fig:1": "node-1",
        "fig:2": "node-2",
      };

      const resolver = (label: string) => {
        const nodeId = labelMap[label];
        if (!nodeId) return null;
        return {
          id: nodeId,
          getReferenceText: () => nodeId,
        };
      };

      const markdown = node.getMarkdownContent({ labelResolver: resolver });
      expect(markdown).toContain("[node-1](#node-1)");
      expect(markdown).toContain("[node-2](#node-2)");
    });

    it("should fallback to label for href when id is not provided", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:example"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();

      // Resolver returns getReferenceText but no id
      const resolver = () => ({
        getReferenceText: () => "Figure 1",
      });

      const markdown = node.getMarkdownContent({ labelResolver: resolver });
      // Display text is "Figure 1", but href falls back to label
      expect(markdown).toBe("[Figure 1](#fig:example)");
    });
  });

  describe("Copy content with labelResolver", () => {
    it("should use labelResolver for copy content", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:example"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();

      const resolver = (label: string) => ({
        getReferenceText: () => "Figure 1",
      });

      const copy = node.getCopyContent({ labelResolver: resolver });
      expect(copy).toBe("Figure 1");
    });

    it("should fallback to LaTeX without resolver", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:example"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();
      const copy = node.getCopyContent();
      expect(copy).toBe("\\ref{fig:example}");
    });

    it("should handle multiple references in copy", () => {
      const token = {
        type: TokenType.REF,
        content: ["fig:1", "fig:2"],
      };
      const node = factory.createNode(token) as ReferenceTokenNode;

      expect(node).toBeDefined();

      const resolver = (label: string) => {
        const mapping: Record<string, string> = {
          "fig:1": "Figure 1",
          "fig:2": "Figure 2",
        };
        return {
          getReferenceText: () => mapping[label],
        };
      };

      const copy = node.getCopyContent({ labelResolver: resolver });
      expect(copy).toBe("Figure 1, Figure 2");
    });
  });
});

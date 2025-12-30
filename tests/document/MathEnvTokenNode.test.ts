import { describe, it, expect } from "vitest";
import { MathEnvTokenNode } from "../../src/document/MathEnvTokenNode";
import { TokenType } from "../../src/types";
import { TokenNodeFactory } from "../../src/base/TokenNodeFactory";

describe("MathEnvTokenNode", () => {
  const factory = new TokenNodeFactory();

  describe("Basic math environment", () => {
    it("should create a math env with name", () => {
      const token = {
        type: TokenType.MATH_ENV,
        name: "theorem",
        content: [
          { type: TokenType.TEXT, content: "This is a theorem." },
        ],
      };
      const node = factory.createNode(token) as MathEnvTokenNode;

      expect(node).toBeDefined();
      expect(node.name).toBe("theorem");
    });

    it("should default to 'theorem' when name is missing", () => {
      const token = {
        type: TokenType.MATH_ENV,
        content: [
          { type: TokenType.TEXT, content: "Main separation phenomenon" },
        ],
      } as any; // cast to bypass type check for missing name
      const node = factory.createNode(token) as MathEnvTokenNode;

      expect(node).toBeDefined();
      expect(node.name).toBe("theorem");
    });

    it("should export to markdown without error when name is missing", () => {
      const token = {
        type: TokenType.MATH_ENV,
        id: "thm:1.1",
        content: [
          { type: TokenType.TEXT, id: "thm:1.1:0", content: "Main separation phenomenon" },
        ],
      } as any;
      const node = factory.createNode(token) as MathEnvTokenNode;

      expect(node).toBeDefined();
      const markdown = node.getMarkdownContent();
      expect(markdown).toContain("Theorem");
      expect(markdown).toContain("Main separation phenomenon");
    });

    it("should export to latex without error when name is missing", () => {
      const token = {
        type: TokenType.MATH_ENV,
        content: [
          { type: TokenType.TEXT, content: "Some content" },
        ],
      } as any;
      const node = factory.createNode(token) as MathEnvTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toContain("\\begin{theorem}");
      expect(latex).toContain("\\end{theorem}");
    });
  });

  describe("Numbered math environment", () => {
    it("should include numbering in markdown", () => {
      const token = {
        type: TokenType.MATH_ENV,
        name: "lemma",
        numbering: "2.1",
        content: [
          { type: TokenType.TEXT, content: "A lemma statement." },
        ],
      };
      const node = factory.createNode(token) as MathEnvTokenNode;

      expect(node).toBeDefined();
      const markdown = node.getMarkdownContent();
      expect(markdown).toContain("Lemma 2.1");
    });

    it("should return reference text for numbered environments", () => {
      const token = {
        type: TokenType.MATH_ENV,
        name: "proposition",
        numbering: "3",
        content: [
          { type: TokenType.TEXT, content: "A proposition." },
        ],
      };
      const node = factory.createNode(token) as MathEnvTokenNode;

      expect(node).toBeDefined();
      expect(node.getReferenceText()).toBe("proposition 3");
    });

    it("should return null for unnumbered environments", () => {
      const token = {
        type: TokenType.MATH_ENV,
        name: "remark",
        content: [
          { type: TokenType.TEXT, content: "A remark." },
        ],
      };
      const node = factory.createNode(token) as MathEnvTokenNode;

      expect(node).toBeDefined();
      expect(node.getReferenceText()).toBeNull();
    });
  });

  describe("Math environment with title", () => {
    it("should include title in markdown", () => {
      const token = {
        type: TokenType.MATH_ENV,
        name: "theorem",
        title: [{ type: TokenType.TEXT, content: "Main Result" }],
        content: [
          { type: TokenType.TEXT, content: "The main theorem." },
        ],
      };
      const node = factory.createNode(token) as MathEnvTokenNode;

      expect(node).toBeDefined();
      const markdown = node.getMarkdownContent();
      expect(markdown).toContain("Main Result");
    });

    it("should include title in latex", () => {
      const token = {
        type: TokenType.MATH_ENV,
        name: "corollary",
        title: [{ type: TokenType.TEXT, content: "Important" }],
        content: [
          { type: TokenType.TEXT, content: "A corollary." },
        ],
      };
      const node = factory.createNode(token) as MathEnvTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toContain("\\begin{corollary}[Important]");
    });
  });

  describe("Text export", () => {
    it("should export with name and content", () => {
      const token = {
        type: TokenType.MATH_ENV,
        name: "theorem",
        content: [{ type: TokenType.TEXT, content: "A theorem statement." }],
      };
      const node = factory.createNode(token) as MathEnvTokenNode;

      const text = node.getCopyContent();
      expect(text).toBe("Theorem\n\nA theorem statement.");
    });

    it("should include numbering in text export", () => {
      const token = {
        type: TokenType.MATH_ENV,
        name: "lemma",
        numbering: "2.1",
        content: [{ type: TokenType.TEXT, content: "A lemma statement." }],
      };
      const node = factory.createNode(token) as MathEnvTokenNode;

      const text = node.getCopyContent();
      expect(text).toBe("Lemma 2.1\n\nA lemma statement.");
    });

    it("should include title in text export", () => {
      const token = {
        type: TokenType.MATH_ENV,
        name: "theorem",
        numbering: "1",
        title: [{ type: TokenType.TEXT, content: "Main Result" }],
        content: [{ type: TokenType.TEXT, content: "The main theorem." }],
      };
      const node = factory.createNode(token) as MathEnvTokenNode;

      const text = node.getCopyContent();
      expect(text).toBe("Theorem 1: Main Result\n\nThe main theorem.");
    });
  });

  describe("Label export", () => {
    it("should include labels in LaTeX export", () => {
      const token = {
        type: TokenType.MATH_ENV,
        name: "theorem",
        content: [
          { type: TokenType.TEXT, content: "A theorem." },
        ],
        labels: ["thm:main"],
      };
      const node = factory.createNode(token) as MathEnvTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toContain("\\begin{theorem}");
      expect(latex).toContain("\\label{thm:main}");
      expect(latex).toContain("\\end{theorem}");
    });

    it("should include multiple labels in LaTeX export", () => {
      const token = {
        type: TokenType.MATH_ENV,
        name: "lemma",
        content: [
          { type: TokenType.TEXT, content: "A lemma." },
        ],
        labels: ["lem:first", "lem:key"],
      };
      const node = factory.createNode(token) as MathEnvTokenNode;

      const latex = node.getLatexContent();
      expect(latex).toContain("\\label{lem:first}");
      expect(latex).toContain("\\label{lem:key}");
    });
  });
});

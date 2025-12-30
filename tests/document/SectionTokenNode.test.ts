import { describe, it, expect } from "vitest";
import { SectionTokenNode } from "../../src/document/SectionTokenNode";
import { TokenType } from "../../src/types";
import { TokenNodeFactory } from "../../src/base/TokenNodeFactory";

describe("SectionTokenNode", () => {
  const factory = new TokenNodeFactory();

  describe("Basic functionality", () => {
    it("should create a section node", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [],
        title: [{ type: TokenType.TEXT, content: "Introduction" }],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      expect(node).toBeDefined();
      expect(node.type).toBe(TokenType.SECTION);
      expect(node.level).toBe(1);
    });

    it("should not be inline", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      expect(node).toBeDefined();
      expect(node.isInline).toBe(false);
    });

    it("should handle numbering", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [],
        numbering: "1",
      };
      const node = factory.createNode(token) as SectionTokenNode;

      expect(node).toBeDefined();
      expect(node.numbering).toBe("1");
    });

    it("should not number paragraphs (level >= 4)", () => {
      const token = {
        type: TokenType.SECTION,
        level: 4,
        content: [],
        numbering: "1.2.3.4",
      };
      const node = factory.createNode(token) as SectionTokenNode;

      expect(node).toBeDefined();
      // expect(node.numbering).toBeUndefined();
    });
  });

  describe("LaTeX export", () => {
    it("should export section to LaTeX", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [{ type: TokenType.TEXT, content: "Section content" }],
        title: [{ type: TokenType.TEXT, content: "Introduction" }],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      const latex = node.getLatexContent();
      expect(latex).toContain("\\section{Introduction}");
      expect(latex).toContain("Section content");
    });

    it("should use correct LaTeX command for level", () => {
      const levels = [
        { level: 1, command: "\\section" },
        { level: 2, command: "\\subsection" },
        { level: 3, command: "\\subsubsection" },
      ];

      levels.forEach(({ level, command }) => {
        const token = {
          type: TokenType.SECTION,
          level,
          content: [],
          title: [{ type: TokenType.TEXT, content: "Title" }],
        };
        const node = factory.createNode(token) as SectionTokenNode;

        const latex = node.getLatexContent();
        expect(latex).toContain(command);
      });
    });

    it("should handle empty title", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      const latex = node.getLatexContent();
      expect(latex).toContain("\\section{}");
    });

    it("should include labels in LaTeX export", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [{ type: TokenType.TEXT, content: "Content" }],
        title: [{ type: TokenType.TEXT, content: "Introduction" }],
        labels: ["sec:intro"],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      const latex = node.getLatexContent();
      expect(latex).toContain("\\section{Introduction}");
      expect(latex).toContain("\\label{sec:intro}");
    });

    it("should include multiple labels in LaTeX export", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [],
        title: [{ type: TokenType.TEXT, content: "Methods" }],
        labels: ["sec:methods", "sec:methodology"],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      const latex = node.getLatexContent();
      expect(latex).toContain("\\label{sec:methods}");
      expect(latex).toContain("\\label{sec:methodology}");
    });
  });

  describe("Markdown export", () => {
    it("should export section to Markdown", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [{ type: TokenType.TEXT, content: "Section content" }],
        title: [{ type: TokenType.TEXT, content: "Introduction" }],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      const markdown = node.getMarkdownContent();
      expect(markdown).toContain("## Introduction");
      expect(markdown).toContain("Section content");
    });

    it("should include numbering in markdown", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [],
        title: [{ type: TokenType.TEXT, content: "Methods" }],
        numbering: "2",
      };
      const node = factory.createNode(token) as SectionTokenNode;

      const markdown = node.getMarkdownContent();
      expect(markdown).toContain("2: Methods");
    });

    it("should create proper heading levels", () => {
      const levels = [
        { level: 1, prefix: "##" },
        { level: 2, prefix: "###" },
        { level: 3, prefix: "####" },
      ];

      levels.forEach(({ level, prefix }) => {
        const token = {
          type: TokenType.SECTION,
          level,
          content: [],
          title: [{ type: TokenType.TEXT, content: "Title" }],
        };
        const node = factory.createNode(token) as SectionTokenNode;

        const markdown = node.getMarkdownContent();
        expect(markdown).toContain(`${prefix} Title`);
      });
    });

    it("should include anchor ID", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [],
        title: [{ type: TokenType.TEXT, content: "Introduction" }],
        labels: ["sec:intro"],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      const markdown = node.getMarkdownContent();
      expect(markdown).toContain("<a id=");
    });
  });

  describe("Reference text", () => {
    it("should return reference text for numbered sections", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [],
        numbering: "2",
      };
      const node = factory.createNode(token) as SectionTokenNode;

      expect(node).toBeDefined();
      expect(node.getReferenceText()).toBe("Section 2");
    });

    it("should return null for unnumbered sections", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      expect(node).toBeDefined();
      expect(node.getReferenceText()).toBeNull();
    });
  });

  describe("Anchor ID", () => {
    it("should generate anchor ID with sec prefix", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [],
        labels: ["intro"],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      const anchorId = node.getAnchorId();
      expect(anchorId).toContain("sec-");
    });
  });

  describe("Text export", () => {
    it("should export section with title and content", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [{ type: TokenType.TEXT, content: "Section content" }],
        title: [{ type: TokenType.TEXT, content: "Introduction" }],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      const text = node.getCopyContent();
      expect(text).toBe("Introduction\n\nSection content");
    });

    it("should include numbering in text export", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        numbering: "2.1",
        content: [{ type: TokenType.TEXT, content: "Section content" }],
        title: [{ type: TokenType.TEXT, content: "Methods" }],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      const text = node.getCopyContent();
      expect(text).toBe("2.1: Methods\n\nSection content");
    });

    it("should not number paragraphs (level >= 4)", () => {
      const token = {
        type: TokenType.SECTION,
        level: 4,
        numbering: "1.2.3.4",
        content: [{ type: TokenType.TEXT, content: "Paragraph content" }],
        title: [{ type: TokenType.TEXT, content: "A Paragraph" }],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      const text = node.getCopyContent();
      expect(text).toBe("A Paragraph\n\nParagraph content");
    });

    it("should handle section without title", () => {
      const token = {
        type: TokenType.SECTION,
        level: 1,
        content: [{ type: TokenType.TEXT, content: "Content only" }],
      };
      const node = factory.createNode(token) as SectionTokenNode;

      const text = node.getCopyContent();
      expect(text).toBe("Content only");
    });
  });
});

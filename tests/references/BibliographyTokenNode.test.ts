import { describe, it, expect } from "vitest";
import { BibliographyTokenNode } from "../../src/references/BibliographyTokenNode";
import { BibitemTokenNode } from "../../src/references/BibitemTokenNode";
import { TokenType, BibFormat } from "../../src/types";
import { TokenNodeFactory } from "../../src/base/TokenNodeFactory";

describe("BibliographyTokenNode", () => {
  const factory = new TokenNodeFactory();

  const createBibitemToken = (
    key: string,
    content: string,
    format: BibFormat = BibFormat.BIBITEM
  ) => ({
    type: TokenType.BIBITEM,
    key,
    format,
    content,
  });

  const createBibtexToken = (key: string, bibtexContent: string) => ({
    type: TokenType.BIBITEM,
    key,
    format: BibFormat.BIBTEX,
    content: bibtexContent,
    fields: {
      author: "Smith, John",
      title: "A Sample Paper",
      year: "2020",
      journal: "Sample Journal",
    },
  });

  describe("Basic functionality", () => {
    it("should create a bibliography node", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [createBibitemToken("smith2020", "Smith, J. (2020). A paper.")],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      expect(node).toBeDefined();
      expect(node.type).toBe(TokenType.BIBLIOGRAPHY);
    });

    it("should return children as BibitemTokenNode via getData()", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [
          createBibitemToken("smith2020", "Smith, J. (2020). A paper."),
          createBibitemToken("jones2021", "Jones, A. (2021). Another paper."),
        ],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const data = node.getData();
      expect(data).toHaveLength(2);
      expect(data[0]).toBeInstanceOf(BibitemTokenNode);
      expect(data[1]).toBeInstanceOf(BibitemTokenNode);
    });

    it("should find bibitem by key", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [
          createBibitemToken("smith2020", "Smith, J. (2020). A paper."),
          createBibitemToken("jones2021", "Jones, A. (2021). Another paper."),
        ],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const found = node.getBibitemByKey("jones2021");
      expect(found).toBeDefined();
      expect(found?.key).toBe("jones2021");

      const notFound = node.getBibitemByKey("nonexistent");
      expect(notFound).toBeUndefined();
    });

    it("should get bibitem index", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [
          createBibitemToken("smith2020", "Smith, J. (2020). A paper."),
          createBibitemToken("jones2021", "Jones, A. (2021). Another paper."),
        ],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const data = node.getData();
      expect(node.getBibitemIndex(data[0])).toBe(0);
      expect(node.getBibitemIndex(data[1])).toBe(1);
    });
  });

  describe("LaTeX export", () => {
    it("should wrap bibitem entries in thebibliography environment", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [createBibitemToken("smith2020", "Smith, J. (2020). A paper.")],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const latex = node.getLatexContent();
      expect(latex).toContain("\\begin{thebibliography}{99}");
      expect(latex).toContain("\\end{thebibliography}");
    });

    it("should include bibitem content in LaTeX output", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [createBibitemToken("smith2020", "Smith, J. (2020). A paper.")],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const latex = node.getLatexContent();
      expect(latex).toContain("\\bibitem{smith2020}");
      expect(latex).toContain("Smith, J. (2020). A paper.");
    });

    it("should handle multiple bibitem entries", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [
          createBibitemToken("smith2020", "Smith, J. (2020). First paper."),
          createBibitemToken("jones2021", "Jones, A. (2021). Second paper."),
        ],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const latex = node.getLatexContent();
      expect(latex).toContain("\\begin{thebibliography}{99}");
      expect(latex).toContain("\\bibitem{smith2020}");
      expect(latex).toContain("First paper.");
      expect(latex).toContain("\\bibitem{jones2021}");
      expect(latex).toContain("Second paper.");
      expect(latex).toContain("\\end{thebibliography}");
    });

    it("should wrap bibtex entries in thebibliography environment", () => {
      const bibtexContent = `@article{smith2020,
  author = {Smith, John},
  title = {A Sample Paper},
  journal = {Sample Journal},
  year = {2020}
}`;
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [createBibtexToken("smith2020", bibtexContent)],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const latex = node.getLatexContent();
      expect(latex).toContain("\\begin{thebibliography}{99}");
      expect(latex).toContain("\\end{thebibliography}");
    });

    it("should have proper structure with begin before content and end after", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [createBibitemToken("test2020", "Test content here.")],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const latex = node.getLatexContent();
      const beginIndex = latex.indexOf("\\begin{thebibliography}");
      const contentIndex = latex.indexOf("\\bibitem{test2020}");
      const endIndex = latex.indexOf("\\end{thebibliography}");

      expect(beginIndex).toBeLessThan(contentIndex);
      expect(contentIndex).toBeLessThan(endIndex);
    });

    it("should handle empty bibliography", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const latex = node.getLatexContent();
      expect(latex).toContain("\\begin{thebibliography}{99}");
      expect(latex).toContain("\\end{thebibliography}");
    });
  });

  describe("Markdown export", () => {
    it("should include References heading", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [createBibitemToken("smith2020", "Smith, J. (2020). A paper.")],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const markdown = node.getMarkdownContent();
      expect(markdown).toContain("## References");
    });

    it("should include bibitem content as list items", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [createBibitemToken("smith2020", "Smith, J. (2020). A paper.")],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const markdown = node.getMarkdownContent();
      expect(markdown).toContain("[smith2020]");
      expect(markdown).toContain("Smith, J. (2020). A paper.");
    });

    it("should include anchors for each bibitem", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [createBibitemToken("smith2020", "Smith, J. (2020). A paper.")],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const markdown = node.getMarkdownContent({ includeAnchors: true });
      expect(markdown).toContain('<a id="bib-smith2020"></a>');
    });

    it("should handle multiple entries", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [
          createBibitemToken("smith2020", "Smith, J. (2020). First paper."),
          createBibitemToken("jones2021", "Jones, A. (2021). Second paper."),
        ],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const markdown = node.getMarkdownContent({ includeAnchors: true });
      expect(markdown).toContain("[smith2020]");
      expect(markdown).toContain("[jones2021]");
      expect(markdown).toContain('<a id="bib-smith2020"></a>');
      expect(markdown).toContain('<a id="bib-jones2021"></a>');
    });
  });

  describe("Copy content", () => {
    it("should return concatenated citation text", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [
          createBibitemToken("smith2020", "Smith, J. (2020). First paper."),
          createBibitemToken("jones2021", "Jones, A. (2021). Second paper."),
        ],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const copy = node.getCopyContent();
      expect(copy).toContain("Smith, J. (2020). First paper.");
      expect(copy).toContain("Jones, A. (2021). Second paper.");
    });

    it("should separate entries with newlines", () => {
      const token = {
        type: TokenType.BIBLIOGRAPHY,
        content: [
          createBibitemToken("smith2020", "First"),
          createBibitemToken("jones2021", "Second"),
        ],
      };
      const node = factory.createNode(token) as BibliographyTokenNode;

      const copy = node.getCopyContent();
      expect(copy).toBe("First\nSecond");
    });
  });
});

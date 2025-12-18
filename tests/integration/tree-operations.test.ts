import { describe, it, expect, beforeEach } from "vitest";
import { TokenNodeFactory } from "../../src/base/TokenNodeFactory";
import { BaseToken, TokenType } from "../../src/types";
import { DocumentTokenNode } from "../../src/document/DocumentTokenNode";
import { SectionTokenNode } from "../../src/document/SectionTokenNode";
import { processTokenNodes } from "../../src/tokenProcessing";

describe("Tree Operations Integration Tests", () => {
  let factory: TokenNodeFactory;

  beforeEach(() => {
    factory = new TokenNodeFactory();
  });

  describe("Building complex document trees", () => {
    it("should build a document with nested sections", () => {
      const documentToken = {
        type: TokenType.DOCUMENT,
        content: [
          {
            type: TokenType.SECTION,
            level: 1,
            content: [
              { type: TokenType.TEXT, content: "Section 1 content" },
              {
                type: TokenType.SECTION,
                level: 2,
                content: [
                  { type: TokenType.TEXT, content: "Subsection 1.1 content" },
                ],
              },
            ],
            title: [{ type: TokenType.TEXT, content: "Introduction" }],
          },
        ],
      };

      const doc = factory.createNode(documentToken) as DocumentTokenNode;

      expect(doc).toBeDefined();
      expect(doc.hasChildren()).toBe(true);
      expect(doc.children.length).toBe(1);

      const section = doc.getFirstChild() as SectionTokenNode;
      expect(section.type).toBe(TokenType.SECTION);
      expect(section.level).toBe(1);
    });

    it("should maintain parent-child relationships in deep trees", () => {
      const documentToken = {
        type: TokenType.DOCUMENT,
        content: [
          {
            type: TokenType.SECTION,
            level: 1,
            content: [
              {
                type: TokenType.SECTION,
                level: 2,
                content: [
                  {
                    type: TokenType.SECTION,
                    level: 3,
                    content: [
                      { type: TokenType.TEXT, content: "Deep content" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const doc = factory.createNode(documentToken) as DocumentTokenNode;

      // Traverse to find text node
      let textNode = doc.getFirstLeaf();
      expect(textNode.type).toBe(TokenType.TEXT);
      expect(textNode.getDepth()).toBe(4);
      expect(textNode.getRoot()).toBe(doc);
    });
  });

  describe("Cross-references in document", () => {
    it("should resolve references using findByLabel", () => {
      const documentToken = {
        type: TokenType.DOCUMENT,
        content: [
          {
            type: TokenType.SECTION,
            level: 1,
            content: [],
            labels: ["sec:intro"],
            numbering: "1",
            title: [{ type: TokenType.TEXT, content: "Introduction" }],
          },
          {
            type: TokenType.SECTION,
            level: 1,
            content: [
              {
                type: TokenType.TEXT,
                content: "See ",
              },
              {
                type: TokenType.REF,
                content: ["sec:intro"],
              },
            ],
            title: [{ type: TokenType.TEXT, content: "Related Work" }],
          },
        ],
      };

      const doc = factory.createNode(documentToken) as DocumentTokenNode;

      // Find the section by label
      const introSection = doc.findByLabel("sec:intro");
      expect(introSection).toBeDefined();
      expect(introSection!.type).toBe(TokenType.SECTION);

      const sectionNode = introSection as SectionTokenNode;
      expect(sectionNode.getReferenceText()).toBe("Section 1");
    });

    it("should create a labelResolver from document root", () => {
      const documentToken = {
        type: TokenType.DOCUMENT,
        content: [
          {
            type: TokenType.EQUATION,
            content: "E = mc^2",
            display: "block",
            labels: ["eq:einstein"],
            numbering: "1",
          },
          {
            type: TokenType.SECTION,
            level: 1,
            content: [
              {
                type: TokenType.TEXT,
                content: "As shown in equation ",
              },
              {
                type: TokenType.REF,
                content: ["eq:einstein"],
              },
            ],
          },
        ],
      };

      const doc = factory.createNode(documentToken) as DocumentTokenNode;

      // Create a resolver function
      const resolver = (label: string) => doc.findByLabel(label);

      // Find the reference node
      const refNode = doc.children[1].children.find(
        (child) => child.type === TokenType.REF
      );
      expect(refNode).toBeDefined();

      // Use the resolver in markdown generation
      const markdown = refNode!.getMarkdownContent({ labelResolver: resolver });
      expect(markdown).toContain("(1)"); // Should resolve to equation number
    });
  });

  describe("Processing token arrays", () => {
    it("should process array of tokens into nodes", () => {
      const tokens = [
        { type: TokenType.TEXT, content: "Text 1" },
        { type: TokenType.TEXT, content: "Text 2" },
        { type: TokenType.TEXT, content: "Text 3" },
      ];

      const nodes = processTokenNodes(tokens);

      expect(nodes.length).toBe(3);
      expect(nodes[0].type).toBe(TokenType.TEXT);
      expect(nodes[1].type).toBe(TokenType.TEXT);
      expect(nodes[2].type).toBe(TokenType.TEXT);
    });

    it("should filter excluded token types", () => {
      const tokens: any[] = [
        { type: TokenType.TEXT, content: "Text" },
        { type: TokenType.CITATION, content: ["cite1"] },
        { type: TokenType.EQUATION, content: "x = y", display: "inline" },
      ];

      const nodes = processTokenNodes(tokens, [TokenType.CITATION]);

      expect(nodes.length).toBe(2);
      expect(nodes.find((n) => n.type === TokenType.CITATION)).toBeUndefined();
    });
  });

  describe("Sibling navigation in complex trees", () => {
    it("should navigate between siblings at same level", () => {
      const documentToken = {
        type: TokenType.DOCUMENT,
        content: [
          {
            type: TokenType.SECTION,
            level: 1,
            content: [],
            title: [{ type: TokenType.TEXT, content: "Intro" }],
          },
          {
            type: TokenType.SECTION,
            level: 1,
            content: [],
            title: [{ type: TokenType.TEXT, content: "Methods" }],
          },
          {
            type: TokenType.SECTION,
            level: 1,
            content: [],
            title: [{ type: TokenType.TEXT, content: "Results" }],
          },
        ],
      };

      const doc = factory.createNode(documentToken) as DocumentTokenNode;
      const children = doc.getChildren();

      expect(children[0].getNextSibling()).toBe(children[1]);
      expect(children[1].getNextSibling()).toBe(children[2]);
      expect(children[2].getNextSibling()).toBeNull();

      expect(children[2].getPreviousSibling()).toBe(children[1]);
      expect(children[1].getPreviousSibling()).toBe(children[0]);
      expect(children[0].getPreviousSibling()).toBeNull();
    });
  });

  describe("Finding nodes with predicates", () => {
    it("should find parent matching specific criteria", () => {
      const documentToken = {
        type: TokenType.DOCUMENT,
        content: [
          {
            type: TokenType.SECTION,
            level: 1,
            content: [
              {
                type: TokenType.FIGURE,
                content: [
                  {
                    type: TokenType.CAPTION,
                    content: [
                      { type: TokenType.TEXT, content: "Figure caption" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const doc = factory.createNode(documentToken) as DocumentTokenNode;
      const textNode = doc.getFirstLeaf();

      const captionParent = textNode.findParentMatching(
        (node) => node.type === TokenType.CAPTION
      );
      expect(captionParent).toBeDefined();
      expect(captionParent!.type).toBe(TokenType.CAPTION);

      const figureParent = textNode.findParentMatching(
        (node) => node.type === TokenType.FIGURE
      );
      expect(figureParent).toBeDefined();
      expect(figureParent!.type).toBe(TokenType.FIGURE);

      const sectionParent = textNode.findParentMatching(
        (node) => node.type === TokenType.SECTION
      );
      expect(sectionParent).toBeDefined();
      expect(sectionParent!.type).toBe(TokenType.SECTION);
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { AbstractTokenNode } from "../../src/base/AbstractTokenNode";
import { TokenType } from "../../src/types";
import { TextTokenNode } from "../../src/content/TextTokenNode";
import { SectionTokenNode } from "../../src/document/SectionTokenNode";
import { TokenNodeFactory } from "../../src/base/TokenNodeFactory";

describe("AbstractTokenNode", () => {
  let factory: TokenNodeFactory;

  beforeEach(() => {
    factory = new TokenNodeFactory();
  });

  // Helper functions to create valid tokens with proper typing
  const createTextToken = (content: string, overrides: any = {}) =>
    factory.createNode({
      type: TokenType.TEXT,
      content,
      ...overrides,
    });

  const createSectionToken = (overrides: any = {}) =>
    factory.createNode({
      type: TokenType.SECTION,
      level: 1,
      content: [],
      title: [],
      id: `section-${Date.now()}-${Math.random()}`,
      ...overrides,
    });

  const createDocumentToken = (overrides: any = {}) =>
    factory.createNode({
      type: TokenType.DOCUMENT,
      content: [],
      ...overrides,
    });

  describe("Node creation and properties", () => {
    it("should create a node with basic properties", () => {
      const token = {
        type: TokenType.TEXT,
        content: "Hello",
        id: "test-1",
      };
      const node = factory.createNode(token);

      expect(node).toBeDefined();
      expect(node!.id).toBe("test-1");
      expect(node!.type).toBe(TokenType.TEXT);
    });

    it("should generate an ID if not provided", () => {
      const node = createTextToken("Hello");

      expect(node).toBeDefined();
      expect(node!.id).toBeDefined();
      expect(node!.id.length).toBeGreaterThan(0);
    });

    it("should handle labels", () => {
      const node = createTextToken("Hello", { labels: ["label1", "label2"] });

      expect(node).toBeDefined();
      expect(node!.labels).toEqual(["label1", "label2"]);
    });

    it("should handle styles", () => {
      const node = createTextToken("Hello", { styles: ["bold", "italic"] });

      expect(node).toBeDefined();
      expect(node!.styles).toEqual(["bold", "italic"]);
    });
  });

  describe("Parent-child relationships", () => {
    it("should add child nodes", () => {
      const parent = createSectionToken()!;
      const child = createTextToken("Child")!;

      parent.addChild(child);

      expect(parent.hasChildren()).toBe(true);
      expect(parent.children.length).toBe(1);
      expect(child.parent).toBe(parent);
    });

    it("should remove child nodes", () => {
      const parent = createSectionToken()!;
      const child = createTextToken("Child")!;

      parent.addChild(child);
      parent.removeChild(child);

      expect(parent.hasChildren()).toBe(false);
      expect(child.parent).toBeNull();
    });

    it("should clear all children", () => {
      const parent = createSectionToken()!;
      const child1 = createTextToken("Child 1")!;
      const child2 = createTextToken("Child 2")!;

      parent.addChild(child1);
      parent.addChild(child2);
      parent.clearChildren();

      expect(parent.hasChildren()).toBe(false);
      expect(child1.parent).toBeNull();
      expect(child2.parent).toBeNull();
    });
  });

  describe("Tree traversal", () => {
    it("should find root node", () => {
      const grandparent = createDocumentToken()!;
      const parent = createSectionToken()!;
      const child = createTextToken("Child")!;

      grandparent.addChild(parent);
      parent.addChild(child);

      expect(child.getRoot()).toBe(grandparent);
      expect(parent.getRoot()).toBe(grandparent);
      expect(grandparent.getRoot()).toBe(grandparent);
    });

    it("should calculate depth", () => {
      const grandparent = createDocumentToken()!;
      const parent = createSectionToken()!;
      const child = createTextToken("Child")!;

      grandparent.addChild(parent);
      parent.addChild(child);

      expect(grandparent.getDepth()).toBe(0);
      expect(parent.getDepth()).toBe(1);
      expect(child.getDepth()).toBe(2);
    });

    it("should find node by ID", () => {
      const parent = createSectionToken({ id: "parent" })!;
      const child1 = createTextToken("Child 1", { id: "child1" })!;
      const child2 = createTextToken("Child 2", { id: "child2" })!;

      parent.addChild(child1);
      parent.addChild(child2);

      expect(parent.findById("child1")).toBe(child1);
      expect(parent.findById("child2")).toBe(child2);
      expect(parent.findById("nonexistent")).toBeNull();
    });

    it("should find node by label", () => {
      const parent = createSectionToken()!;
      const child1 = createTextToken("Child 1", { labels: ["label1"] })!;
      const child2 = createTextToken("Child 2", { labels: ["label2"] })!;

      parent.addChild(child1);
      parent.addChild(child2);

      expect(parent.findByLabel("label1")).toBe(child1);
      expect(parent.findByLabel("label2")).toBe(child2);
      expect(parent.findByLabel("nonexistent")).toBeNull();
    });

    it("should find parent matching predicate", () => {
      const grandparent = createDocumentToken()!;
      const parent = createSectionToken()!;
      const child = createTextToken("Child")!;

      grandparent.addChild(parent);
      parent.addChild(child);

      const sectionParent = child.findParentMatching(
        (node) => node.type === TokenType.SECTION
      );
      expect(sectionParent).toBe(parent);

      const documentParent = child.findParentMatching(
        (node) => node.type === TokenType.DOCUMENT
      );
      expect(documentParent).toBe(grandparent);

      const noMatch = child.findParentMatching(
        (node) => node.type === TokenType.EQUATION
      );
      expect(noMatch).toBeNull();
    });
  });

  describe("Sibling navigation", () => {
    it("should get next sibling", () => {
      const parent = createSectionToken()!;
      const child1 = createTextToken("Child 1")!;
      const child2 = createTextToken("Child 2")!;
      const child3 = createTextToken("Child 3")!;

      parent.addChild(child1);
      parent.addChild(child2);
      parent.addChild(child3);

      expect(child1.getNextSibling()).toBe(child2);
      expect(child2.getNextSibling()).toBe(child3);
      expect(child3.getNextSibling()).toBeNull();
    });

    it("should get previous sibling", () => {
      const parent = createSectionToken()!;
      const child1 = createTextToken("Child 1")!;
      const child2 = createTextToken("Child 2")!;
      const child3 = createTextToken("Child 3")!;

      parent.addChild(child1);
      parent.addChild(child2);
      parent.addChild(child3);

      expect(child3.getPreviousSibling()).toBe(child2);
      expect(child2.getPreviousSibling()).toBe(child1);
      expect(child1.getPreviousSibling()).toBeNull();
    });
  });

  describe("Leaf node operations", () => {
    it("should get first and last leaf", () => {
      const parent = createSectionToken()!;
      const child1 = createTextToken("First")!;
      const child2 = createTextToken("Last")!;

      parent.addChild(child1);
      parent.addChild(child2);

      expect(parent.getFirstLeaf()).toBe(child1);
      expect(parent.getLastLeaf()).toBe(child2);
    });

    it("should identify leaf nodes", () => {
      const parent = createSectionToken()!;
      const child = createTextToken("Leaf")!;

      parent.addChild(child);

      expect(parent.isLeaf()).toBe(false);
      expect(child.isLeaf()).toBe(true);
    });

    it("should identify root nodes", () => {
      const parent = createSectionToken()!;
      const child = createTextToken("Child")!;

      parent.addChild(child);

      expect(parent.isRoot()).toBe(true);
      expect(child.isRoot()).toBe(false);
    });
  });

  describe("Inline detection", () => {
    it("should identify inline tokens", () => {
      const textNode = createTextToken("Text")!;
      const citationNode = factory.createNode({
        type: TokenType.CITATION,
        content: ["cite1"],
      } as any)!;
      const refNode = factory.createNode({
        type: TokenType.REF,
        content: ["ref1"],
      } as any)!;

      expect(textNode.isInline).toBe(true);
      expect(citationNode.isInline).toBe(true);
      expect(refNode.isInline).toBe(true);
    });

    it("should identify block tokens", () => {
      const sectionNode = createSectionToken()!;
      const figureNode = factory.createNode({
        type: TokenType.FIGURE,
        content: [],
      } as any)!;

      expect(sectionNode.isInline).toBe(false);
      expect(figureNode.isInline).toBe(false);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { TextTokenNode } from '../../src/content/TextTokenNode';
import { TokenType } from '../../src/types';
import { TokenNodeFactory } from '../../src/base/TokenNodeFactory';
import { AbstractTokenNode } from '../../src/base/AbstractTokenNode';

describe('TextTokenNode', () => {
  const factory = new TokenNodeFactory();

  describe('Basic functionality', () => {
    it('should create a text node', () => {
      const token = {
        type: TokenType.TEXT,
        content: 'Hello World'
      };
      const node = factory.createNode(token) as TextTokenNode;

      expect(node).toBeDefined();
      expect(node.type).toBe(TokenType.TEXT);
      expect(node.getData()).toBe('Hello World');
    });

    it('should be inline', () => {
      const token = {
        type: TokenType.TEXT,
        content: 'Test'
      };
      const node = factory.createNode(token) as TextTokenNode;

      expect(node).toBeDefined();
      expect(node.isInline).toBe(true);
    });
  });

  describe('Export functionality', () => {
    it('should export to copy content', () => {
      const token = {
        type: TokenType.TEXT,
        content: 'Hello World'
      };
      const node = factory.createNode(token) as TextTokenNode;

      expect(node).toBeDefined();
      expect(node.getCopyContent()).toBe('Hello World');
    });

    it('should export to LaTeX', () => {
      const token = {
        type: TokenType.TEXT,
        content: 'Hello World'
      };
      const node = factory.createNode(token) as TextTokenNode;

      expect(node).toBeDefined();
      expect(node.getLatexContent()).toBe('Hello World');
    });

    it('should export to Markdown', () => {
      const token = {
        type: TokenType.TEXT,
        content: 'Hello World'
      };
      const node = factory.createNode(token) as TextTokenNode;

      expect(node).toBeDefined();
      expect(node.getMarkdownContent()).toBe('Hello World');
    });

    it('should export to JSON', () => {
      const token = {
        type: TokenType.TEXT,
        content: 'Hello World',
        id: 'text-1'
      };
      const node = factory.createNode(token) as TextTokenNode;

      expect(node).toBeDefined();
      const json = node.getJSONContent();
      expect(json.type).toBe(TokenType.TEXT);
      expect(json.content).toBe('Hello World');
      expect(json.id).toBe('text-1');
    });
  });

  describe('Styled text', () => {
    it('should handle bold text in LaTeX', () => {
      const token = {
        type: TokenType.TEXT,
        content: 'Bold text',
        styles: ['bold']
      };
      const node = factory.createNode(token) as TextTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toContain('textbf');
      expect(latex).toContain('Bold text');
    });

    it('should handle italic text in LaTeX', () => {
      const token = {
        type: TokenType.TEXT,
        content: 'Italic text',
        styles: ['italic']
      };
      const node = factory.createNode(token) as TextTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toContain('emph');
      expect(latex).toContain('Italic text');
    });

    it('should handle multiple styles', () => {
      const token = {
        type: TokenType.TEXT,
        content: 'Styled text',
        styles: ['bold', 'italic']
      };
      const node = factory.createNode(token) as TextTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toContain('textbf');
      expect(latex).toContain('emph');
    });

    it('should skip styles in LaTeX when skipStyles is true', () => {
      const token = {
        type: TokenType.TEXT,
        content: 'Bold text',
        styles: ['bold']
      };
      const node = factory.createNode(token) as TextTokenNode;

      expect(node.getLatexContent()).toContain('textbf');
      expect(node.getLatexContent({ skipStyles: true })).toBe('Bold text');
    });

    it('should skip styles in Markdown when skipStyles is true', () => {
      const token = {
        type: TokenType.TEXT,
        content: 'Bold text',
        styles: ['bold']
      };
      const node = factory.createNode(token) as TextTokenNode;

      expect(node.getMarkdownContent()).toContain('**');
      expect(node.getMarkdownContent({ skipStyles: true })).toBe('Bold text');
    });
  });

  describe('onNode callback', () => {
    it('should call onNode for each node in GetLatexContent', () => {
      const node1 = factory.createNode({ type: TokenType.TEXT, content: 'Hello' }) as TextTokenNode;
      const node2 = factory.createNode({ type: TokenType.TEXT, content: 'World' }) as TextTokenNode;

      const visitedNodes: AbstractTokenNode[] = [];
      const result = AbstractTokenNode.GetLatexContent([node1, node2], {
        onNode: (node, defaultOutput) => {
          visitedNodes.push(node as AbstractTokenNode);
          return `[${defaultOutput}]`;
        }
      });

      expect(visitedNodes).toHaveLength(2);
      expect(visitedNodes[0]).toBe(node1);
      expect(visitedNodes[1]).toBe(node2);
      expect(result).toContain('[Hello]');
      expect(result).toContain('[World]');
    });

    it('should call onNode for each node in GetMarkdownContent', () => {
      const node1 = factory.createNode({ type: TokenType.TEXT, content: 'Hello' }) as TextTokenNode;
      const node2 = factory.createNode({ type: TokenType.TEXT, content: 'World' }) as TextTokenNode;

      const visitedNodes: AbstractTokenNode[] = [];
      const result = AbstractTokenNode.GetMarkdownContent([node1, node2], {
        onNode: (node, defaultOutput) => {
          visitedNodes.push(node as AbstractTokenNode);
          return `[${defaultOutput}]`;
        }
      });

      expect(visitedNodes).toHaveLength(2);
      expect(result).toContain('[Hello]');
      expect(result).toContain('[World]');
    });

    it('should allow transforming output in onNode', () => {
      const node = factory.createNode({
        type: TokenType.TEXT,
        content: 'Test',
        labels: ['eq:test']
      }) as TextTokenNode;

      const result = AbstractTokenNode.GetLatexContent([node], {
        onNode: (node, defaultOutput) => {
          // Strip labels like in user's example
          return defaultOutput.replace(/\\label\{[^}]*\}/g, '');
        }
      });

      expect(result).not.toContain('\\label');
    });

    it('should call onNode for deeply nested children recursively', () => {
      // Create a deeply nested structure:
      // root GROUP
      //   ├── GROUP (level 1)
      //   │   ├── TEXT "A"
      //   │   └── GROUP (level 2)
      //   │       ├── TEXT "B"
      //   │       └── TEXT "C"
      //   └── TEXT "D"
      const rootNode = factory.createNode({
        type: TokenType.GROUP,
        content: [
          {
            type: TokenType.GROUP,
            content: [
              { type: TokenType.TEXT, content: 'A' },
              {
                type: TokenType.GROUP,
                content: [
                  { type: TokenType.TEXT, content: 'B' },
                  { type: TokenType.TEXT, content: 'C' }
                ]
              }
            ]
          },
          { type: TokenType.TEXT, content: 'D' }
        ]
      });

      const visitedTypes: string[] = [];
      const visitedContents: string[] = [];
      AbstractTokenNode.GetLatexContent([rootNode], {
        onNode: (node, defaultOutput) => {
          const n = node as AbstractTokenNode;
          visitedTypes.push(n.type);
          visitedContents.push(defaultOutput.trim());
          return defaultOutput;
        }
      });

      // Should visit all 7 nodes: 3 GROUPs + 4 TEXTs
      expect(visitedTypes).toHaveLength(7);
      expect(visitedTypes.filter(t => t === TokenType.GROUP)).toHaveLength(3);
      expect(visitedTypes.filter(t => t === TokenType.TEXT)).toHaveLength(4);

      // Verify all text content was visited
      expect(visitedContents).toContain('A');
      expect(visitedContents).toContain('B');
      expect(visitedContents).toContain('C');
      expect(visitedContents).toContain('D');
    });

  });
});


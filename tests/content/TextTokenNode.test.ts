import { describe, it, expect } from 'vitest';
import { TextTokenNode } from '../../src/content/TextTokenNode';
import { TokenType } from '../../src/types';
import { TokenNodeFactory } from '../../src/base/TokenNodeFactory';

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
  });
});


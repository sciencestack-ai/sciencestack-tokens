import { describe, it, expect } from 'vitest';
import { CitationTokenNode } from '../../src/references/CitationTokenNode';
import { TokenType } from '../../src/types';
import { TokenNodeFactory } from '../../src/base/TokenNodeFactory';

describe('CitationTokenNode', () => {
  const factory = new TokenNodeFactory();

  describe('Basic functionality', () => {
    it('should create a citation node', () => {
      const token = {
        type: TokenType.CITATION,
        content: ['smith2020']
      };
      const node = factory.createNode(token) as CitationTokenNode;

      expect(node).toBeDefined();
      expect(node.type).toBe(TokenType.CITATION);
      expect(node.getData()).toEqual(['smith2020']);
    });

    it('should be inline', () => {
      const token = {
        type: TokenType.CITATION,
        content: ['smith2020']
      };
      const node = factory.createNode(token) as CitationTokenNode;

      expect(node).toBeDefined();
      expect(node.isInline).toBe(true);
    });

    it('should check if citation key exists', () => {
      const token = {
        type: TokenType.CITATION,
        content: ['smith2020', 'jones2021']
      };
      const node = factory.createNode(token) as CitationTokenNode;

      expect(node).toBeDefined();
      expect(node.hasCitationKey('smith2020')).toBe(true);
      expect(node.hasCitationKey('jones2021')).toBe(true);
      expect(node.hasCitationKey('doe2022')).toBe(false);
    });
  });

  describe('LaTeX export', () => {
    it('should export to LaTeX format', () => {
      const token = {
        type: TokenType.CITATION,
        content: ['smith2020']
      };
      const node = factory.createNode(token) as CitationTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toBe('\\cite{smith2020}');
    });

    it('should handle multiple citations', () => {
      const token = {
        type: TokenType.CITATION,
        content: ['smith2020', 'jones2021']
      };
      const node = factory.createNode(token) as CitationTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toBe('\\cite{smith2020,jones2021}');
    });

    it('should include title if provided', () => {
      const token = {
        type: TokenType.CITATION,
        content: ['smith2020'],
        title: [{ type: TokenType.TEXT, content: 'see' }]
      };
      const node = factory.createNode(token) as CitationTokenNode;

      expect(node).toBeDefined();
      const latex = node.getLatexContent();
      expect(latex).toContain('[see]');
      expect(latex).toContain('smith2020');
    });
  });

  describe('Markdown export', () => {
    it('should export to markdown with anchor links', () => {
      const token = {
        type: TokenType.CITATION,
        content: ['smith2020']
      };
      const node = factory.createNode(token) as CitationTokenNode;

      expect(node).toBeDefined();
      const markdown = node.getMarkdownContent();
      expect(markdown).toBe('[\\[smith2020\\]](#bib-smith2020)');
    });

    it('should handle multiple citations', () => {
      const token = {
        type: TokenType.CITATION,
        content: ['smith2020', 'jones2021']
      };
      const node = factory.createNode(token) as CitationTokenNode;

      expect(node).toBeDefined();
      const markdown = node.getMarkdownContent();
      expect(markdown).toContain('[\\[smith2020\\]](#bib-smith2020)');
      expect(markdown).toContain('[\\[jones2021\\]](#bib-jones2021)');
      expect(markdown).toContain(', ');
    });

    it('should use title if provided', () => {
      const token = {
        type: TokenType.CITATION,
        content: ['smith2020'],
        title: [{ type: TokenType.TEXT, content: 'see also' }]
      };
      const node = factory.createNode(token) as CitationTokenNode;

      expect(node).toBeDefined();
      const markdown = node.getMarkdownContent();
      expect(markdown).toContain('[\\[see also\\]](#bib-smith2020)');
    });
  });

  describe('Copy content', () => {
    it('should return LaTeX format for copy', () => {
      const token = {
        type: TokenType.CITATION,
        content: ['smith2020']
      };
      const node = factory.createNode(token) as CitationTokenNode;

      expect(node).toBeDefined();
      expect(node.getCopyContent()).toBe('\\cite{smith2020}');
    });
  });
});


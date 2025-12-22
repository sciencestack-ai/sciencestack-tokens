import { describe, it, expect } from 'vitest';
import { TokenExporter } from '../src/TokenExporter';
import { TokenNodeFactory } from '../src/base/TokenNodeFactory';
import {
  TokenType,
  BaseToken,
  TextToken,
  SectionToken,
  EquationToken,
  DisplayType
} from '../src/types';

describe('TokenExporter', () => {
  const factory = new TokenNodeFactory();

  // Helper to create test nodes with proper types
  const createTextNode = (content: string, styles?: string[]) => {
    const token: TextToken = { type: TokenType.TEXT, content, styles };
    return factory.createNode(token)!;
  };

  const createSectionNode = (title: string, content: string, level = 1) => {
    const token: SectionToken = {
      type: TokenType.SECTION,
      title: [{ type: TokenType.TEXT, content: title }],
      content: [{ type: TokenType.TEXT, content }],
      level
    };
    return factory.createNode(token)!;
  };

  const createEquationNode = (content: string, display: DisplayType = DisplayType.BLOCK, numbering?: string) => {
    const token: EquationToken = {
      type: TokenType.EQUATION,
      content,
      display,
      numbering
    };
    return factory.createNode(token)!;
  };

  describe('Static methods - literal output tests', () => {
    it('toText should return plain text', () => {
      const nodes = [createTextNode('Hello World')];
      expect(TokenExporter.toText(nodes)).toBe('Hello World');
    });

    it('toLatex should wrap styled text correctly', () => {
      const nodes = [createTextNode('bold text', ['bold'])];
      expect(TokenExporter.toLatex(nodes)).toBe('\\textbf{bold text}');
    });

    it('toLatex should wrap italic text correctly', () => {
      const nodes = [createTextNode('italic text', ['italic'])];
      expect(TokenExporter.toLatex(nodes)).toBe('\\emph{italic text}');
    });

    it('toMarkdown should wrap bold text correctly', () => {
      const nodes = [createTextNode('bold text', ['bold'])];
      expect(TokenExporter.toMarkdown(nodes)).toBe('**bold text**');
    });

    it('toMarkdown should wrap italic text correctly', () => {
      const nodes = [createTextNode('italic text', ['italic'])];
      expect(TokenExporter.toMarkdown(nodes)).toBe('*italic text*');
    });

    it('toLatex should format inline equation correctly', () => {
      const nodes = [createEquationNode('E = mc^2', DisplayType.INLINE)];
      expect(TokenExporter.toLatex(nodes)).toBe('$E = mc^2$');
    });

    it('toLatex should format block equation correctly', () => {
      const nodes = [createEquationNode('E = mc^2', DisplayType.BLOCK)];
      expect(TokenExporter.toLatex(nodes).trim()).toBe('$$\nE = mc^2\n$$');
    });

    it('toLatex should format numbered equation correctly', () => {
      const nodes = [createEquationNode('E = mc^2', DisplayType.BLOCK, '1')];
      expect(TokenExporter.toLatex(nodes).trim()).toBe('\\begin{equation}\nE = mc^2\n\\end{equation}');
    });

    it('toMarkdown should format inline equation correctly', () => {
      const nodes = [createEquationNode('x^2', DisplayType.INLINE)];
      expect(TokenExporter.toMarkdown(nodes).trim()).toBe('$x^2$');
    });

    it('toMarkdown should format block equation correctly', () => {
      const nodes = [createEquationNode('x^2', DisplayType.BLOCK)];
      expect(TokenExporter.toMarkdown(nodes).trim()).toBe('$$\nx^2 \\notag\n$$');
    });

    it('toLatex should format section correctly', () => {
      const nodes = [createSectionNode('My Section', 'Section content')];
      const result = TokenExporter.toLatex(nodes);
      expect(result).toContain('\\section{My Section}');
      expect(result).toContain('Section content');
    });

    it('toMarkdown should format section with heading correctly', () => {
      const nodes = [createSectionNode('My Section', 'Section content')];
      const result = TokenExporter.toMarkdown(nodes);
      expect(result).toContain('## My Section');
      expect(result).toContain('Section content');
    });

    it('toJSON should preserve token structure', () => {
      const nodes = [createTextNode('Test')];
      const result = TokenExporter.toJSON(nodes);
      expect(result).toEqual([{ type: TokenType.TEXT, content: 'Test' }]);
    });

    it('tokensToText should convert raw tokens to text', () => {
      const tokens: BaseToken[] = [
        { type: TokenType.TEXT, content: 'Hello ' },
        { type: TokenType.TEXT, content: 'World' }
      ];
      expect(TokenExporter.tokensToText(tokens)).toBe('Hello World');
    });
  });

  describe('Static export() method', () => {
    it('should export to text format', () => {
      const nodes = [createTextNode('Test')];
      expect(TokenExporter.export(nodes, 'text')).toBe('Test');
    });

    it('should export to markdown format with styles', () => {
      const nodes = [createTextNode('bold', ['bold'])];
      expect(TokenExporter.export(nodes, 'markdown')).toBe('**bold**');
    });

    it('should export to latex format with styles', () => {
      const nodes = [createTextNode('bold', ['bold'])];
      expect(TokenExporter.export(nodes, 'latex')).toBe('\\textbf{bold}');
    });

    it('should export to json format', () => {
      const nodes = [createTextNode('Test')];
      const result = TokenExporter.export(nodes, 'json');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw on unknown format', () => {
      const nodes = [createTextNode('Test')];
      expect(() => TokenExporter.export(nodes, 'unknown' as any)).toThrow("unknown format 'unknown'");
    });
  });

  describe('Instance methods with factory', () => {
    const exporter = new TokenExporter(factory);

    it('should convert raw tokens to markdown using factory', () => {
      const tokens: BaseToken[] = [
        { type: TokenType.TEXT, content: 'styled', styles: ['bold'] } as TextToken
      ];
      expect(exporter.toMarkdown(tokens)).toBe('**styled**');
    });

    it('should convert raw tokens to latex using factory', () => {
      const tokens: BaseToken[] = [
        { type: TokenType.TEXT, content: 'styled', styles: ['italic'] } as TextToken
      ];
      expect(exporter.toLatex(tokens)).toBe('\\emph{styled}');
    });

    it('should convert raw equation tokens using factory', () => {
      const tokens: BaseToken[] = [
        { type: TokenType.EQUATION, content: 'a^2 + b^2', display: DisplayType.INLINE } as EquationToken
      ];
      expect(exporter.toLatex(tokens)).toBe('$a^2 + b^2$');
    });

    it('should handle mixed token types', () => {
      const tokens: BaseToken[] = [
        { type: TokenType.TEXT, content: 'The formula ' } as TextToken,
        { type: TokenType.EQUATION, content: 'E=mc^2', display: DisplayType.INLINE } as EquationToken,
        { type: TokenType.TEXT, content: ' is famous.' } as TextToken
      ];
      const result = exporter.toLatex(tokens);
      expect(result).toContain('The formula');
      expect(result).toContain('$E=mc^2$');
      expect(result).toContain('is famous.');
    });
  });

  describe('Instance export() unified method', () => {
    const exporter = new TokenExporter(factory);

    it('should export raw tokens to all formats', () => {
      const tokens: BaseToken[] = [
        { type: TokenType.TEXT, content: 'Test', styles: ['bold'] } as TextToken
      ];

      expect(exporter.export(tokens, 'text')).toBe('Test');
      expect(exporter.export(tokens, 'markdown')).toBe('**Test**');
      expect(exporter.export(tokens, 'latex')).toBe('\\textbf{Test}');
      expect(Array.isArray(exporter.export(tokens, 'json'))).toBe(true);
    });

    it('should throw on unknown format', () => {
      const tokens: BaseToken[] = [{ type: TokenType.TEXT, content: 'Test' }];
      expect(() => exporter.export(tokens, 'unknown' as any)).toThrow("unknown format 'unknown'");
    });
  });

  describe('Instance without factory', () => {
    const exporterNoFactory = new TokenExporter();

    it('should work with pre-built token nodes', () => {
      const nodes = [createTextNode('Test')];
      expect(exporterNoFactory.toText(nodes)).toBe('Test');
      expect(exporterNoFactory.toMarkdown(nodes)).toBe('Test');
      expect(exporterNoFactory.toLatex(nodes)).toBe('Test');
    });

    it('should throw when converting raw tokens without factory', () => {
      const tokens: BaseToken[] = [{ type: TokenType.TEXT, content: 'Test' }];
      expect(() => exporterNoFactory.toText(tokens)).toThrow('factory required');
    });
  });

  describe('Empty input handling', () => {
    it('should handle empty node array', () => {
      expect(TokenExporter.toText([])).toBe('');
      expect(TokenExporter.toMarkdown([])).toBe('');
      expect(TokenExporter.toLatex([])).toBe('');
      expect(TokenExporter.toJSON([])).toEqual([]);
    });

    it('should handle empty token array', () => {
      expect(TokenExporter.tokensToText([])).toBe('');
    });
  });

  describe('LaTeX special character escaping', () => {
    it('should escape special characters in text', () => {
      const nodes = [createTextNode('50% off & more')];
      expect(TokenExporter.toLatex(nodes)).toBe('50\\% off \\& more');
    });

    it('should escape underscores', () => {
      const nodes = [createTextNode('snake_case')];
      expect(TokenExporter.toLatex(nodes)).toBe('snake\\_case');
    });
  });
});

import { BaseToken } from './types';
import { AbstractTokenNode } from './base/AbstractTokenNode';
import { ITokenNodeFactory } from './base/ITokenNodeFactory';
import {
  MarkdownExportOptions,
  LatexExportOptions,
  JSONExportOptions,
  CopyContentOptions
} from './export_types';
import { convertTokens2String } from './utils';

export type ExportFormat = 'text' | 'markdown' | 'latex' | 'json';

export type ExportOptions = MarkdownExportOptions | LatexExportOptions | JSONExportOptions | CopyContentOptions;

/**
 * Unified exporter for converting tokens/nodes to various output formats.
 *
 * Can work with:
 * - AbstractTokenNode[] - full formatting support
 * - BaseToken[] - basic formatting, or full formatting if factory provided
 *
 * @example
 * ```typescript
 * // With token nodes
 * const markdown = TokenExporter.toMarkdown(tokenNodes, options);
 *
 * // With raw tokens (basic formatting)
 * const text = TokenExporter.toText(rawTokens);
 *
 * // With factory for full raw token formatting
 * const exporter = new TokenExporter(factory);
 * const latex = exporter.toLatex(rawTokens, options);
 *
 * // Unified export
 * const output = TokenExporter.export(content, 'markdown', options);
 * ```
 */
export class TokenExporter {
  private factory?: ITokenNodeFactory;

  constructor(factory?: ITokenNodeFactory) {
    this.factory = factory;
  }

  /**
   * Check if input is an array of token nodes
   */
  private static isTokenNodes(input: AbstractTokenNode[] | BaseToken[]): input is AbstractTokenNode[] {
    if (!input || input.length === 0) return false;
    return input[0] instanceof AbstractTokenNode;
  }

  /**
   * Convert raw tokens to nodes using factory
   */
  private tokensToNodes(tokens: BaseToken[]): AbstractTokenNode[] {
    if (!this.factory) {
      throw new Error('TokenExporter: factory required to convert raw tokens to nodes');
    }

    const nodes: AbstractTokenNode[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (!token) continue;
      const node = this.factory.createNode(token, token.id ?? `export-${i}`);
      if (node) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  /**
   * Ensure input is token nodes, converting if necessary
   */
  private ensureNodes(input: AbstractTokenNode[] | BaseToken[]): AbstractTokenNode[] {
    if (TokenExporter.isTokenNodes(input)) {
      return input;
    }
    return this.tokensToNodes(input as BaseToken[]);
  }

  // ============ Instance Methods (factory-aware) ============

  /**
   * Export to markdown (instance method - uses factory for raw tokens)
   */
  toMarkdown(input: AbstractTokenNode[] | BaseToken[], options?: MarkdownExportOptions): string {
    const nodes = this.ensureNodes(input);
    return AbstractTokenNode.GetMarkdownContent(nodes, options);
  }

  /**
   * Export to LaTeX (instance method - uses factory for raw tokens)
   */
  toLatex(input: AbstractTokenNode[] | BaseToken[], options?: LatexExportOptions): string {
    const nodes = this.ensureNodes(input);
    return AbstractTokenNode.GetLatexContent(nodes, options);
  }

  /**
   * Export to plain text (instance method - uses factory for raw tokens)
   */
  toText(input: AbstractTokenNode[] | BaseToken[], options?: CopyContentOptions): string {
    const nodes = this.ensureNodes(input);
    return AbstractTokenNode.GetCopyContent(nodes, options);
  }

  /**
   * Export to JSON (instance method - uses factory for raw tokens)
   */
  toJSON(input: AbstractTokenNode[] | BaseToken[], options?: JSONExportOptions): any[] {
    const nodes = this.ensureNodes(input);
    return AbstractTokenNode.GetJSONContent(nodes, options);
  }

  /**
   * Unified export method (instance - uses factory for raw tokens)
   */
  export(
    input: AbstractTokenNode[] | BaseToken[],
    format: ExportFormat,
    options?: ExportOptions
  ): string | any[] {
    switch (format) {
      case 'text':
        return this.toText(input, options as CopyContentOptions);
      case 'markdown':
        return this.toMarkdown(input, options as MarkdownExportOptions);
      case 'latex':
        return this.toLatex(input, options as LatexExportOptions);
      case 'json':
        return this.toJSON(input, options as JSONExportOptions);
      default:
        throw new Error(`TokenExporter: unknown format '${format}'`);
    }
  }

  // ============ Static Methods (no factory needed for nodes) ============

  /**
   * Export token nodes to markdown
   */
  static toMarkdown(nodes: AbstractTokenNode[], options?: MarkdownExportOptions): string {
    return AbstractTokenNode.GetMarkdownContent(nodes, options);
  }

  /**
   * Export token nodes to LaTeX
   */
  static toLatex(nodes: AbstractTokenNode[], options?: LatexExportOptions): string {
    return AbstractTokenNode.GetLatexContent(nodes, options);
  }

  /**
   * Export token nodes to plain text
   */
  static toText(nodes: AbstractTokenNode[], options?: CopyContentOptions): string {
    return AbstractTokenNode.GetCopyContent(nodes, options);
  }

  /**
   * Export token nodes to JSON
   */
  static toJSON(nodes: AbstractTokenNode[], options?: JSONExportOptions): any[] {
    return AbstractTokenNode.GetJSONContent(nodes, options);
  }

  /**
   * Export raw tokens to plain text (no factory needed)
   */
  static tokensToText(tokens: BaseToken[]): string {
    return convertTokens2String(tokens);
  }

  /**
   * Unified static export for token nodes
   */
  static export(
    nodes: AbstractTokenNode[],
    format: ExportFormat,
    options?: ExportOptions
  ): string | any[] {
    switch (format) {
      case 'text':
        return TokenExporter.toText(nodes, options as CopyContentOptions);
      case 'markdown':
        return TokenExporter.toMarkdown(nodes, options as MarkdownExportOptions);
      case 'latex':
        return TokenExporter.toLatex(nodes, options as LatexExportOptions);
      case 'json':
        return TokenExporter.toJSON(nodes, options as JSONExportOptions);
      default:
        throw new Error(`TokenExporter: unknown format '${format}'`);
    }
  }
}

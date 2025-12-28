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
   * Export to LaTeX with position spans for each node.
   * Returns both the content and a map of nodeId -> { start, end } positions.
   *
   * @example
   * ```typescript
   * const { content, spans } = exporter.toLatexWithSpans(ast);
   * // spans.get("node-123") => { start: 100, end: 150 }
   * ```
   */
  toLatexWithSpans(
    input: AbstractTokenNode[] | BaseToken[],
    options?: LatexExportOptions
  ): { content: string; spans: Map<string, { start: number; end: number }> } {
    const nodes = this.ensureNodes(input);
    return TokenExporter.toLatexWithSpans(nodes, options);
  }

  /**
   * Export to Markdown with position spans for each node.
   * Returns both the content and a map of nodeId -> { start, end } positions.
   */
  toMarkdownWithSpans(
    input: AbstractTokenNode[] | BaseToken[],
    options?: MarkdownExportOptions
  ): { content: string; spans: Map<string, { start: number; end: number }> } {
    const nodes = this.ensureNodes(input);
    return TokenExporter.toMarkdownWithSpans(nodes, options);
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
   * Internal helper for generating content with spans.
   * Works for both LaTeX and Markdown by accepting content getter functions.
   */
  private static toContentWithSpans(
    nodes: AbstractTokenNode[],
    getNodeContent: (node: AbstractTokenNode) => string,
    getChildrenContent: (nodes: AbstractTokenNode[]) => string,
    newlineSeparator: string
  ): { content: string; spans: Map<string, { start: number; end: number }> } {
    const spans = new Map<string, { start: number; end: number }>();
    const position = { current: 0 };

    // Recursively find child spans within a parent's output
    const findChildSpans = (
      node: AbstractTokenNode,
      fullOutput: string,
      basePosition: number
    ) => {
      let searchStart = 0;
      for (const child of node.getChildren()) {
        const childOutput = getNodeContent(child);
        if (childOutput.length === 0) continue;

        const childPos = fullOutput.indexOf(childOutput, searchStart);
        if (childPos >= 0) {
          const childStart = basePosition + childPos;
          const childEnd = childStart + childOutput.length;
          spans.set(child.id, { start: childStart, end: childEnd });
          searchStart = childPos + childOutput.length;

          // Recursively find grandchildren spans
          if (child.hasChildren()) {
            findChildSpans(child, childOutput, childStart);
          }
        }
      }
    };

    const walkNodes = (nodesToWalk: AbstractTokenNode[], addNewlines: boolean) => {
      let result = '';

      for (const node of nodesToWalk) {
        // Add newline before non-inline nodes
        if (addNewlines && !node.isInline && result.length > 0) {
          result += newlineSeparator;
          position.current += newlineSeparator.length;
        }

        const start = position.current;

        if (node.hasChildren()) {
          // For container nodes, we need to handle wrapper content + children
          const fullOutput = getNodeContent(node);
          const childrenOutput = getChildrenContent(node.getChildren());

          // Find where children content starts in the full output
          const childrenStart = fullOutput.indexOf(childrenOutput);

          if (childrenStart >= 0 && childrenOutput.length > 0) {
            // Has wrapper content - add prefix, then walk children, then add suffix
            const prefix = fullOutput.substring(0, childrenStart);
            const suffix = fullOutput.substring(childrenStart + childrenOutput.length);

            result += prefix;
            position.current += prefix.length;

            // Recursively process children
            result += walkNodes(node.getChildren(), true);

            result += suffix;
            position.current += suffix.length;
          } else {
            // Complex node structure - use full output and find children within
            result += fullOutput;
            findChildSpans(node, fullOutput, start);
            position.current += fullOutput.length;
          }
        } else {
          // Leaf node - straightforward
          const nodeContent = getNodeContent(node);
          result += nodeContent;
          position.current += nodeContent.length;
        }

        spans.set(node.id, { start, end: position.current });
      }

      return result;
    };

    const content = walkNodes(nodes, true);

    return { content, spans };
  }

  /**
   * Export token nodes to LaTeX with position spans for each node.
   * Recursively walks the tree and records spans for every node.
   * Parent spans encompass their children's spans.
   */
  static toLatexWithSpans(
    nodes: AbstractTokenNode[],
    options?: LatexExportOptions
  ): { content: string; spans: Map<string, { start: number; end: number }> } {
    return TokenExporter.toContentWithSpans(
      nodes,
      (node) => node.getLatexContent(options),
      (children) => AbstractTokenNode.GetLatexContent(children, options),
      '\n'
    );
  }

  /**
   * Export token nodes to Markdown with position spans for each node.
   * Recursively walks the tree and records spans for every node.
   * Parent spans encompass their children's spans.
   */
  static toMarkdownWithSpans(
    nodes: AbstractTokenNode[],
    options?: MarkdownExportOptions
  ): { content: string; spans: Map<string, { start: number; end: number }> } {
    return TokenExporter.toContentWithSpans(
      nodes,
      (node) => node.getMarkdownContent(options),
      (children) => AbstractTokenNode.GetMarkdownContent(children, options),
      '\n\n'
    );
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

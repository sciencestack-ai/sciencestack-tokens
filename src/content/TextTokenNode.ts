import { TextToken } from '../types';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions } from '../export_types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { escapeLatexSpecialChars } from '../utils';
import { wrapStylesToLatex, wrapStylesToMarkdown } from '../styles';

export class TextTokenNode extends BaseTokenNode {
  constructor(
    token: TextToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  // Getters
  get token(): TextToken {
    return this._token as TextToken;
  }

  getData() {
    return this.token.content;
  }

  /**
   * Gets raw text content with optional character-based offset selection.
   * Returns unescaped, unstyled text - used for text selection and annotations.
   * @param options Optional startOffset/endOffset for partial extraction
   * @returns The raw text content
   */
  getCopyContent(options?: CopyContentOptions): string {
    const rawStr = this.getData();
    const N = rawStr.length;
    if (N === 0) {
      return '';
    }

    // Default to full string if no offsets provided
    const startOffset = options?.startOffset ?? 0;
    const endOffset = options?.endOffset ?? N;

    // Ensure offsets are within bounds
    const start = Math.max(0, Math.min(startOffset, N));
    const end = Math.max(0, Math.min(endOffset, N));

    return rawStr.substring(start, end);
  }

  /**
   * Gets LaTeX-formatted content with proper escaping and styling.
   * Always returns full content (no partial extraction).
   * @param options Options for LaTeX export (currently unused)
   * @returns The LaTeX-formatted text content
   */
  getLatexContent(options?: LatexExportOptions): string {
    const rawStr = this.getData();
    if (rawStr.length === 0) {
      return '';
    }

    let content = escapeLatexSpecialChars(rawStr);
    // Replace newlines with double newlines for latex
    content = content.replace(/\n/g, '\n\n');
    if (this.styles) {
      content = wrapStylesToLatex(content, this.styles);
    }
    return content;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const rawStr = this.getData();
    const N = rawStr.length;
    if (N === 0) {
      return '';
    }

    // Replace newlines with double newlines for markdown
    let content = rawStr.replace(/\n/g, '\n\n');
    // Apply markdown styling
    if (this.styles) content = wrapStylesToMarkdown(content, this.styles);
    return content;
  }
}

import { QuoteToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class QuoteTokenNode extends BaseTokenNode {
  constructor(
    token: QuoteToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  getCopyContent(options?: CopyContentOptions): string {
    const content = super.getCopyContent(options);

    return '`\n' + content + '\n`';
  }

  getLatexContent(options?: LatexExportOptions): string {
    const content = super.getLatexContent(options);
    const labels = this.getLabelsLatex();
    const prefix = '\\begin{quote}';
    const suffix = '\\end{quote}';
    return `${prefix}\n${labels}${content}\n${suffix}\n`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const content = super.getMarkdownContent(options);
    const anchorId = this.getAnchorId();
    const anchor = anchorId ? `<a id="${anchorId}"></a>\n\n` : '';

    // Convert content to blockquote format with line breaks preserved
    const quotedContent = content.replace(/\n/g, '  \n> ');
    return `${anchor}> ${quotedContent}`;
  }
}

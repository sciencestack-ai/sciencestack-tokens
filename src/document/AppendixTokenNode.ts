import { AppendixToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class AppendixTokenNode extends BaseTokenNode {
  constructor(
    token: AppendixToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  getLatexContent(options?: LatexExportOptions): string {
    const labels = this.getLabelsLatex();
    const content = super.getLatexContent(options);
    return `\\begin{appendices}\n${labels}${content}\n\\end{appendices}\n`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const content = super.getMarkdownContent(options);
    return `# Appendix\n\n${content}`;
  }

  getAnchorId(): string {
    const anchorId = super.getAnchorId();
    if (anchorId) {
      return anchorId;
    }
    return `appendix`;
  }
}

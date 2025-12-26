import { DocumentToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class DocumentTokenNode extends BaseTokenNode {
  constructor(
    token: DocumentToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  getLatexContent(options: LatexExportOptions): string {
    const labels = this.getLabelsLatex();
    const content = super.getLatexContent(options);
    return `\\begin{document}\n${labels}${content}\n\\end{document}\n`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    // Document is just a container, return children content directly
    return super.getMarkdownContent(options);
  }
}

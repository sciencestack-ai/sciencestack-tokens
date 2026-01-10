import { TitleToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class TitleTokenNode extends BaseTokenNode {
  constructor(
    token: TitleToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  getLatexContent(options?: LatexExportOptions): string {
    const content = super.getLatexContent(options);
    return `\\title{${content}}`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const content = super.getMarkdownContent(options);
    const anchor = this.getAnchorHtml(options);
    return `${anchor}# ${content}`;
  }
}

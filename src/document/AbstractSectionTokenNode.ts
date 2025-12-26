import { AbstractToken, BaseToken, SectionToken } from '../types';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { BaseEnvTokenNode } from './BaseEnvTokenNode';
import { LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class AbstractSectionTokenNode extends BaseEnvTokenNode {
  constructor(
    token: AbstractToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): AbstractToken {
    return this._token as AbstractToken;
  }

  getLatexContent(options?: LatexExportOptions): string {
    const labels = this.getLabelsLatex();
    const content = super.getLatexContent(options);

    return `\\begin{abstract}\n${labels}${content}\n\\end{abstract}`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const content = super.getMarkdownContent(options);
    const anchorId = this.getAnchorId();
    const anchor = anchorId ? `<a id="${anchorId}"></a>\n\n` : '';

    return `${anchor}## Abstract\n\n> ${content.replace(/\n/g, '  \n> ')}`;
  }
}

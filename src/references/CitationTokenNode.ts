import { CitationToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { AbstractTokenNode } from '../base/AbstractTokenNode';
import { convertTokens2String } from '../utils';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class CitationTokenNode extends AbstractTokenNode {
  constructor(
    token: CitationToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id);
  }

  get token(): CitationToken {
    return this._token as CitationToken;
  }

  get title() {
    return this.token.title;
  }

  get isInline(): boolean {
    return true;
  }

  getTitleStr(): string {
    const _token = this.token;
    if (!_token.title) {
      return '';
    }
    let titleStr = convertTokens2String(_token.title);
    return titleStr.trim();
  }

  getData() {
    return this.token.content;
  }

  hasCitationKey(key: string): boolean {
    return this.token.content.includes(key);
  }

  getCopyContent(options?: CopyContentOptions): string {
    return this.getLatexContent();
  }

  getLatexContent(options?: LatexExportOptions): string {
    const contentStr = this.token.content.join(',');
    let titleStr = this.getTitleStr();
    if (titleStr.length > 0) {
      titleStr = `[${titleStr}]`;
    }
    return `\\cite${titleStr}{${contentStr}}`;
  }

  getTooltipContent(): string | null {
    return null;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const content = this.token.content;
    const titleStr = this.getTitleStr();

    const createCitationLink = (key: string) => {
      const displayText = titleStr || key;
      return `[\\[${displayText}\\]](#bib-${key})`;
    };

    return content.map(createCitationLink).join(', ');
  }
}

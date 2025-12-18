import { FootnoteToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { convertTokens2String } from '../utils';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class FootnoteTokenNode extends BaseTokenNode {
  constructor(
    token: FootnoteToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): FootnoteToken {
    return this._token as FootnoteToken;
  }

  getCopyContent(options?: CopyContentOptions): string {
    return this.getLatexContent();
  }

  getLatexContent(options?: LatexExportOptions): string {
    const output = convertTokens2String(this.token.content);
    return `\\footnote{${output}}`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const content = super.getMarkdownContent(options);
    return '`footnote:' + content + '`';
  }
}

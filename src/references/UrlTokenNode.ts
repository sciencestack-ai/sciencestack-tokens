import { UrlToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class UrlTokenNode extends BaseTokenNode {
  constructor(
    token: UrlToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get isInline() {
    return true;
  }

  get token(): UrlToken {
    return this._token as UrlToken;
  }

  getData() {
    return this.token.content;
  }

  get path() {
    return this.token.content;
  }

  getContentStr(): string {
    return this.path;
  }

  getCopyContent(options?: CopyContentOptions) {
    return this.path;
  }

  getLatexContent(options?: LatexExportOptions) {
    return `\\url{${this.path}}`;
  }

  getMarkdownContent(options?: MarkdownExportOptions) {
    return this.path;
  }
}

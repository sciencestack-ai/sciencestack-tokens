import { MetadataToken, TokenType } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class MetadataTokenNode extends BaseTokenNode {
  constructor(
    token: MetadataToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): MetadataToken {
    return this._token as MetadataToken;
  }

  get isInline(): boolean {
    return false;
  }

  get type() {
    return this.token.type;
  }

  getTypeStr(): string {
    const typeStr = this.type;
    return typeStr.charAt(0).toUpperCase() + typeStr.slice(1);
  }

  getCopyContent(options?: CopyContentOptions): string {
    const content = super.getCopyContent(options);
    return content;
  }

  getLatexContent(options?: LatexExportOptions): string {
    const content = super.getLatexContent(options);
    return `\\${this.type}{${content}}`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const content = super.getMarkdownContent(options);
    const typeStr = this.getTypeStr();
    return `${typeStr}: *${content}*`;
  }
}

import { IncludePdfToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions, resolveAssetPath } from '../export_types';

export class IncludePdfTokenNode extends BaseTokenNode {
  constructor(
    token: IncludePdfToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): IncludePdfToken {
    return this._token as IncludePdfToken;
  }

  getPath() {
    return this.token.path;
  }

  getError() {
    return this.token.error;
  }

  getCopyContent(options?: CopyContentOptions): string {
    return this.getPath() ?? '';
  }

  getLatexContent(options?: LatexExportOptions): string {
    const path = this.getPath();
    if (!path) {
      return '';
    }
    const resolvedPath = resolveAssetPath(path, options);
    return `\\includepdf{${resolvedPath}}`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const path = this.getPath();
    if (!path) {
      return '';
    }
    const resolvedPath = resolveAssetPath(path, options);
    return `![ ](${resolvedPath})`;
  }
}

import { IncludeGraphicsToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions, getAssetRelativePath } from '../export_types';

export class IncludeGraphicsTokenNode extends BaseTokenNode {
  constructor(
    token: IncludeGraphicsToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): IncludeGraphicsToken {
    return this._token as IncludeGraphicsToken;
  }

  get width(): number {
    return this.token.width ?? 0;
  }

  get height(): number {
    return this.token.height ?? 0;
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
    const relativePath = getAssetRelativePath(path, options?.paperId, options?.assetsFolderName);
    return `\\includegraphics{${relativePath}}`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const path = this.getPath();
    if (!path) {
      return '';
    }
    const relativePath = getAssetRelativePath(path, options?.paperId, options?.assetsFolderName);
    return `![ ](${relativePath})`;
  }
}

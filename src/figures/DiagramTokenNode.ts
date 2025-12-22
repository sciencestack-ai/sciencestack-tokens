import { DiagramToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions, resolveAssetPath } from '../export_types';

export class DiagramTokenNode extends BaseTokenNode {
  constructor(
    token: DiagramToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): DiagramToken {
    return this._token as DiagramToken;
  }

  get width(): number {
    return this.token.width ?? 0;
  }

  get height(): number {
    return this.token.height ?? 0;
  }

  get name() {
    return this.token.name; // tikzpicture, picture, etc.
  }

  getError() {
    return this.token.error;
  }

  getCode() {
    // e.g. \begin{tikzpicture} ... \end{tikzpicture}
    return this.token.content;
  }

  getPath() {
    // svg path or image path
    return this.token.path;
  }

  getCopyContent(options?: CopyContentOptions): string {
    return this.getPath() ?? '';
  }

  getLatexContent(options?: LatexExportOptions): string {
    let comment = '';
    const path = this.getPath();
    if (!path) {
      return '';
    }
    const resolvedPath = resolveAssetPath(path, options);
    comment = '\n% Alternatively use path: \n% ';

    // Check if the file is an SVG and use appropriate command
    if (resolvedPath.toLowerCase().endsWith('.svg')) {
      const pathWithoutExt = resolvedPath.replace(/\.svg$/i, '');
      comment += `\\includesvg{${pathWithoutExt}}\n`;
    } else {
      comment += `\\includegraphics{${resolvedPath}}\n`;
    }
    return comment + this.getCode();
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

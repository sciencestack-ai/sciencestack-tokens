import { DiagramToken } from "../types";
import { ITokenNodeFactory } from "../base/ITokenNodeFactory";
import { LatexExportOptions, resolveAssetPath } from "../export_types";
import { BaseAssetTokenNode } from "./BaseAssetTokenNode";

export class DiagramTokenNode extends BaseAssetTokenNode<DiagramToken> {
  constructor(
    token: DiagramToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get name() {
    return this.token.name; // tikzpicture, picture, etc.
  }

  getCode() {
    // e.g. \begin{tikzpicture} ... \end{tikzpicture}
    return this.token.content;
  }

  getLatexContent(options?: LatexExportOptions): string {
    let comment = "";
    const path = this.getPath();
    if (!path) {
      return "";
    }
    const resolvedPath = resolveAssetPath(path, options);
    comment = "\n% Alternatively use path: \n% ";

    // Check if the file is an SVG and use appropriate command
    if (resolvedPath.toLowerCase().endsWith(".svg")) {
      const pathWithoutExt = resolvedPath.replace(/\.svg$/i, "");
      comment += `\\includesvg{${pathWithoutExt}}\n`;
    } else {
      comment += `\\includegraphics{${resolvedPath}}\n`;
    }
    return comment + this.getCode();
  }
}

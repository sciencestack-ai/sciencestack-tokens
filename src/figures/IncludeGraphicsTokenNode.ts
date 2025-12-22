import { IncludeGraphicsToken } from "../types";
import { ITokenNodeFactory } from "../base/ITokenNodeFactory";
import { LatexExportOptions, resolveAssetPath } from "../export_types";
import { BaseAssetTokenNode } from "./BaseAssetTokenNode";

export class IncludeGraphicsTokenNode extends BaseAssetTokenNode<IncludeGraphicsToken> {
  constructor(
    token: IncludeGraphicsToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  getLatexContent(options?: LatexExportOptions): string {
    const path = this.getPath();
    if (!path) {
      return "";
    }
    const resolvedPath = resolveAssetPath(path, options);
    return `\\includegraphics{${resolvedPath}}`;
  }
}

import { IncludePdfToken } from "../types";
import { ITokenNodeFactory } from "../base/ITokenNodeFactory";
import { LatexExportOptions, resolveAssetPath } from "../export_types";
import { BaseAssetTokenNode } from "./BaseAssetTokenNode";

export class IncludePdfTokenNode extends BaseAssetTokenNode<IncludePdfToken> {
  constructor(
    token: IncludePdfToken,
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
    return `\\includepdf{${resolvedPath}}`;
  }
}

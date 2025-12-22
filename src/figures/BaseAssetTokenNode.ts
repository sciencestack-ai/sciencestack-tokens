import { BaseTokenNode } from "../base/BaseTokenNode";
import { ITokenNodeFactory } from "../base/ITokenNodeFactory";
import {
  CopyContentOptions,
  JSONExportOptions,
  MarkdownExportOptions,
  resolveAssetPath,
} from "../export_types";
import { BaseToken } from "../types";

interface AssetToken extends BaseToken {
  path?: string;
  width?: number;
  height?: number;
  error?: { message: string; type: string };
}

export abstract class BaseAssetTokenNode<
  T extends AssetToken = AssetToken
> extends BaseTokenNode {
  constructor(
    token: T,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): T {
    return this._token as T;
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
    return this.getPath() ?? "";
  }

  getJSONContent(options?: JSONExportOptions): any {
    const output = super.getJSONContent(options);
    const path = this.getPath();
    if (path) {
      const resolvedPath = resolveAssetPath(path, options);
      output.path = resolvedPath;
    }
    return output;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const path = this.getPath();
    if (!path) {
      return "";
    }
    const resolvedPath = resolveAssetPath(path, options);
    return `![ ](${resolvedPath})`;
  }
}

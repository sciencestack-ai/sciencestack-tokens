import { ReferenceToken } from "../types";
import { ITokenNodeFactory } from "../base/ITokenNodeFactory";
import { AbstractTokenNode } from "../base/AbstractTokenNode";
import { convertTokens2String } from "../utils";
import {
  CopyContentOptions,
  LatexExportOptions,
  MarkdownExportOptions,
} from "../export_types";

export class ReferenceTokenNode extends AbstractTokenNode {
  constructor(
    token: ReferenceToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id);
  }

  get token(): ReferenceToken {
    return this._token as ReferenceToken;
  }

  get title() {
    return this.token.title;
  }

  get isInline(): boolean {
    return true;
  }

  getTitleStr(): string {
    const _token = this.token;
    if (!_token.title) {
      return "";
    }
    let titleStr = convertTokens2String(_token.title);
    return titleStr.trim();
  }

  getData() {
    return this.token.content;
  }

  getCopyContent(options?: CopyContentOptions): string {
    // If resolver is provided, return human-readable reference text
    if (options?.labelResolver) {
      const labels = this.getData();
      return labels
        .map((label) => {
          const resolvedToken = options.labelResolver!(label);
          const refText = resolvedToken?.getReferenceText?.();
          return refText || label;
        })
        .join(", ");
    }
    // Default to LaTeX format
    return this.getLatexContent();
  }

  getLatexContent(options?: LatexExportOptions): string {
    let titleStr = this.getTitleStr();
    if (titleStr.length > 0) titleStr = `[${titleStr}]`;

    const labels = this.getData().join(",");
    return `\\ref${titleStr}{${labels}}`;
  }

  getTooltipContent(): string | null {
    return null;
  }

  getReferenceText() {
    return this.getData()[0];
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const labels = this.getData();

    const isMath = Boolean(options?.math);
    return labels
      .map((label) => {
        let referenceText = label;

        // Use optional label resolver if provided
        if (options?.labelResolver) {
          const resolvedToken = options.labelResolver(label);
          if (resolvedToken) {
            const refText = resolvedToken.getReferenceText?.();
            if (refText) {
              referenceText = refText;
            }
          }
        }

        if (isMath) {
          // don't add #label inside math since it will break math renderers like katex
          return `[\\text{Ref ${referenceText}}]`;
        }
        return `[${referenceText}](#${label})`;
      })
      .join(", ");
  }
}

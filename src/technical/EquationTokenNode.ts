import { DisplayType, EquationToken } from "../types";
import { BaseTokenNode } from "../base/BaseTokenNode";
import { ITokenNodeFactory } from "../base/ITokenNodeFactory";
import {
  CopyContentOptions,
  LatexExportOptions,
  MarkdownExportOptions,
} from "../export_types";

export class EquationTokenNode extends BaseTokenNode {
  constructor(
    token: EquationToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  // Getters
  get token(): EquationToken {
    return this._token as EquationToken;
  }

  get isInline(): boolean {
    return this.token.display != DisplayType.BLOCK;
  }

  get numbering() {
    return this.token.numbering;
  }

  private _getDataStr(): string {
    const data = this.getData();
    let dataStr = "";
    if (Array.isArray(data)) {
      dataStr = data.map((t) => t.getCopyContent()).join("");
    } else if (typeof data === "string") {
      dataStr = data;
    }
    return dataStr;
  }

  getCopyContent(options?: CopyContentOptions): string {
    return this.getLatexContent();
  }

  getLatexContent(options?: LatexExportOptions): string {
    const dataStr = this._getDataStr().trim();

    if (this.isInline) {
      return `$${dataStr}$`;
    }

    const labels = this.getLabelsLatex();

    if (this.token.numbering) {
      return `\\begin{equation}\n${labels}${dataStr}\n\\end{equation}\n`;
    }

    return `$$\n${labels}${dataStr}\n$$\n`;
  }

  getTooltipContent(): string | null {
    return this.getLatexContent();
  }

  // getAnchorId() {
  //   if (this.numbering) {
  //     return `eq-${this.numbering}`;
  //   }
  //   if (this.labels.length > 0) {
  //     return `eq-${this.labels[0]}`;
  //   }
  //   return `eq-${this.id}`;
  // }

  getReferenceText(): string | null {
    return this.numbering ? `(${this.numbering})` : null;
  }

  // markdown methods
  private _getMarkdownDataStr(options?: MarkdownExportOptions): string {
    const data = this.getData();
    let dataStr = "";
    if (Array.isArray(data)) {
      dataStr = data.map((t) => t.getMarkdownContent(options)).join("");
    } else if (typeof data === "string") {
      dataStr = data;
    }

    if (this.numbering) {
      dataStr += ` \\tag{${this.numbering}}`;
    } else if (!this.isInline) {
      dataStr += " \\notag";
    }
    return dataStr;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const isMath = Boolean(options?.math);

    let dataStr = this._getMarkdownDataStr({ ...options, math: true });
    if (dataStr.trim() === "") {
      return "";
    }

    if (this.isInline) {
      // pad with spaces to delimit for markdown
      return ` $${dataStr}$ `;
    }

    // attach anchor id if not in math
    if (!isMath) {
      const anchorId = this.getAnchorId();
      const anchor = anchorId ? `<a id="${anchorId}"></a>\n\n` : "";
      // Block equation with $$ on their own lines
      dataStr = `${anchor}$$\n${dataStr}\n$$\n\n`;
    }

    return dataStr;
  }
}

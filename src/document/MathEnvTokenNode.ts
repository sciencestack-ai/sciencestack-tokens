import { MathEnvToken, TokenType } from "../types";
import { ITokenNodeFactory } from "../base/ITokenNodeFactory";
import { BaseEnvTokenNode } from "./BaseEnvTokenNode";
import { BaseTokenNode } from "../base/BaseTokenNode";
import { AbstractTokenNode } from "../base/AbstractTokenNode";
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions } from "../export_types";

export class MathEnvTokenNode extends BaseEnvTokenNode {
  protected _cachedTooltipContent: string | null = null;

  constructor(
    token: MathEnvToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
    this._cachedTooltipContent = this._createTooltipContent();
  }

  private _createTooltipContent(maxLength = 200): string | null {
    let str = "";
    if (this.title) {
      str += `[${this.getTitleStr(false)}]\n\n`;
    }

    const childs = this.getChildren();
    let i = 0;
    for (i = 0; i < childs.length; i++) {
      const child = childs[i];
      if (child.type == TokenType.CITATION || child.type == TokenType.REF)
        continue;
      const childStr = child.getCopyContent();
      str += childStr;
      if (str.length > maxLength) {
        break;
      }
    }

    if (i < childs.length - 1) {
      str += " ...";
    }
    // // if str is longer than maxLength, truncate it
    // if (str.length > maxLength) {
    //   str = str.slice(0, maxLength) + ' ...';
    // }

    // console.log(str);
    return str;
  }

  get proof() {
    return this.token.proof;
  }

  get title() {
    return this.token.title;
  }

  get numbering() {
    return this.token.numbering;
  }

  get token(): MathEnvToken {
    return this._token as MathEnvToken;
  }

  get name() {
    return this.token.name ?? "theorem";
  }

  getName() {
    return this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }

  getLatexContent(options?: LatexExportOptions): string {
    const name = this.name.toLowerCase();

    let prefix = `\\begin{${name}}`;
    const titleData = this.getTitleData();
    if (titleData.length > 0) {
      prefix += `[${BaseTokenNode.GetLatexContent(titleData, options)}]`;
    }
    const suffix = `\\end{${name}}`;

    const labels = this.getLabelsLatex();
    const content = super.getLatexContent(options);

    return `${prefix}\n${labels}${content}\n${suffix}\n`;
  }

  getTooltipContent() {
    return this._cachedTooltipContent;
  }

  getReferenceText(): string | null {
    return this.numbering ? `${this.name + " " + this.numbering}` : null;
  }

  getCopyContent(options?: CopyContentOptions): string {
    const titleData = this.getTitleData();
    const title = titleData.length > 0
      ? AbstractTokenNode.GetCopyContent(titleData, options)
      : '';

    const content = AbstractTokenNode.GetCopyContent(this.getContentData(), options);

    // Build heading like "Theorem 1: Title" or just "Theorem 1" or "Theorem"
    let heading = this.getName();
    if (this.numbering) {
      heading += ` ${this.numbering}`;
    }
    if (title) {
      heading += `: ${title}`;
    }

    return `${heading}\n\n${content}`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const titleData = this.getTitleData();
    const contentData = this.getContentData();
    const envName = this.name;
    const capitalizedEnv = envName.charAt(0).toUpperCase() + envName.slice(1);
    const headingText = this.numbering
      ? `${capitalizedEnv} ${this.numbering}`
      : capitalizedEnv;
    const title = AbstractTokenNode.GetMarkdownContent(titleData, options);
    const heading = `<u><b>${headingText}: ${title}</b></u>`;
    const content = AbstractTokenNode.GetMarkdownContent(contentData, options);

    return `${heading}\n\n${content}`;
  }
}

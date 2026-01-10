import { BibliographyToken, BibItemToken } from "../types";
import { ITokenNodeFactory } from "../base/ITokenNodeFactory";

import {
  CopyContentOptions,
  LatexExportOptions,
  MarkdownExportOptions,
} from "../export_types";
import { BaseTokenNode } from "../base/BaseTokenNode";
import { BibitemTokenNode } from "./BibitemTokenNode";

export class BibliographyTokenNode extends BaseTokenNode {
  constructor(
    token: BibliographyToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): BibliographyToken {
    return this._token as BibliographyToken;
  }

  getData(): BibitemTokenNode[] {
    return this.getChildren() as BibitemTokenNode[];
  }

  getBibitemByKey(key: string): BibitemTokenNode | undefined {
    return this.getData().find((item) => item.key === key);
  }

  getBibitemIndex(item: BibitemTokenNode): number {
    return this.getData().indexOf(item);
  }

  getLatexContent(options?: LatexExportOptions): string {
    // Check if any items are bibtex format - if so, don't wrap in thebibliography
    // const items = this.getData();
    // const hasBibtex = items.some((item) => item.isBibtex());

    // if (hasBibtex) {
    //   // For bibtex entries, just return the content directly
    //   return super.getLatexContent(options);
    // }

    // For bibitem entries, wrap in thebibliography environment
    const prefix = `\\begin{thebibliography}{99}`;
    const suffix = `\\end{thebibliography}`;

    const labels = this.getLabelsLatex();
    const content = super.getLatexContent(options);

    return `${prefix}\n${labels}${content}\n${suffix}\n`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const anchor = this.getAnchorHtml(options);

    const content = super.getMarkdownContent(options);
    return `${anchor}## References\n\n${content}\n`;
  }

  getCopyContent(options?: CopyContentOptions): string {
    const items = this.getData();
    return items.map((item) => item.getCopyContent(options)).join("\n");
  }
}

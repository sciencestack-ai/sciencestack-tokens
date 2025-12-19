import { MakeTitleToken } from "../types";
import { BaseTokenNode } from "../base/BaseTokenNode";
import { ITokenNodeFactory } from "../base/ITokenNodeFactory";
import { LatexExportOptions, MarkdownExportOptions } from "../export_types";

export class MakeTitleTokenNode extends BaseTokenNode {
  constructor(
    token: MakeTitleToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  getLatexContent(options: LatexExportOptions): string {
    const content = super.getLatexContent(options);
    // typically children are metadata tokens like title, author, date, etc
    // so render them first, then the maketitle command
    return `${content}\n\\maketitle\n`;
  }
}

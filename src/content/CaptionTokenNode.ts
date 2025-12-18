import { CaptionToken, TokenType } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { BaseTableFigureTokenNode } from '../base/BaseTableFigureTokenNode';
import { CopyContentOptions, LatexExportOptions } from '../export_types';
import { AbstractTokenNode } from '../base/AbstractTokenNode';
import { NodeRoles } from '../base/NodeRoles';

export class CaptionTokenNode extends BaseTokenNode {
  constructor(
    token: CaptionToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);

    // reset styles
    this.token.styles = [];
  }

  get token(): CaptionToken {
    return this._token as CaptionToken;
  }

  get counter_name() {
    return this.token.counter_name;
  }

  get numbering() {
    return this.token.numbering;
  }

  getData(nodeRole?: NodeRoles): AbstractTokenNode[] {
    return (super.getData(nodeRole) ?? []) as AbstractTokenNode[];
  }

  getCopyContent(options?: CopyContentOptions): string {
    const content = super.getCopyContent(options);
    return content + '\n';
  }

  getLatexContent(options?: LatexExportOptions): string {
    const content = super.getLatexContent(options);
    return `\\caption{${content}}`;
  }

  getParentFigureOrTable(): BaseTableFigureTokenNode | null {
    let parent = this.parent;
    while (parent) {
      if (parent instanceof BaseTableFigureTokenNode) {
        return parent;
      }
      parent = parent.parent;
    }
    return null;
  }

  isParentSubContainer(): boolean {
    const parent = this.getParentFigureOrTable();
    if (!parent) return false;
    return parent.type === TokenType.SUBTABLE || parent.type === TokenType.SUBFIGURE;
  }

  getMarkdownContent(options?: any): string {
    const content = super.getMarkdownContent(options);
    return `Caption: *${content}*`;
  }

  getFullNumbering(): string | null {
    if (!this.numbering) return null;
    const parent = this.getParentFigureOrTable();
    if (!parent) return this.numbering;

    // check if there is even higher parent e.g. table above subtable
    const topParent = parent.findParentMatching(
      (node) => node instanceof BaseTableFigureTokenNode
    ) as BaseTableFigureTokenNode | null;
    if (!topParent || !topParent.numbering) return this.numbering;
    return topParent.numbering + '.' + this.numbering;
  }

  getReferenceText(): string | null {
    const numbering = this.getFullNumbering();
    if (!numbering) return null;
    let name = this.counter_name;
    if (!name) {
      const parent = this.getParentFigureOrTable();
      if (!parent) return null;
      name = parent.getEnvironmentName();
    }
    name = name.charAt(0).toUpperCase() + name.slice(1);
    return `${name} ${numbering}`;
  }
}

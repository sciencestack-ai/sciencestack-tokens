import { ListToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { ListItemTokenNode } from './ListItemTokenNode';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class ListTokenNode extends BaseTokenNode {
  constructor(
    token: ListToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): ListToken {
    return this._token as ListToken;
  }

  hasCustomBullets() {
    return this.getData().some((item) => item instanceof ListItemTokenNode && item.getTitleData().length > 0);
  }

  getData(): ListItemTokenNode[] {
    return this.getChildren() as ListItemTokenNode[];
  }

  get isInline() {
    return this.token.inline ?? false;
  }

  get listType() {
    return this.token.name;
  }

  computeDepth(): number {
    let depth = 0;
    let currentParent = this.parent;
    while (currentParent) {
      if (currentParent instanceof ListTokenNode) {
        return currentParent.computeDepth() + 1;
      }
      currentParent = currentParent.parent;
    }
    return depth;
  }

  getLatexContent(options?: LatexExportOptions): string {
    const prefix = `\\begin{${this.listType}}`;
    const suffix = `\\end{${this.listType}}`;

    const labels = this.isInline ? "" : this.getLabelsLatex();
    const content = super.getLatexContent(options);

    return `${prefix}\n${labels}${content}\n${suffix}\n`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const anchorId = this.getAnchorId();
    const anchor = anchorId ? `<a id="${anchorId}"></a>\n\n` : '';

    // Lists are just containers, children (ListItemTokenNode) handle formatting
    const content = super.getMarkdownContent(options);
    return `${anchor}${content}\n\n`;
  }

  getListItemIndex(item: ListItemTokenNode): number {
    return this.getData().indexOf(item);
  }
}

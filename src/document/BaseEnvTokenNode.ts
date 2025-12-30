import { BaseTokenNode } from '../base/BaseTokenNode';
import { AbstractToken, BaseToken, ListItemToken, MathEnvToken, SectionToken } from '../types';
import { convertTokens2String } from '../utils';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { NodeRoles } from '../base/NodeRoles';
import { AbstractTokenNode } from '../base/AbstractTokenNode';
import { CopyContentOptions, LatexExportOptions } from '../export_types';

export abstract class BaseEnvTokenNode extends BaseTokenNode {
  constructor(
    token: SectionToken | MathEnvToken | ListItemToken | AbstractToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
    this._initTitle();
  }

  protected _initTitle() {
    // title data
    const title = this.title;
    if (title) {
      const N = this.getChildren().length;
      const nodes = this._initializeBaseTokensAsChildren(title, NodeRoles.TITLE);
      // since title is normally rendered in front, we want to move them to the front (esp for tree traversal)
      // first remove these new title nodes from the back of children
      this._children.splice(N, nodes.length);
      // then add them to the front of children
      this._children.unshift(...nodes);
    }
  }

  get title(): BaseToken[] | undefined {
    return (this.token as any).title;
  }

  get numbering(): string | undefined {
    return (this.token as any).numbering;
  }

  getLatexContent(options?: LatexExportOptions) {
    return BaseTokenNode.GetLatexContent(this.getContentData(), options);
  }

  getCopyContent(options?: CopyContentOptions): string {
    const titleData = this.getTitleData();
    const title = titleData.length > 0
      ? AbstractTokenNode.GetCopyContent(titleData, options)
      : '';

    const content = AbstractTokenNode.GetCopyContent(this.getContentData(), options);

    if (title) {
      return `${title}\n\n${content}`;
    }
    return content;
  }

  getData(nodeRole?: NodeRoles) {
    if (this.hasChildren()) {
      if (nodeRole) {
        return this.getChildren().filter((child) => child.role === nodeRole);
      }
      return this.getChildren();
    }
    return [];
  }

  getTitleData() {
    return this.getData(NodeRoles.TITLE);
  }

  getContentData() {
    return this.getData(NodeRoles.CONTENT);
  }

  getTitleStr(includeNumbering = true): string {
    const title = this.title;
    if (!title) {
      return '';
    }
    let titleStr = convertTokens2String(title);
    if (includeNumbering && this.numbering) {
      titleStr = `${this.numbering}. ${titleStr}`;
    }
    return titleStr.trim();
  }

  getTooltipContent(): string | null {
    return this.getTitleStr(false);
  }

  getAnchorId(prefix: string = 'sec') {
    const anchorId = super.getAnchorId();
    if (anchorId) {
      return anchorId;
    }

    if (this.numbering) {
      return `${prefix}-${this.numbering}`;
    }
    if (this.labels.length > 0) {
      return `${prefix}-${this.labels[0]}`;
    }
    return `${prefix}-${this.id}`;
  }
}

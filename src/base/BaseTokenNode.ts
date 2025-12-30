import { BaseToken, TokenType, IToken } from '../types';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions, JSONExportOptions } from '../export_types';
import { AbstractTokenNode } from './AbstractTokenNode';
import { ITokenNodeFactory } from './ITokenNodeFactory';
import { NodeRoles } from './NodeRoles';

export class BaseTokenNode extends AbstractTokenNode {
  constructor(
    token: BaseToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id);
    this._initializeChildren();
  }

  get token(): BaseToken {
    return this._token as BaseToken;
  }

  /**
   * Initialize children from token.content.
   * The created child nodes will have their IDs set when added to this parent.
   */
  protected _initializeChildren(): void {
    const token = this.token;
    if (Array.isArray(token.content)) {
      this._initializeBaseTokensAsChildren(token.content, NodeRoles.CONTENT);
    }
  }

  protected _initializeBaseTokensAsChildren(tokens: BaseToken[], nodeRole: NodeRoles) {
    const nodes: AbstractTokenNode[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (!t) continue;
      const childId = t.id ?? `${this.id}/${nodeRole}-${i}`;
      const node = this.tokenFactory?.createNode(t, childId);
      if (node) {
        node.role = nodeRole;
        this.addChild(node);
        nodes.push(node);
      }
    }

    return nodes;
  }

  getCopyContent(options?: CopyContentOptions): string {
    if (this.hasChildren()) {
      const children = this.getChildren();
      return AbstractTokenNode.GetCopyContent(children, options);
    }

    const content = this.token.content;
    if (typeof content === 'string') {
      return content;
    }

    return '';
  }

  getLatexContent(options?: LatexExportOptions): string {
    // Default behavior: most tokens just return their getCopyContent
    // Tokens with special LaTeX formatting (equations, styled text, etc.) will override this
    if (this.hasChildren()) {
      const children = this.getChildren();
      return AbstractTokenNode.GetLatexContent(children, options);
    }

    const content = this.token.content;
    if (typeof content === 'string') {
      return content;
    }

    return '';
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    if (this.hasChildren()) {
      const children = this.getChildren();
      return AbstractTokenNode.GetMarkdownContent(children, options);
    }

    const content = this.token.content;
    if (typeof content === 'string') {
      return content;
    }

    return '';
  }

  getJSONContent(options?: JSONExportOptions): any {
    const token = this.token;

    if (this.hasChildren()) {
      const title = this.getData(NodeRoles.TITLE);
      const children = this.getData(NodeRoles.CONTENT);

      let titleContent: any = null;
      let childrenContent: any = null;
      if (title && title.length > 0) {
        if (Array.isArray(title)) {
          titleContent = AbstractTokenNode.GetJSONContent(title, options);
        } else if (typeof title === 'string') {
          titleContent = title;
        }
      }
      if (children && children.length > 0) {
        if (Array.isArray(children)) {
          childrenContent = AbstractTokenNode.GetJSONContent(children, options);
        } else if (typeof children === 'string') {
          childrenContent = children;
        }
      }

      return {
        ...token,
        title: titleContent,
        content: childrenContent
      };
    }

    // Return a copy to avoid mutation
    return { ...token };
  }

  getTooltipContent(): string | null {
    if (typeof this.token.content === 'string') {
      return this.token.content;
    }
    return null;
  }

  getClosestParentWithLabel(): BaseTokenNode | null {
    let current: BaseTokenNode | null = this;
    while (current !== null) {
      if (current.labels.length > 0) return current;
      current = current.parent as BaseTokenNode | null;
    }
    return current as BaseTokenNode | null;
  }

  getData(nodeRole?: NodeRoles) {
    if (this.hasChildren()) {
      if (nodeRole) {
        return this.getChildren().filter((child) => child.role === nodeRole);
      }
      return this.getChildren();
    }
    if (typeof this.token.content === 'string') {
      return this.token.content;
    }
    return null;
  }

  getAnchorId(): string | null {
    return this.token.anchorId ?? null;
  }
}

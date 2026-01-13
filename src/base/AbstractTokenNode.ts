import { IToken, TokenType } from '../types';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions, JSONExportOptions } from '../export_types';
import { IsInlineToken } from '../styles';
import { NodeRoles } from './NodeRoles';
import { nanoid } from 'nanoid';

export abstract class AbstractTokenNode {
  private _id: string;
  protected _parent: AbstractTokenNode | null = null;
  protected _children: AbstractTokenNode[] = [];
  protected _token: IToken;
  role: NodeRoles = NodeRoles.CONTENT;

  constructor(token: IToken, id?: string, role: NodeRoles = NodeRoles.CONTENT) {
    this._token = token;
    this._id = id ?? token.id ?? nanoid();
    this.role = role;
  }

  get isInline(): boolean {
    return IsInlineToken(this.token);
  }

  // Getter for the node's id
  get id(): string {
    return this._id;
  }

  // Other getters
  get token() {
    return this._token;
  }

  get type(): TokenType {
    return this._token.type;
  }

  get parent(): AbstractTokenNode | null {
    return this._parent;
  }

  get children(): AbstractTokenNode[] {
    return this._children;
  }

  get styles(): string[] | undefined {
    return this._token.styles;
  }

  get labels(): string[] {
    return this._token.labels ?? [];
  }

  // Setter for parent
  set parent(node: AbstractTokenNode | null) {
    this._parent = node;
  }

  addChild(child: AbstractTokenNode): void {
    this._children.push(child);
    child.parent = this;
  }

  removeChild(child: AbstractTokenNode): void {
    const index = this._children.indexOf(child);
    if (index !== -1) {
      this._children.splice(index, 1);
      child.parent = null;
    }
  }

  clearChildren(): void {
    this._children.forEach((child) => (child.parent = null));
    this._children = [];
  }

  // Tree traversal methods
  getRoot(): AbstractTokenNode {
    let current: AbstractTokenNode = this;
    while (current.parent !== null) {
      current = current.parent;
    }
    return current;
  }

  getDepth(): number {
    let depth = 0;
    let current: AbstractTokenNode | null = this;
    while (current.parent !== null) {
      depth++;
      current = current.parent;
    }
    return depth;
  }

  /**
   * Finds the first parent node that matches the given predicate
   * @param predicate A function that takes a TokenNode and returns a boolean
   * @returns The first matching parent node or null if none found
   */
  findParentMatching(predicate: (node: AbstractTokenNode) => boolean): AbstractTokenNode | null {
    let current: AbstractTokenNode | null = this.parent;
    while (current !== null) {
      if (predicate(current)) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  // Utility methods
  hasChildren(): boolean {
    return this._children.length > 0;
  }

  getChildren(): AbstractTokenNode[] {
    return this._children.slice();
  }

  abstract getData(nodeType?: NodeRoles): any;

  isRoot(): boolean {
    return this._parent === null;
  }

  isLeaf(): boolean {
    return this._children.length === 0;
  }

  getFirstChild(): AbstractTokenNode | null {
    return this._children[0] ?? null;
  }

  getLastChild(): AbstractTokenNode | null {
    return this._children[this._children.length - 1] ?? null;
  }

  /**
   * Gets the first leaf node in this subtree (the leftmost node with no children)
   * @returns The first leaf node or this node if it's a leaf
   */
  getFirstLeaf(): AbstractTokenNode {
    let current: AbstractTokenNode = this;
    while (current.hasChildren()) {
      current = current.getFirstChild()!;
    }
    return current;
  }

  /**
   * Gets the last leaf node in this subtree (the rightmost node with no children)
   * @returns The last leaf node or this node if it's a leaf
   */
  getLastLeaf(): AbstractTokenNode {
    let current: AbstractTokenNode = this;
    while (current.hasChildren()) {
      current = current.getLastChild()!;
    }
    return current;
  }

  static GetCopyContent(nodes: AbstractTokenNode[], options?: CopyContentOptions): string {
    let content = '';
    for (let node of nodes) {
      if (!node.isInline && content.length > 0) content += '\n';
      content += node.getCopyContent(options);
    }
    return content;
  }

  static GetLatexContent(nodes: AbstractTokenNode[], options?: LatexExportOptions): string {
    let content = '';
    const tracker = options?._spanTracker;

    // Don't pass tracker to inner nodes - only track at this level
    // Child spans will be found by findMissingChildSpans using string matching
    const innerOptions = tracker ? { ...options, _spanTracker: undefined } : options;

    for (let node of nodes) {
      // Add newline before non-inline nodes (but not before the first node)
      if (!node.isInline && content.length > 0) {
        content += '\n';
        if (tracker) tracker.position.current += 1;
      }

      const start = tracker?.position.current ?? 0;
      const nodeContent = node.getLatexContent(innerOptions);
      content += nodeContent;

      if (tracker) {
        tracker.position.current = start + nodeContent.length;
        tracker.spans.set(node.id, { start, end: tracker.position.current, type: node.type });
      }
    }
    return content;
  }

  static GetMarkdownContent(nodes: AbstractTokenNode[], options?: MarkdownExportOptions): string {
    let content = '';
    const tracker = options?._spanTracker;

    // Don't pass tracker to inner nodes - only track at this level
    // Child spans will be found by findMissingChildSpans using string matching
    const innerOptions = tracker ? { ...options, _spanTracker: undefined } : options;

    for (let node of nodes) {
      // Add double newline before non-inline nodes (but not before the first node)
      if (!node.isInline && content.length > 0) {
        content += '\n\n';
        if (tracker) tracker.position.current += 2;
      }

      const start = tracker?.position.current ?? 0;
      let nodeContent = node.getMarkdownContent(innerOptions);

      // Apply postProcess callback if provided
      if (options?.postProcess) {
        nodeContent = options.postProcess(node, nodeContent);
      }

      content += nodeContent;

      if (tracker) {
        tracker.position.current = start + nodeContent.length;
        tracker.spans.set(node.id, { start, end: tracker.position.current, type: node.type });
      }
    }
    return content;
  }

  static GetJSONContent(nodes: AbstractTokenNode[], options?: JSONExportOptions): any[] {
    const content: any[] = [];
    for (let node of nodes) {
      content.push(node.getJSONContent(options));
    }
    return content;
  }

  /**
   * Returns raw text content, optionally with character offsets for partial extraction.
   * Used primarily for text selection and annotation systems.
   */
  abstract getCopyContent(options?: CopyContentOptions): string;

  /**
   * Returns LaTeX-formatted content with proper escaping and styling.
   * Always returns full content (no partial extraction).
   * Used for LaTeX export and copy operations.
   */
  abstract getLatexContent(options?: LatexExportOptions): string;

  abstract getMarkdownContent(options?: MarkdownExportOptions): string;

  /**
   * Returns JSON-formatted content (token structure) for export.
   * Always returns full content (no partial extraction).
   * Used for JSON export operations.
   */
  getJSONContent(options?: JSONExportOptions) {
    return { ...this.token };
  }

  getTooltipContent(): string | null {
    return null;
  }

  // Method to find a node by its ID
  findById(id: string): AbstractTokenNode | null {
    if (this._id === id) {
      return this;
    }
    for (const child of this._children) {
      const result = child.findById(id);
      if (result !== null) {
        return result;
      }
    }
    return null;
  }

  /**
   * Finds the first node with the specified label
   * @param label The label to search for
   * @returns The first matching node or null if none found
   */
  findByLabel(label: string): AbstractTokenNode | null {
    if (this.labels.includes(label)) {
      return this;
    }
    for (const child of this._children) {
      const result = child.findByLabel(label);
      if (result !== null) {
        return result;
      }
    }
    return null;
  }

  /**
   * Gets the next sibling node if it exists
   * @returns The next sibling node or null if none exists
   */
  getNextSibling(): AbstractTokenNode | null {
    if (!this.parent) return null;
    const siblings = this.parent.getChildren();
    const currentIndex = siblings.indexOf(this);
    if (currentIndex === -1 || currentIndex === siblings.length - 1) return null;
    return siblings[currentIndex + 1] as AbstractTokenNode;
  }

  /**
   * Gets the previous sibling node if it exists
   * @returns The previous sibling node or null if none exists
   */
  getPreviousSibling(): AbstractTokenNode | null {
    if (!this.parent) return null;
    const siblings = this.parent.getChildren();
    const currentIndex = siblings.indexOf(this);
    if (currentIndex <= 0) return null;
    return siblings[currentIndex - 1] as AbstractTokenNode;
  }

  toPlainObject(): object {
    return {
      id: this._id,
      parent: this._parent ? this._parent.id : null,
      children: this._children.map((child) => child.toPlainObject()),
      token: this._token
    };
  }

  getAnchorId(): string | null {
    return null;
  }

  /**
   * For \ref displays of the tokennode (if label exists)
   */
  getReferenceText(): string | null {
    return null;
  }

  /**
   * Returns LaTeX \label{...} commands for all labels on this node.
   * Used by block-level token nodes in their getLatexContent() methods.
   */
  getLabelsLatex(): string {
    if (this.labels.length === 0) return "";
    return this.labels.map((label) => `\\label{${label}}`).join("\n") + "\n";
  }
}

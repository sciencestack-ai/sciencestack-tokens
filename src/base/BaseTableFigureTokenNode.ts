import { BaseTokenNode } from './BaseTokenNode';
import { CaptionToken, TableToken, FigureToken, SubFigureToken, SubTableToken } from '../types';
import { ITokenNodeFactory } from './ITokenNodeFactory';
import { convertTokens2String } from '../utils';
import { CaptionTokenNode } from '../content/CaptionTokenNode';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions } from '../export_types';
import { AbstractTokenNode } from './AbstractTokenNode';

type TableFigureTokens = TableToken | FigureToken | SubFigureToken | SubTableToken;
export abstract class BaseTableFigureTokenNode extends BaseTokenNode {
  protected _captionToken: CaptionToken | undefined;

  constructor(
    token: TableFigureTokens,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);

    // reset styles
    this.token.styles = [];
  }

  get token(): TableFigureTokens {
    return this._token as TableFigureTokens;
  }

  get numbering() {
    return this.token.numbering;
  }

  protected abstract getLabelPrefix(): string;
  public abstract getEnvironmentName(): string;

  // protected _extractLabels() {
  //   extractLabelsFromChilds(this.token, (label) => label.startsWith(this.getLabelPrefix()));
  // }

  getTooltipContent() {
    if (this._captionToken) {
      return convertTokens2String(this._captionToken.content);
    }
    return null;
  }

  getAnchorId() {
    const anchorId = super.getAnchorId();
    if (anchorId) {
      return anchorId;
    }

    const prefix = this.getLabelPrefix();
    if (this.numbering) {
      return `${prefix}-${this.numbering}`;
    }
    if (this.labels.length > 0) {
      return `${prefix}-${this.labels[0]}`;
    }
    return `${prefix}-${this.id}`;
  }

  getCopyContent(options?: CopyContentOptions): string {
    const content = super.getCopyContent(options);
    return content;
  }

  getLatexContent(options?: LatexExportOptions): string {
    const content = super.getLatexContent(options).trim();
    const envName = this.getEnvironmentName().toLowerCase();
    return `\\begin{${envName}}\n${content}\n\\end{${envName}}\n`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const anchorId = this.getAnchorId();
    const anchor = anchorId ? `<a id="${anchorId}"></a>\n\n` : '';

    // Use environment name and numbering for the heading with underline
    const envName = this.getEnvironmentName();
    const headingText = this.numbering ? `${envName} ${this.numbering}` : envName;
    const heading = `<u><b>${headingText}</b></u>`;

    // Children render normally under this heading
    const content = super.getMarkdownContent(options);

    return `${anchor}${heading}\n\n${content}`;
  }

  getAllCaptions(topLevelOnly = true) {
    // DFS in natural order to find the captions
    const captions: CaptionTokenNode[] = [];

    const traverse = (node: AbstractTokenNode) => {
      if (node instanceof CaptionTokenNode) {
        captions.push(node);
      }

      if (topLevelOnly && node instanceof BaseTableFigureTokenNode && node !== this) {
        // Don't traverse into nested table/figure containers (subfigures, subtables, etc.)
        // as they have their own captions that are not siblings of this container's captions
        return;
      }

      for (const child of node.getChildren()) {
        traverse(child);
      }
    };

    for (const child of this.getChildren()) {
      traverse(child);
    }

    return captions;
  }

  getFirstCaption(): CaptionTokenNode | null {
    return this.getAllCaptions()?.[0] || null;
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

  getReferenceText(): string | null {
    const caption = this.getFirstCaption();
    if (caption) {
      const refText = caption.getReferenceText();
      if (refText) return refText;
    }
    if (!this.numbering) {
      // check parent and use its referencetext
      const parent = this.getParentFigureOrTable();
      if (parent) {
        return parent.getReferenceText();
      }
    }
    return `${this.getEnvironmentName()} ${this.numbering}`;
  }
}

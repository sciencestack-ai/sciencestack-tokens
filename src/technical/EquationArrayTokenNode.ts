import { BaseToken, EquationArrayToken, RowToken } from "../types";
import { ITokenNodeFactory } from "../base/ITokenNodeFactory";
import { AbstractTokenNode } from "../base/AbstractTokenNode";
import { TextTokenNode } from "../content/TextTokenNode";
import { EquationTokenNode } from "./EquationTokenNode";
import {
  CopyContentOptions,
  LatexExportOptions,
  MarkdownExportOptions,
  JSONExportOptions,
} from "../export_types";

export class EquationArrayTokenNode extends AbstractTokenNode {
  constructor(
    token: EquationArrayToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id);
    this._initializeChildren();
  }

  protected _initializeChildren(): void {
    const token = this.token;
    const rows = token.content;

    rows.forEach((row, rowIndex) => {
      const rowId = row.id ?? `${this.id}/row-${rowIndex}`;
      const rowNode = new EqArrayRowNode(row, rowId, this.tokenFactory);
      this.addChild(rowNode);
    });
  }

  // Getters
  get token(): EquationArrayToken {
    return this._token as EquationArrayToken;
  }

  get name(): string {
    return this.token.name; // align, array, matrix, etc
  }

  get isInline() {
    // if inside an align/array/equation environment. e.g. matrix/cases inside begin{align}
    return (
      this.parent instanceof EqArrayRowNode ||
      this.parent instanceof EquationTokenNode
    );
  }

  public getTotalRows(): number {
    return this.getData().length;
  }

  public getTotalCols(): number {
    let cols = 0;
    this.getData().forEach((row) => {
      cols = Math.max(cols, row.cols);
    });
    return cols;
  }

  getCopyContent(options?: CopyContentOptions): string {
    return this.getLatexContent();
  }

  getLatexContent(options?: LatexExportOptions): string {
    let content = "";
    const rows = this.getData();
    const N = rows.length;
    rows.forEach((row, i) => {
      content += row.getLatexContent(options);
      if (i < N - 1) {
        content += " \\\\ \n";
      }
    });

    const env = this.name;
    let arg_str = "";
    if (this.token.args) {
      for (const arg of this.token.args) {
        arg_str += `{${arg}}`;
      }
    }

    return `\\begin{${env}}${arg_str}\n${content.trim()}\n\\end{${env}}\n`;
  }

  getTooltipContent(): string | null {
    return this.getLatexContent();
  }

  getData() {
    return this.getChildren() as EqArrayRowNode[];
  }

  getReferenceText(): string | null {
    const rows = this.getData();
    for (const row of rows) {
      if (row.numbering) {
        return `(${row.numbering})`;
      }
    }
    return null;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    let content = "";
    const rows = this.getData();
    const N = rows.length;

    // make sure to only get the raw data esp for children equations
    const isMath = Boolean(options?.math);

    rows.forEach((row, i) => {
      content += row.getMarkdownContent({ ...options, math: true });
      if (i < N - 1) {
        content += " \\\\\n";
      }
    });

    const env = this.name;
    const outStr = `\\begin{${env}}\n${content}\n\\end{${env}}\n`;
    if (isMath) {
      return outStr;
    }

    return `$$\n${outStr.trim()}\n$$\n`;
  }

  getJSONContent(options?: JSONExportOptions): EquationArrayToken {
    const rows = this.getData();
    const content: RowToken[] = rows.map((row) => row.getJSONContent(options));

    return {
      ...this.token,
      content,
    };
  }
}

export class EqArrayRowNode extends AbstractTokenNode {
  protected _columnNodes: AbstractTokenNode[][] = [];

  constructor(
    row: RowToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(row, id);
    this._initializeRow(row.content);
  }

  get token(): RowToken {
    return this._token as RowToken;
  }

  get numbering() {
    return this.token.numbering;
  }

  get cols(): number {
    return this.token.content.length;
  }

  getAnchorId(): string | null {
    return this.token.anchorId ?? null;
  }

  public isAllText(): boolean {
    return this.getData().every((column) =>
      column.every((node) => node instanceof TextTokenNode)
    );
  }

  protected _initializeRow(row_cells: BaseToken[][]): void {
    const factory = this.tokenFactory;
    if (!factory) {
      console.error("No factory found");
      return;
    }

    this._columnNodes = [];
    row_cells.forEach((column: BaseToken[], columnIndex: number) => {
      const colNodes: AbstractTokenNode[] = [];
      column.forEach((cell: BaseToken, cellIndex: number) => {
        if (!cell) return;
        const id = cell.id ?? `${this.id}/cell-${columnIndex}-${cellIndex}`;
        const cellNode = factory.createNode(cell, id);
        if (cellNode) {
          this.addChild(cellNode);
          colNodes.push(cellNode);
        }
      });
      this._columnNodes.push(colNodes);
    });
  }

  getData(): AbstractTokenNode[][] {
    return this.getColumns();
  }

  getColumns(): AbstractTokenNode[][] {
    return this._columnNodes;
  }

  getCopyContent(options?: CopyContentOptions): string {
    return this.getLatexContent();
  }

  getLatexContent(options?: LatexExportOptions): string {
    let content = "";
    const N = this.cols;
    this.getData().forEach((column, i) => {
      for (let j = 0; j < column.length; j++) {
        const node = column[j];
        if (node instanceof TextTokenNode) {
          // dont escape for math mode - use raw getData
          content += node.getData();
        } else {
          content += node.getLatexContent(options);
        }
      }
      if (i < N - 1) {
        content += " & ";
      }
    });
    return content.trim();
  }

  getReferenceText(): string | null {
    if (this.numbering) {
      return `(${this.numbering})`;
    }
    // like in latex, if no row numbering, use the next closest array numbering
    if (this.parent instanceof EquationArrayTokenNode) {
      return this.parent.getReferenceText();
    }
    return null;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    let content = "";
    const N = this.cols;
    this.getData().forEach((column, i) => {
      for (let j = 0; j < column.length; j++) {
        const node = column[j];
        content += node.getMarkdownContent(options);
      }
      if (i < N - 1) {
        content += " & ";
      }
    });
    if (this.numbering) {
      content += ` \\tag{${this.numbering}}`;
    } else {
      content += " \\notag";
    }
    return content;
  }

  getJSONContent(options?: JSONExportOptions): RowToken {
    const columns = this.getData();
    const content: BaseToken[][] = columns.map(
      (column) =>
        AbstractTokenNode.GetJSONContent(column, options) as BaseToken[]
    );

    return {
      ...this.token,
      content,
    };
  }
}

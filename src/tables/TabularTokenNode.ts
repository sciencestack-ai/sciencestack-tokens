import { BaseToken, TableCell, TabularToken, TokenType } from "../types";
import { AbstractTokenNode, BaseTokenNode } from "../index";
import { ITokenNodeFactory } from "../base/ITokenNodeFactory";
import {
  CopyContentOptions,
  LatexExportOptions,
  MarkdownExportOptions,
  JSONExportOptions,
} from "../export_types";

const createFixedArray = (length: number): boolean[] =>
  new Array(length).fill(false);

export type ResolvedTabularCell = {
  cell: CellNode;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  isHeader: boolean;
};

export class TabularTokenNode extends AbstractTokenNode {
  constructor(
    token: TabularToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id);
    this._initializeChildren();
  }

  get token(): TabularToken {
    return this._token as TabularToken;
  }

  protected _initializeChildren(): void {
    const token = this.token;
    const rows = token.content;

    rows.forEach((row, rowIndex) => {
      const rowNode = new TableRowTokenNode(
        row,
        `${this.id}/row-${rowIndex}`,
        this.tokenFactory
      );
      this.addChild(rowNode);
    });
  }

  get rows() {
    return this._children.length;
  }

  getRowCol() {
    const rows = this.rows;
    // get the max cols of all rows
    const maxCols = this.getData().reduce((max, row) => {
      return Math.max(max, row.getTotalCols());
    }, 0);
    return { rows, cols: maxCols };
  }

  /**
   * Returns a flat list of cells with their computed grid positions.
   * Handles rowspan/colspan by tracking occupied cells.
   * Useful for rendering without recomputing the grid layout.
   */
  getResolvedCells(): ResolvedTabularCell[] {
    const { rows, cols } = this.getRowCol();
    const rowNodes = this.getData();
    const resolved: ResolvedTabularCell[] = [];

    // Track occupied cells for rowspan handling
    const occupiedCells: boolean[][] = [];
    for (let r = 0; r < rows; r++) {
      occupiedCells.push(createFixedArray(cols));
    }

    rowNodes.forEach((rowNode, rowIndex) => {
      const cells = rowNode.getData();
      const isHeader = rowIndex === 0;

      // Handle null/empty rows - mark all as occupied
      if (rowNode.isNullRow()) {
        for (let c = 0; c < cols; c++) {
          occupiedCells[rowIndex][c] = true;
        }
        return;
      }

      let currentColIndex = 0;

      cells.forEach((cellNode) => {
        // Skip grid cells that have already been occupied
        if (occupiedCells[rowIndex][currentColIndex]) {
          currentColIndex++;
          return; // Skip this cell
        }

        const rowSpan = cellNode.rows;
        const colSpan = cellNode.cols;

        // Mark grid cells as occupied for merged cells
        for (let r = 0; r < rowSpan; r++) {
          const targetRow = rowIndex + r;
          if (targetRow < rows) {
            for (let c = 0; c < colSpan; c++) {
              if (currentColIndex + c < cols) {
                occupiedCells[targetRow][currentColIndex + c] = true;
              }
            }
          }
        }

        resolved.push({
          cell: cellNode,
          row: rowIndex,
          col: currentColIndex,
          rowSpan,
          colSpan,
          isHeader,
        });

        currentColIndex += colSpan;
      });
    });

    return resolved;
  }

  getData(): TableRowTokenNode[] {
    return this.getChildren() as TableRowTokenNode[];
  }

  getCopyContent(options?: CopyContentOptions): string {
    const rows = this.getData();
    return rows.map((row) => row.getCopyContent(options)).join("\n");
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

    return `\\begin{tabular}\n${content}\n\\end{tabular}\n`;
  }

  getTooltipContent() {
    return null;
  }

  /**
   * Check if any cell has rowspan > 1 or colspan > 1
   */
  private hasComplexCells(): boolean {
    for (const row of this.getData()) {
      for (const cell of row.getData()) {
        if (cell.rows > 1 || cell.cols > 1) {
          return true;
        }
      }
    }
    return false;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const rows = this.getData();
    if (rows.length === 0) return "";

    // Use HTML table for complex tables with rowspan/colspan
    if (this.hasComplexCells()) {
      return this.getMarkdownContentAsHtml(options);
    }

    // Simple GFM table
    let markdown = "";
    rows.forEach((row, index) => {
      const rowContent = row.getMarkdownContent(options).trim();
      if (rowContent.length === 0) return;
      markdown += `| ${rowContent} |\n`;

      // Add header separator after first row
      if (index === 0) {
        const cellCount = row.getData().length;
        const separator = Array(cellCount).fill("---").join(" | ");
        markdown += `| ${separator} |\n`;
      }
    });

    return markdown + "\n";
  }

  /**
   * Render table as HTML for markdown (supports rowspan/colspan)
   */
  private getMarkdownContentAsHtml(options?: MarkdownExportOptions): string {
    const resolvedCells = this.getResolvedCells();
    const { rows } = this.getRowCol();

    // Group cells by row
    const cellsByRow: Map<number, ResolvedTabularCell[]> = new Map();
    for (let r = 0; r < rows; r++) {
      cellsByRow.set(r, []);
    }
    for (const rc of resolvedCells) {
      cellsByRow.get(rc.row)?.push(rc);
    }

    let html = "<table>\n";

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const rowCells = cellsByRow.get(rowIndex) || [];

      // Empty row
      if (rowCells.length === 0) {
        html += "  <tr></tr>\n";
        continue;
      }

      html += "  <tr>\n";

      for (const { cell, rowSpan, colSpan, isHeader } of rowCells) {
        const cellTag = isHeader ? "th" : "td";

        // Build cell attributes
        const attrs: string[] = [];
        if (rowSpan > 1) attrs.push(`rowspan="${rowSpan}"`);
        if (colSpan > 1) attrs.push(`colspan="${colSpan}"`);
        const attrStr = attrs.length > 0 ? " " + attrs.join(" ") : "";

        const content = cell.getMarkdownContent(options);
        html += `    <${cellTag}${attrStr}>${content}</${cellTag}>\n`;
      }

      html += "  </tr>\n";
    }

    html += "</table>\n";
    return html;
  }

  getJSONContent(options?: JSONExportOptions): TabularToken {
    const rows = this.getData();
    const content: TableCell[][] = rows.map((row) =>
      row.getJSONContent(options)
    );

    return {
      ...this.token,
      content,
    };
  }
}

class TableRowTokenNode extends AbstractTokenNode {
  constructor(
    row: TableCell[],
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    // Wrap the row data in a dummy token.
    const dummyToken: BaseToken = {
      type: "table_row" as unknown as TokenType,
      id: id,
      content: "",
    };
    super(dummyToken, id);

    this._initializeRow(row);
  }

  /**
   * Initializes the row's children by iterating over each cell.
   * Each cell may be an array of tokens (if the cell contains complex elements)
   * or a string (if the cell is plain text).
   */
  protected _initializeRow(row_cells: TableCell[]): void {
    row_cells.forEach((cell: TableCell, cellIndex: number) => {
      const cellNode = new CellNode(
        cell,
        `${this.id}/cell-${cellIndex}`,
        this.tokenFactory
      );
      this.addChild(cellNode);
    });
  }

  /**
   * Returns the total number of effective columns for this row.
   * Sums each cell's colspan (defaulting to 1).
   */
  public getTotalCols(): number {
    return this.getData().reduce((sum, cell) => sum + (cell.cols || 1), 0);
  }

  getData(): CellNode[] {
    return this.getChildren() as CellNode[];
  }

  getCopyContent(options?: CopyContentOptions): string {
    const cells = this.getData();
    return cells.map((cell) => cell.getCopyContent(options)).join(" ");
  }

  getLatexContent(options?: LatexExportOptions): string {
    let content = "";
    const cells = this.getData();
    const N = cells.length;
    cells.forEach((cell, i) => {
      content += cell.getLatexContent(options);
      if (i < N - 1) {
        content += " & ";
      }
    });

    return content;
  }

  getTooltipContent() {
    return null;
  }

  isNullRow(): boolean {
    return this.getData().every((cell) => !cell.hasChildren());
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const cells = this.getData();
    return cells.map((cell) => cell.getMarkdownContent(options)).join(" | ");
  }

  getJSONContent(options?: JSONExportOptions): any {
    const cells = this.getData();
    return cells.map((cell) => ({
      rowspan: cell.rows,
      colspan: cell.cols,
      ...(cell.styles.length > 0 && { styles: cell.styles }),
      content: cell.hasChildren()
        ? (AbstractTokenNode.GetJSONContent(
            cell.getChildren(),
            options
          ) as BaseToken[])
        : [],
    }));
  }
}

class CellNode extends BaseTokenNode {
  protected _rows = 1;
  protected _cols = 1;
  protected _styles: string[] = [];

  get styles(): string[] {
    return this._styles;
  }

  constructor(
    token: TableCell,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    const dummyToken: BaseToken = {
      type: "cell" as unknown as TokenType,
      id: id,
      content: null,
    };
    super(dummyToken, id);

    // Extract cell properties
    this._styles = token.styles || [];
    this._rows = token.rowspan || 1;
    this._cols = token.colspan || 1;

    // Initialize children from content array
    if (token.content && token.content.length > 0) {
      this._initializeChildCells(token.content);
    }
  }

  get rows(): number {
    return this._rows;
  }

  get cols(): number {
    return this._cols;
  }

  getData() {
    return this.getChildren();
  }

  getCellColor(): string | null {
    const styles = this.styles;
    if (styles) {
      for (const style of styles) {
        if (style.startsWith("color=")) {
          return style.split("=")[1];
        }
      }
    }
    return null;
  }

  protected _initializeChildCells(tokens: BaseToken[]) {
    const factory = this.tokenFactory;
    if (!factory) {
      console.error("No factory found");
      return;
    }

    tokens.forEach((token, tokenIndex) => {
      const cellId = token.id ?? `${this.id}/cell-${tokenIndex}`;
      const cellNode = factory.createNode(token, cellId);
      if (cellNode) {
        this.addChild(cellNode);
      }
    });
  }

  getTooltipContent() {
    return null;
  }

  getCopyContent(options?: CopyContentOptions): string {
    if (this.hasChildren()) {
      return super.getCopyContent(options).trim();
    }
    return "";
  }

  getLatexContent(options?: LatexExportOptions): string {
    let content = "";
    if (this.hasChildren()) {
      content = super.getLatexContent(options).trim();
      if (content.length > 1 && this.getChildren().length > 1) {
        content = `\\makecell{${content}}`;
      }
    }

    // multirow multicol syntax
    let output = content.trim();
    if (this.rows > 1) {
      output = `\\multirow{${this.rows}}{*}{${output}}`;
    }
    if (this.cols > 1) {
      output = `\\multicolumn{${this.cols}}{*}{${output}}`;
    }

    return output;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    if (this.hasChildren()) {
      return super.getMarkdownContent(options).trim();
    }
    return "";
  }
}

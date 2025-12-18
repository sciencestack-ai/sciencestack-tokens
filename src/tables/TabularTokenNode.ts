import { BaseToken, TableCell, TabularToken, TokenType } from '../types';
import { AbstractTokenNode, BaseTokenNode } from '../';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions, JSONExportOptions } from '../export_types';

const createFixedArray = (length: number): boolean[] => new Array(length).fill(false);

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
      const rowNode = new TableRowTokenNode(row, `${this.id}/row-${rowIndex}`, this.tokenFactory);
      this.addChild(rowNode);
    });

    this._postProcessRows();
  }

  private _postProcessRows() {
    const { rows, cols } = this.getRowCol();
    let occupiedCells: boolean[][] = createFixedArray(rows).map(() => createFixedArray(cols));

    let emptyRowIndex = 0;
    let insertedRows = 0;

    // First pass: process each row to find conflicts and mark occupied cells
    for (let r = 0; r < this.rows; r++) {
      const rowNode = this.getData()[r];
      const cells = rowNode.getData();

      // Ensure occupiedCells has enough rows
      const requiredRows = r + insertedRows + 1;
      while (occupiedCells.length < requiredRows) {
        occupiedCells.push(createFixedArray(cols));
      }

      let currentCol = 0;
      let needsEmptyRow = false;

      // Check if any cell in this row conflicts with occupied cells
      for (let c = 0; c < cells.length; c++) {
        const cell = cells[c];

        // Skip cells with empty data - they don't cause conflicts
        if (!cell.hasChildren()) {
          currentCol += cell.cols;
          continue;
        }

        const colspan = cell.cols;

        // Check if any of the cells this would occupy are already marked as occupied
        for (let i = 0; i < colspan; i++) {
          if (currentCol + i < cols && occupiedCells[r + insertedRows][currentCol + i]) {
            needsEmptyRow = true;
            break;
          }
        }

        if (needsEmptyRow) break;
        currentCol += colspan;
      }

      // If we found a conflict, insert an empty row and process this row again
      if (needsEmptyRow) {
        const emptyRow = new TableRowTokenNode([], `${this.id}/emptyrow-${emptyRowIndex}`, this.tokenFactory);

        // Insert the empty row before the current row
        this._children.splice(r + insertedRows, 0, emptyRow);
        insertedRows++;
        emptyRowIndex++;

        // Reset and try again with the same row, but now it's pushed down
        r--;
        continue;
      }

      // No conflicts found, mark cells as occupied based on rowspan
      currentCol = 0;
      for (let c = 0; c < cells.length; c++) {
        const cell = cells[c];
        const rowspan = cell.rows;
        const colspan = cell.cols;

        // Ensure occupiedCells has enough rows for the rowspan
        const maxRowNeeded = r + insertedRows + rowspan;
        while (occupiedCells.length < maxRowNeeded) {
          occupiedCells.push(createFixedArray(cols));
        }

        // Mark all cells this cell occupies as taken
        for (let i = 0; i < rowspan; i++) {
          for (let j = 0; j < colspan; j++) {
            if (currentCol + j < cols) {
              occupiedCells[r + insertedRows + i][currentCol + j] = true;
            }
          }
        }

        currentCol += colspan;
      }
    }
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

  getData(): TableRowTokenNode[] {
    return this.getChildren() as TableRowTokenNode[];
  }

  getCopyContent(options?: CopyContentOptions): string {
    const rows = this.getData();
    return rows.map((row) => row.getCopyContent(options)).join('\n');
  }

  getLatexContent(options?: LatexExportOptions): string {
    let content = '';
    const rows = this.getData();
    const N = rows.length;
    rows.forEach((row, i) => {
      content += row.getLatexContent(options);
      if (i < N - 1) {
        content += ' \\\\ \n';
      }
    });

    return `\\begin{tabular}\n${content}\n\\end{tabular}\n`;
  }

  getTooltipContent() {
    return null;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const rows = this.getData();

    // For now, implement simple GFM table (no rowspan/colspan support)
    // TODO: Add HTML table fallback for complex tables
    if (rows.length === 0) return '';

    let markdown = '';
    rows.forEach((row, index) => {
      const rowContent = row.getMarkdownContent(options).trim();
      if (rowContent.length === 0) return;
      markdown += `| ${rowContent} |\n`;

      // Add header separator after first row
      if (index === 0) {
        const cellCount = row.getData().length;
        const separator = Array(cellCount).fill('---').join(' | ');
        markdown += `| ${separator} |\n`;
      }
    });

    return markdown;
  }

  getJSONContent(options?: JSONExportOptions): TabularToken {
    const rows = this.getData();
    const content: TableCell[][] = rows.map((row) => row.getJSONContent(options));

    return {
      ...this.token,
      content
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
      type: 'table_row' as unknown as TokenType,
      id: id,
      content: ''
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
      const cellNode = new CellNode(cell, `${this.id}/cell-${cellIndex}`, this.tokenFactory);
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
    return cells.map((cell) => cell.getCopyContent(options)).join(' ');
  }

  getLatexContent(options?: LatexExportOptions): string {
    let content = '';
    const cells = this.getData();
    const N = cells.length;
    cells.forEach((cell, i) => {
      content += cell.getLatexContent(options);
      if (i < N - 1) {
        content += ' & ';
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
    return cells.map((cell) => cell.getMarkdownContent(options)).join(' | ');
  }

  getJSONContent(options?: JSONExportOptions): any {
    const cells = this.getData();
    return cells.map((cell) => ({
      rowspan: cell.rows,
      colspan: cell.cols,
      ...(cell.styles.length > 0 && { styles: cell.styles }),
      content: cell.hasChildren() ? (AbstractTokenNode.GetJSONContent(cell.getChildren(), options) as BaseToken[]) : []
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
      type: 'cell' as unknown as TokenType,
      id: id,
      content: null
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
        if (style.startsWith('color=')) {
          return style.split('=')[1];
        }
      }
    }
    return null;
  }

  protected _initializeChildCells(tokens: BaseToken[]) {
    const factory = this.tokenFactory;
    if (!factory) {
      console.error('No factory found');
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
    return '';
  }

  getLatexContent(options?: LatexExportOptions): string {
    let content = '';
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
    return '';
  }
}

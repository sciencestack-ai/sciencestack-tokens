import { AlgorithmicToken, AlgorithmToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class AlgorithmTokenNode extends BaseTokenNode {
  constructor(
    token: AlgorithmToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get numbering() {
    return this.token.numbering;
  }

  get token(): AlgorithmToken {
    return this._token as AlgorithmToken;
  }

  getLatexContent(options?: LatexExportOptions): string {
    const content = super.getLatexContent(options);
    return `\\begin{algorithm}\n${content}\n\\end{algorithm}\n`;
  }

  getReferenceText(): string {
    return this.numbering ? `Algorithm ${this.numbering}` : '';
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const anchorId = this.getAnchorId();
    const anchor = anchorId ? `<a id="${anchorId}"></a>\n\n` : '';

    // Simple heading as per test.md spec, following same pattern as Figure/Table: "#### Algorithm N"
    const heading = `<u><b>${this.numbering ? `Algorithm ${this.numbering}` : 'Algorithm'}</b></u>`;

    // Children render normally under this heading
    const content = super.getMarkdownContent(options);

    return `${anchor}${heading}\n\n${content}`;
  }
}

export class AlgorithmicTokenNode extends BaseTokenNode {
  constructor(
    token: AlgorithmicToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): AlgorithmicToken {
    return this._token as AlgorithmicToken;
  }

  getData() {
    return this.token.content;
  }

  getLatexContent(options?: LatexExportOptions): string {
    return `\\begin{algorithmic}\n${this.getData()}\n\\end{algorithmic}\n`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const algorithmContent = this.getData();
    const anchorId = this.getAnchorId();
    const anchor = anchorId ? `<a id="${anchorId}"></a>\n\n` : '';

    // Render as fenced code block with pseudocode language hint
    return `${anchor}\`\`\`pseudocode\n${algorithmContent}\n\`\`\``;
  }
}

import { CodeToken, DisplayType } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class CodeTokenNode extends BaseTokenNode {
  constructor(
    token: CodeToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): CodeToken {
    return this._token as CodeToken;
  }

  get title() {
    return this.token.title;
  }

  getData() {
    return this.token.content;
  }

  getCopyContent(options?: CopyContentOptions): string {
    // Just raw code for copy-paste
    return this.getData();
  }

  getLatexContent(options?: LatexExportOptions): string {
    if (this.isInline) {
      return `\\verb|${this.getData()}|`;
    }
    return `\\begin{lstlisting}[${this.title}]\n${this.getData()}\n\\end{lstlisting}\n`;
  }

  get isInline(): boolean {
    return this.token.display === DisplayType.INLINE;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const code = this.getData();
    const anchorId = this.getAnchorId();
    const anchor = anchorId ? `<a id="${anchorId}"></a>\n\n` : '';

    if (this.isInline) {
      return `\`${code}\``;
    }

    // Block code with language hint from title if available
    const language = this.title || '';
    return `${anchor}\`\`\`${language}\n${code}\n\`\`\``;
  }
}

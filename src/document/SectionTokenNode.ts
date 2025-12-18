import { BaseToken, SECTION_LEVELS, SectionToken } from '../types';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { BaseEnvTokenNode } from './BaseEnvTokenNode';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { AbstractTokenNode } from '../base/AbstractTokenNode';
import { LatexExportOptions, MarkdownExportOptions } from '../export_types';

export class SectionTokenNode extends BaseEnvTokenNode {
  constructor(
    token: SectionToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): SectionToken {
    return this._token as SectionToken;
  }

  get level(): number {
    return this.token.level;
  }

  get numbering() {
    // don't number paragraphs
    if (this.level >= 4) return undefined;
    return this.token.numbering;
  }

  get prefix(): string {
    let prefix = '\\section';
    if (this.level in SECTION_LEVELS) {
      prefix = `\\${SECTION_LEVELS[this.level as keyof typeof SECTION_LEVELS]}`;
    }
    return prefix;
  }

  getLatexContent(options?: LatexExportOptions): string {
    let prefix = this.prefix;

    const titleData = this.getTitleData();
    if (titleData.length > 0) {
      prefix += `{${BaseTokenNode.GetLatexContent(titleData, options)}}`;
    } else {
      prefix += '{}';
    }

    const content = super.getLatexContent(options);

    return `${prefix}\n${content}\n`;
  }

  getAnchorId(prefix = 'sec') {
    return super.getAnchorId(prefix);
  }

  getReferenceText(): string | null {
    return this.numbering ? `Section ${this.numbering}` : null;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const titleData = this.getTitleData();
    let title = '';
    if (titleData.length > 0) {
      title = AbstractTokenNode.GetMarkdownContent(titleData, options);
    }

    // Create heading based on level (## for level 1, ### for level 2, etc.)
    const headerLevel = Math.min(this.level + 1, 6); // Cap at 6 levels
    const headerPrefix = '#'.repeat(headerLevel);

    // Add numbering if available: "2: Title" or "2.1: Title"
    const numberedTitle = this.numbering ? `${this.numbering}: ${title}` : title;

    const anchorId = this.getAnchorId();
    const anchor = anchorId ? `<a id="${anchorId}"></a>\n\n` : '';

    const content = AbstractTokenNode.GetMarkdownContent(this.getContentData(), options);
    const titleStr = `${anchor}${headerPrefix} ${numberedTitle}\n---`;
    return `${titleStr}\n\n${content}`;
  }
}

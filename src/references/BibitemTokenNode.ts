import { BibItemToken, BibFormat, SemanticScholarCitation } from '../types';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { AbstractTokenNode } from '../base/AbstractTokenNode';
import { convertTokens2String } from '../utils';
import { CitationStyle, formatCitation, ParsedBibTeX, replaceBibtexKey } from '../utils/citationConverters';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions } from '../export_types';
import { extractArxivIdFromBibtexFields, extractArxivId } from '../utils/arxiv';

export class BibitemTokenNode extends AbstractTokenNode {
  private _cachedContent: string | null = null;

  constructor(
    token: BibItemToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id);
  }

  get token(): BibItemToken {
    return this._token as BibItemToken;
  }

  get label(): string | undefined {
    return this.token.label;
  }

  get format(): BibFormat {
    return this.token.format;
  }

  get fields(): Record<string, string> | undefined {
    return this.token.fields;
  }

  get semanticScholar(): SemanticScholarCitation | undefined {
    return this.token.semanticScholar;
  }

  get key(): string {
    return this.token.key;
  }

  getSSId(): string | undefined {
    return this.semanticScholar?.paperId;
  }

  getArxivId(): string | undefined {
    // First try Semantic Scholar data
    const ssArxivId = this.semanticScholar?.externalIds?.ArXiv;
    if (ssArxivId) {
      return ssArxivId;
    }

    // If no SS data, try extracting from BibTeX fields
    if (this.fields) {
      const fieldsArxivId = extractArxivIdFromBibtexFields(this.fields);
      if (fieldsArxivId) {
        return fieldsArxivId;
      }
    }

    // Finally, try extracting from content string
    const contentStr = this.getContentStr();
    if (contentStr) {
      return extractArxivId(contentStr);
    }

    return undefined;
  }

  getDOI(): string | undefined {
    return this.semanticScholar?.externalIds?.DOI;
  }

  isBibtex(): boolean {
    return this.format === BibFormat.BIBTEX;
  }

  getBibtexStr(): string | null {
    if (this.isBibtex()) {
      const _token = this.token;
      if (typeof _token.content === 'string') {
        return _token.content;
      }
    }
    if (this.semanticScholar?.citationStyles?.bibtex) {
      let bibtex = this.semanticScholar.citationStyles.bibtex;
      bibtex = replaceBibtexKey(bibtex, this.key);
      return bibtex;
    }
    return null;
  }

  getContentStr(): string {
    // Return cached content if available and no specific style requested
    if (this._cachedContent !== null) {
      return this._cachedContent;
    }

    if (this.format === BibFormat.BIBTEX) {
      // use fields
      const fields = this.fields;
      if (fields) {
        try {
          const parsedBibtex: ParsedBibTeX = {
            authors: fields['author'] || fields['authors'] || '?',
            title: fields['title'],
            journal: fields['journal'],
            year: fields['year'],
            volume: fields['volume']
          };
          this._cachedContent = formatCitation(parsedBibtex, CitationStyle.HOVER, { forCopy: true });
          return this._cachedContent;
        } catch (error) {
          console.error('Error converting BibTeX:', error);
          // Fallback to raw content if conversion fails
        }
      }
    }

    // If we reach here, either format is not BibTeX or conversion failed
    const _token = this.token;
    if (typeof _token.content === 'string') {
      return _token.content;
    }
    if (!_token.content) {
      return '';
    }
    const result = convertTokens2String(_token.content);

    this._cachedContent = result;
    return result;
  }

  getData() {
    return {
      label: this.label,
      format: this.format,
      content: this.token.content,
      fields: this.fields,
      semanticScholar: this.semanticScholar
    };
  }

  getCopyContent(options?: CopyContentOptions): string {
    // Human-readable citation text
    return this.getContentStr();
  }

  getLatexContent(options?: LatexExportOptions): string {
    const bibtexStr = this.getBibtexStr();
    if (bibtexStr) {
      return bibtexStr;
    }

    // bibitem
    const contentStr = this.getContentStr();
    const prefix = `\\bibitem{${this.key}}\n`;
    return prefix + contentStr;
  }

  getTooltipContent(): string | null {
    return this.getContentStr();
  }

  getAnchorId(): string | null {
    return `bib-${this.key}`;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const contentStr = this.getContentStr();
    const anchorId = this.getAnchorId();
    const anchor = anchorId ? `<a id="${anchorId}"></a>` : '';

    // Format as a markdown reference entry
    return `- ${anchor}[${this.key}] ${contentStr}`;
  }
}

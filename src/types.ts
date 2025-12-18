// Enum definitions
export enum TokenType {
  // Document/Content Structure
  DOCUMENT = 'document',
  TITLE = 'title',
  SECTION = 'section',
  ABSTRACT = 'abstract',
  APPENDIX = 'appendix',
  COMMAND = 'command',

  // Text
  TEXT = 'text',
  QUOTE = 'quote',

  // ENV related
  ENVIRONMENT = 'environment',
  MATH_ENV = 'math_env',
  GROUP = 'group',

  // Tables & Figures
  FIGURE = 'figure',
  SUBFIGURE = 'subfigure',
  TABLE = 'table',
  SUBTABLE = 'subtable',
  TABULAR = 'tabular',
  CAPTION = 'caption',

  // graphics
  INCLUDEGRAPHICS = 'includegraphics',
  INCLUDEPDF = 'includepdf',
  DIAGRAM = 'diagram',

  // Lists
  LIST = 'list',
  ITEM = 'item',

  // Math & Technical
  EQUATION = 'equation',
  EQUATION_ARRAY = 'equation_array',
  ROW = 'row', // for equation array
  CODE = 'code',
  ALGORITHM = 'algorithm',
  ALGORITHMIC = 'algorithmic',

  // References & Links
  CITATION = 'citation',
  REF = 'ref',
  URL = 'url',
  FOOTNOTE = 'footnote',

  // Bibliography
  BIBLIOGRAPHY = 'bibliography',
  BIBITEM = 'bibitem',

  // Metadata
  MAKETITLE = 'maketitle',
  AUTHOR = 'author'
}

export enum DisplayType {
  INLINE = 'inline',
  BLOCK = 'block'
}

export enum ListType {
  ENUMERATE = 'enumerate',
  ITEMIZE = 'itemize',
  DESCRIPTION = 'description'
}

// Base interfaces
export interface IToken {
  type: TokenType;
  id?: string;
  styles?: string[]; // maps to STYLE_TO_TAILWIND or contains e.g. color=red, color={HTML: FF0000}, or highlight=red
  labels?: string[];
}

export interface BaseToken extends IToken {
  content: string | BaseToken[] | null;
  anchorId?: string;
}

export interface QuoteToken extends BaseToken {
  type: TokenType.QUOTE;
}

export interface TextToken extends BaseToken {
  type: TokenType.TEXT;
  content: string;
}

export interface GroupToken extends BaseToken {
  type: TokenType.GROUP;
  content: BaseToken[];
}

export interface AbstractToken extends BaseToken {
  type: TokenType.ABSTRACT;
  content: BaseToken[];
}

export interface AppendixToken extends BaseToken {
  type: TokenType.APPENDIX;
  content: BaseToken[];
  id: string;
}

export interface EnvironmentToken extends BaseToken {
  type: TokenType.ENVIRONMENT;
  name?: string;
}

export interface MathEnvToken extends BaseToken {
  type: TokenType.MATH_ENV;
  name: string;
  numbering?: string;
  title?: BaseToken[];
  proof?: MathEnvToken;
}

// Document structure interfaces
export interface DocumentToken extends BaseToken {
  type: TokenType.DOCUMENT;
}

export interface TitleToken extends BaseToken {
  type: TokenType.TITLE;
  content: BaseToken[];
}
export const SECTION_LEVELS = {
  1: 'section',
  2: 'subsection',
  3: 'subsubsection',
  4: 'paragraph',
  5: 'subparagraph'
} as const;

export interface SectionToken extends Omit<BaseToken, 'content'> {
  type: TokenType.SECTION;
  title: BaseToken[];
  level: number; // SECTION_LEVELS
  numbering?: string;
  content: BaseToken[];
  id: string;
}

// Math and equations
export interface EquationToken extends BaseToken {
  type: TokenType.EQUATION;
  content: string | BaseToken[];
  align?: boolean;
  display?: DisplayType;
  numbering?: string;
  placeholders?: Record<string, BaseToken[]>;
}

export interface RowToken extends IToken {
  type: TokenType.ROW;
  content: BaseToken[][]; // column x tokens per column
  numbering?: string;
  anchorId?: string;
}

export interface EquationArrayToken extends IToken {
  type: TokenType.EQUATION_ARRAY;
  name: string; // e.g. align, array, matrix, etc
  content: RowToken[];
  args?: string[]; // e.g. ['l'] for \begin{array}{l}
}

// Tables and figures
export interface TableCell {
  content: BaseToken[];
  styles?: string[]; // same as styles in IToken
  rowspan?: number;
  colspan?: number;
}

export interface TabularToken extends IToken {
  type: TokenType.TABULAR;
  content: TableCell[][];
}

export interface FigureToken extends BaseToken {
  type: TokenType.FIGURE;
  numbering?: string;
}

export interface SubFigureToken extends BaseToken {
  type: TokenType.SUBFIGURE;
  numbering?: string;
}

export interface SubTableToken extends BaseToken {
  type: TokenType.SUBTABLE;
  numbering?: string;
}

export interface TableToken extends BaseToken {
  type: TokenType.TABLE;
  numbering?: string;
}

export interface CaptionToken extends BaseToken {
  type: TokenType.CAPTION;
  content: BaseToken[];
  numbering?: string;
  counter_name?: string; // e.g. figure, table
}

export interface FootnoteToken extends BaseToken {
  type: TokenType.FOOTNOTE;
  content: BaseToken[];
}

// References and citations
export interface CitationToken extends IToken {
  type: TokenType.CITATION;
  title?: BaseToken[];
  content: string[];
}

export interface ReferenceToken extends IToken {
  type: TokenType.REF;
  title?: BaseToken[];
  content: string[];
}

export interface UrlToken extends BaseToken {
  type: TokenType.URL;
  title?: BaseToken[]; // ASTs (could be equations too etc)
  content: string; // url string
}

// Code and algorithms
export interface CodeToken extends BaseToken {
  type: TokenType.CODE;
  title?: string;
  content: string;
  display: DisplayType;
}

export interface AlgorithmToken extends BaseToken {
  type: TokenType.ALGORITHM;
  content: BaseToken[];
  numbering?: string;
}

export interface AlgorithmicToken extends BaseToken {
  type: TokenType.ALGORITHMIC;
  content: string;
}

// Lists
export interface ListItemToken extends BaseToken {
  type: TokenType.ITEM;
  title?: BaseToken[];
}

export interface ListToken extends BaseToken {
  type: TokenType.LIST;
  name: ListType;
  content: ListItemToken[];
  inline?: boolean;
}

export interface CommandToken extends BaseToken {
  type: TokenType.COMMAND;
  command: string;
  content: string | null;
  args?: BaseToken[];
  opt_args?: BaseToken[];
}

export const METADATA_TOKEN_TYPES = ['email', 'affiliation', 'address', 'keywords', 'thanks'];

// Metadata
export interface MakeTitleToken extends BaseToken {
  type: TokenType.MAKETITLE;
  content: BaseToken[];
}

export interface MetadataToken extends BaseToken {
  content: BaseToken[];
}

export interface AuthorToken extends MetadataToken {
  type: TokenType.AUTHOR;
  content: BaseToken[]; // could be delimited by \and i.e. CommandToken['command'].lower()=='and'
}

export enum GraphicsErrorType {
  // File errors
  FILE_NOT_FOUND = 'file_not_found',

  // Processing errors
  CONVERSION_FAILED = 'conversion_failed',
  COMPILATION_FAILED = 'compilation_failed',
  EXTRACTION_FAILED = 'extraction_failed',

  // Upload errors
  UPLOAD_FAILED = 'upload_failed',

  // General errors
  DIMENSION_ERROR = 'dimension_error',
  PROCESSING_ERROR = 'processing_error',

  NOT_ENABLED = 'not_enabled'
}

interface BaseGraphicsToken extends BaseToken {
  path?: string;
  width?: number;
  height?: number;
  error?: { message: string; type: GraphicsErrorType };
}

// graphics
export interface IncludeGraphicsToken extends BaseGraphicsToken {
  type: TokenType.INCLUDEGRAPHICS;
}

export interface IncludePdfToken extends BaseGraphicsToken {
  type: TokenType.INCLUDEPDF;
}

export interface DiagramToken extends BaseGraphicsToken {
  type: TokenType.DIAGRAM;
  name: string; // tikzpicture, picture, etc
  content: string; // code content of the diagram e.g. \begin{tikzpicture} ... \end{tikzpicture}
}

export enum BibFormat {
  BIBTEX = 'bibtex',
  BIBITEM = 'bibitem'
}

// bibliography
export interface BibItemToken extends IToken {
  type: TokenType.BIBITEM;
  key: string; // cite_key
  format: BibFormat;
  content: string | BaseToken[];
  label?: string;
  fields?: Record<string, string>;
  semanticScholar?: SemanticScholarCitation;
}

// key is cite_key
export type Bibliography = { key: string; value: BibItemToken }[];

export type SemanticScholarCitation = {
  paperId: string; // semantic scholar paper id
  title: string;
  authors: { name: string; authorId: string }[];
  journal?: Record<string, string> | null; // e.g. name, volume, pages
  publicationDate?: string | null;
  externalIds?: Record<string, string> | null; // e.g. DOI, ArXiv, etc.
  citationStyles?: Record<string, string> | null; // e.g. bibtex, apa, etc.
};

// key is cite_key (linked to bibliography keys)
export type SemanticScholarBibliography = Record<string, SemanticScholarCitation>;

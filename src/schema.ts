import { TokenType } from "./types";

/**
 * Schema metadata for all token types
 * Describes the structure and semantic meaning of each token type
 */

export interface FieldSchema {
  type: string;
  range?: [number, number]; // For numeric fields with min/max constraints
  enum?: string[]; // For fields with specific valid values
}

export interface TokenSchema {
  contentType: string;
  description: string;
  requiredFields?: Record<string, FieldSchema>; // Required fields beyond type/content
}

export const TOKEN_SCHEMA: Record<TokenType, TokenSchema> = {
  // Document/Content Structure
  [TokenType.DOCUMENT]: {
    contentType: "BaseToken[]",
    description: "Document container. Often root, but not always.",
  },
  [TokenType.TITLE]: {
    contentType: "BaseToken[]",
    description: "Document title",
  },
  [TokenType.SECTION]: {
    contentType: "BaseToken[]",
    description:
      "Section with hierarchical levels. 'title' contains section heading tokens, 'level' indicates depth (1-5), where section, subsection, subsubsection, paragraph and subparagraph are levels 1-5 respectively.",
    requiredFields: {
      title: { type: "BaseToken[]" },
      level: { type: "number", range: [1, 5] },
    },
  },
  [TokenType.ABSTRACT]: {
    contentType: "BaseToken[]",
    description: "Document abstract",
  },
  [TokenType.APPENDIX]: {
    contentType: "BaseToken[]",
    description: "Used to mark document appendix section",
  },
  [TokenType.COMMAND]: {
    contentType: "string | null",
    description:
      "LaTeX command token. 'command' field specifies the command name (e.g., 'textbf', 'emph').",
    requiredFields: {
      command: { type: "string" },
    },
  },

  // Text
  [TokenType.TEXT]: {
    contentType: "string",
    description: "Plain text content",
  },
  [TokenType.QUOTE]: {
    contentType: "BaseToken[]",
    description: "Block quote",
  },

  // ENV related
  [TokenType.ENVIRONMENT]: {
    contentType: "BaseToken[]",
    description: "Generic LaTeX environment \\begin{...}",
    requiredFields: {
      name: { type: "string" },
    },
  },
  [TokenType.MATH_ENV]: {
    contentType: "BaseToken[]",
    description:
      "Math environment (theorem, lemma, proof, etc.). 'name' specifies the environment type (e.g., 'theorem', 'proof', 'definition').",
    requiredFields: {
      name: { type: "string" },
    },
  },
  [TokenType.GROUP]: {
    contentType: "BaseToken[]",
    description: "Group of tokens (typically from braces)",
  },

  // Tables & Figures
  [TokenType.FIGURE]: {
    contentType: "BaseToken[]",
    description:
      "Figure container, typically containing captions and includegraphics tokens",
  },
  [TokenType.SUBFIGURE]: {
    contentType: "BaseToken[]",
    description: "Subfigure within a figure",
  },
  [TokenType.TABLE]: {
    contentType: "BaseToken[]",
    description:
      "Table container, typically containing captions and tabular tokens",
  },
  [TokenType.SUBTABLE]: {
    contentType: "BaseToken[]",
    description: "Subtable within a table",
  },
  [TokenType.TABULAR]: {
    contentType: "TableCell[][]",
    description:
      "Tabular data structure. 'content' is a 2D array of TableCell objects (rows × columns). Each TableCell has: 'content' (BaseToken[]), optional 'styles' (string[]), optional 'colspan' (like \\multicolumn when > 1), and optional 'rowspan' (like \\multirow when > 1).",
  },
  [TokenType.CAPTION]: {
    contentType: "BaseToken[]",
    description: "Caption for figures, tables, algorithms etc",
  },

  // Graphics
  [TokenType.INCLUDEGRAPHICS]: {
    contentType: "string",
    description: "Included graphics file",
  },
  [TokenType.INCLUDEPDF]: {
    contentType: "string",
    description: "Included PDF file",
  },
  [TokenType.DIAGRAM]: {
    contentType: "string",
    description:
      "Diagram code (TikZ, picture, etc.). 'name' specifies diagram type (e.g., 'tikzpicture', 'picture').",
    requiredFields: {
      name: { type: "string" },
    },
  },

  // Lists
  [TokenType.LIST]: {
    contentType: "BaseToken[]",
    description:
      "List container containing ListItemTokens. 'name' specifies list type (enumerate, itemize, or description).",
    requiredFields: {
      name: { type: "ListType", enum: ["enumerate", "itemize", "description"] },
    },
  },
  [TokenType.ITEM]: {
    contentType: "BaseToken[]",
    description: "List item",
  },

  // Math & Technical
  [TokenType.EQUATION]: {
    contentType: "string | BaseToken[]",
    description:
      "Mathematical equation. 'content' is LaTeX math code (string) or parsed/structured tokens (BaseToken[]).",
  },
  [TokenType.EQUATION_ARRAY]: {
    contentType: "RowToken[]",
    description:
      "Array of equations. 'name' specifies array type (e.g., 'align', 'array', 'matrix').",
    requiredFields: {
      name: { type: "string" },
    },
  },
  [TokenType.ROW]: {
    contentType: "BaseToken[][]",
    description:
      "Row in equation array. 'content' is array of columns, each column contains tokens.",
  },
  [TokenType.CODE]: {
    contentType: "string",
    description:
      "Code block or inline code. 'display' indicates whether it's inline or block mode.",
    requiredFields: {
      display: { type: "DisplayType", enum: ["inline", "block"] },
    },
  },
  [TokenType.ALGORITHM]: {
    contentType: "BaseToken[]",
    description: "Algorithm container",
  },
  [TokenType.ALGORITHMIC]: {
    contentType: "string",
    description: "Algorithmic pseudocode",
  },

  // References & Links
  [TokenType.CITATION]: {
    contentType: "string[]",
    description:
      "Citation reference. 'content' is an array of citation keys (e.g., ['Smith2020', 'Jones2021']).",
  },
  [TokenType.REF]: {
    contentType: "string[]",
    description:
      "Cross-references -> labels. 'content' is an array of label keys (e.g., ['fig:myfig', 'tab:mytable']), where labels are stored in tokens",
  },
  [TokenType.URL]: {
    contentType: "string",
    description:
      "URL/hyperlink. 'content' is the URL string, optional 'title' field can specify link text as BaseToken[].",
  },
  [TokenType.FOOTNOTE]: {
    contentType: "BaseToken[]",
    description: "Footnote",
  },

  // Bibliography
  [TokenType.BIBLIOGRAPHY]: {
    contentType: "BaseToken[]",
    description: "Bibliography container containing BibItemTokens",
  },
  [TokenType.BIBITEM]: {
    contentType: "string | BaseToken[]",
    description:
      "Bibliography item. 'key' is the citation key, 'format' indicates bibtex or bibitem format.",
    requiredFields: {
      key: { type: "string" },
      format: { type: "BibFormat", enum: ["bibtex", "bibitem"] },
    },
  },

  // Metadata
  [TokenType.MAKETITLE]: {
    contentType: "BaseToken[]",
    description: "Title block container",
  },
  [TokenType.AUTHOR]: {
    contentType: "BaseToken[]",
    description: "Author metadata",
  },
};

/**
 * Helper function to get schema for a token type
 */
export function getTokenSchema(type: TokenType): TokenSchema | undefined {
  return TOKEN_SCHEMA[type];
}

/**
 * Helper function to check if a token type can have children
 * Infers from contentType: if it contains token arrays (BaseToken[], RowToken[], TableCell[][], etc.), it can have children
 */
export function canHaveChildren(type: TokenType): boolean {
  const schema = getTokenSchema(type);
  if (!schema) return false;

  const { contentType } = schema;

  return contentType.includes("[]");
}

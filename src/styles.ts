import { TokenType, DisplayType, IToken, EquationToken } from './types';

export const INLINE_TOKEN_TYPES: TokenType[] = [
  TokenType.TEXT,
  TokenType.CITATION,
  TokenType.REF,
  TokenType.URL,
  TokenType.FOOTNOTE,
  TokenType.COMMAND
] as const;

export const IsInlineToken = (token: IToken): boolean => {
  if (token.type == TokenType.EQUATION) {
    return (token as EquationToken).display != DisplayType.BLOCK;
  }
  return (token as any).display === DisplayType.INLINE || INLINE_TOKEN_TYPES.includes(token.type);
};

export const STYLE_TO_TAILWIND: Record<string, string> = {
  bold: 'font-bold',
  italic: 'italic',
  'small-caps': 'font-variant-small-caps',
  'sans-serif': 'font-sans',
  monospace: 'font-mono',
  normal: 'font-normal',
  // Size mappings
  'xx-small': 'text-xs',
  'x-small': 'text-sm',
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
  'xx-large': 'text-2xl',
  superscript: 'align-super',
  subscript: 'align-sub',
  underline: 'underline',
  'line-through': 'line-through',
  overline: 'overline',
  uppercase: 'uppercase',
  lowercase: 'lowercase'
};

export const STYLE_TO_LATEX: Record<string, string> = {
  bold: 'textbf',
  italic: 'emph',
  'small-caps': 'textsc',
  'sans-serif': 'textsf',
  monospace: 'texttt',
  normal: 'textup',
  'xx-small': 'texttiny',
  'x-small': 'textscriptsize',
  small: 'textsmall',
  medium: 'textnormal',
  large: 'textlarge',
  'xx-large': 'texthuge',
  superscript: 'textsuperscript',
  subscript: 'textsubscript',
  underline: 'underline',
  'double-underline': 'uuline',
  overline: 'overline',
  'line-through': 'sout',
  uppercase: 'uppercase',
  lowercase: 'lowercase'
};

export const wrapStylesToLatex = (text: string, styles: string[]): string => {
  let out = text;
  for (let i = styles.length - 1; i >= 0; i--) {
    const style = styles[i];
    if (STYLE_TO_LATEX[style]) {
      out = `\\${STYLE_TO_LATEX[style]}{${out}}`;
    }
  }
  return out;
};

export const STYLE_TO_MARKDOWN: Record<string, (text: string) => string> = {
  bold: (text: string) => `**${text}**`,
  italic: (text: string) => `*${text}*`,
  monospace: (text: string) => `\`${text}\``,
  underline: (text: string) => `<u>${text}</u>`, // HTML fallback for underline
  'double-underline': (text: string) => `<u style="text-decoration: underline double">${text}</u>`,
  'line-through': (text: string) => `~~${text}~~`,
  superscript: (text: string) => `<sup>${text}</sup>`, // HTML fallback
  subscript: (text: string) => `<sub>${text}</sub>`, // HTML fallback
  // Size and other styles are generally ignored in markdown
  'small-caps': (text: string) => text,
  'sans-serif': (text: string) => text,
  normal: (text: string) => text,
  'xx-small': (text: string) => text,
  'x-small': (text: string) => text,
  small: (text: string) => text,
  medium: (text: string) => text,
  large: (text: string) => text,
  'xx-large': (text: string) => text,
  overline: (text: string) => text,
  uppercase: (text: string) => text.toUpperCase(),
  lowercase: (text: string) => text.toLowerCase()
};

export const wrapStylesToMarkdown = (content: string, styles: string[]): string => {
  if (!styles || styles.length === 0) return content;

  let result = content.trim();
  // Apply styles in a specific order to avoid conflicts
  const orderedStyles = [
    'monospace',
    'bold',
    'italic',
    'underline',
    'double-underline',
    'line-through',
    'superscript',
    'subscript'
  ];

  for (const style of orderedStyles) {
    if (styles.includes(style) && STYLE_TO_MARKDOWN[style]) {
      result = STYLE_TO_MARKDOWN[style](result);
    }
  }

  // Handle case transformations last
  if (styles.includes('uppercase')) {
    result = STYLE_TO_MARKDOWN['uppercase'](result);
  } else if (styles.includes('lowercase')) {
    result = STYLE_TO_MARKDOWN['lowercase'](result);
  }

  return result;
};

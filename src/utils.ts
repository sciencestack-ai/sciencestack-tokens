import { BaseToken, CaptionToken, DisplayType, TokenType } from './types';
import { IsInlineToken } from './styles';

export function convertTokens2String(tokens: (BaseToken | string)[]): string {
  let outStr = '';
  for (let t of tokens) {
    if (!t) continue;
    if (typeof t == 'string') {
      outStr += t;
      continue;
    }
    if (!t.content) continue;
    if (typeof t.content == 'string') {
      outStr += t.content;
      continue;
    }
    let contentStr = '';
    if (Array.isArray(t.content)) {
      contentStr = convertTokens2String(t.content);
    }
    if (t.type == TokenType.EQUATION && (t as any).display != DisplayType.BLOCK) {
      contentStr = '$' + contentStr + '$';
    }
    outStr += contentStr;
  }
  return outStr;
}

export function extractLabelsFromChilds(token: BaseToken, extractLabelFunc: (label: string) => boolean) {
  // extract any fig: labels from direct childs to this figure token
  const labels: string[] = token.labels || [];

  if (token.content) {
    for (let c of token.content) {
      if (typeof c != 'string' && c.labels && Array.isArray(c.labels)) {
        // Iterate through labels in reverse to safely splice
        for (let i = c.labels.length - 1; i >= 0; i--) {
          const label = c.labels[i];
          if (extractLabelFunc(label)) {
            labels.push(label);
            c.labels.splice(i, 1);
          }
        }
      }
    }
  }

  token.labels = labels;

  return labels;
}

const openingPunctuation = ['(', '[', '{'];
const closingPunctuation = ['.', ',', '!', '?', ':', ';', ')', ']', '}'];

export function shouldAddSpace(currentToken: BaseToken, previousToken: BaseToken) {
  if (currentToken?.type != TokenType.TEXT) return false;

  if (IsInlineToken(previousToken)) {
    const content = currentToken.content as string;

    const noSpace = !content.startsWith(' ') && !closingPunctuation.some((mark) => content.startsWith(mark));

    if (noSpace && previousToken?.type == TokenType.TEXT) {
      const prevContent = previousToken.content as string;
      return !prevContent.endsWith(' ') && !openingPunctuation.some((mark) => prevContent.endsWith(mark));
    }

    return noSpace;
  }

  return false;
}

export function addTokenSpacesIfNeeded(tokens: BaseToken[]) {
  for (let i = 1; i < tokens.length; i++) {
    const currentToken = tokens[i];
    const previousToken = tokens[i - 1];
    if (shouldAddSpace(currentToken, previousToken)) {
      currentToken.content = ' ' + currentToken.content;
    }
  }
}

/**
 * Escapes special LaTeX characters in a string to make it safe for LaTeX.
 * Characters like &, %, $, #, _, {, }, ~, ^, and \ are escaped if not already preceded by a backslash.
 *
 * @param text The input text to escape
 * @returns The text with LaTeX special characters properly escaped
 */
export function escapeLatexSpecialChars(text: string): string {
  if (!text) return '';

  // Define special characters that need escaping in LaTeX
  const specialChars = ['&', '%', '#', '_', '{', '}', '~', '^', '\\']; // $

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Check if the current character is a special character
    if (specialChars.includes(char)) {
      // Check if it's already escaped (preceded by a backslash that isn't itself escaped)
      let isEscaped = false;
      if (i > 0) {
        // Count the number of consecutive backslashes before this character
        let backslashCount = 0;
        let j = i - 1;
        while (j >= 0 && text[j] === '\\') {
          backslashCount++;
          j--;
        }
        // If there's an odd number of backslashes, the character is already escaped
        isEscaped = backslashCount % 2 === 1;
      }

      if (!isEscaped) {
        result += '\\' + char; // Escape the character
      } else {
        result += char; // Already escaped, add as is
      }
    } else {
      result += char; // Not a special character, add as is
    }
  }

  return result;
}

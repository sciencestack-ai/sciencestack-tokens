interface Author {
  firstName: string;
  lastName: string;
}

export enum CitationStyle {
  MLA = 'MLA',
  APA = 'APA',
  CHICAGO = 'CHICAGO',
  HOVER = 'HOVER' // Title-first format optimized for hover tooltips
}

export interface ParsedBibTeX {
  authors: Author[] | string;
  title?: string;
  year?: string;
  journal?: string;
  volume?: string;
  additionalFields?: { [key: string]: string };
}

interface CitationOptions {
  forCopy?: boolean;
}

// Helper function to format journal name
function formatJournal(journal: string | undefined, forCopy: boolean): string {
  if (!journal?.trim()) return '';
  return forCopy ? journal.trim() : `_${journal.trim()}_`;
}

// Helper function to format author names
function formatAuthors(authors: Author[] | string, style: 'MLA' | 'APA' | 'CHICAGO' | 'HOVER'): string {
  // If authors is a string, just return it directly
  if (!authors || typeof authors === 'string') {
    return authors;
  }

  switch (style) {
    case 'MLA':
      return formatMLAAuthors(authors);
    case 'APA':
      return formatAPAAuthors(authors);
    case 'CHICAGO':
      return formatChicagoAuthors(authors);
    case 'HOVER':
      return formatHoverAuthors(authors);
  }
}

function formatMLAAuthors(authors: Author[]): string {
  const authorList = authors.map((author, index) => {
    if (index === 0) return `${author.lastName}, ${author.firstName}`;
    return `${author.firstName} ${author.lastName}`;
  });

  return authors.length > 2 ? `${authorList[0]} et al` : authorList.join(' and ');
}

function formatAPAAuthors(authors: Author[]): string {
  const authorList = authors.map((author) => `${author.lastName}, ${author.firstName.charAt(0)}.`);

  return authorList.length > 1
    ? `${authorList.slice(0, -1).join(', ')}, & ${authorList[authorList.length - 1]}`
    : authorList[0];
}

function formatChicagoAuthors(authors: Author[]): string {
  return authors
    .map((author, index) => {
      if (index === 0) return `${author.lastName}, ${author.firstName}`;
      return `${author.firstName} ${author.lastName}`;
    })
    .join(', ');
}

function formatHoverAuthors(authors: Author[]): string {
  // Simplified format for hover tooltips - just first author + et al for readability
  if (authors.length === 0) return '';
  if (authors.length === 1) return authors[0].lastName;
  if (authors.length === 2) return `${authors[0].lastName} & ${authors[1].lastName}`;
  return `${authors[0].lastName} et al.`;
}

export function replaceBibtexKey(bibtex: string, newKey: string): string {
  const keyMatch = bibtex.match(/@\w+\s*\{([^,]+)\s*,/);
  if (keyMatch) {
    return bibtex.replace(keyMatch[1], newKey);
  }
  return bibtex;
}

// Consolidate BibTeX cleaning logic
export function cleanBibtex(bibtex: string): string {
  return bibtex.replace(/\n/g, ' ').replace(/\s+/g, ' ');
}

export function parseBibTeX(bibtex: string): ParsedBibTeX {
  const cleanedBibtex = cleanBibtex(bibtex);

  const extractField = (field: string): string => {
    const match = cleanedBibtex.match(new RegExp(`(?:^|,\\s*)${field}\\s*=\\s*\\{([^}]+)\\}`, 'i'));
    return match ? match[1].replace(/[{}]/g, '') : '';
  };

  const authorMatch = cleanedBibtex.match(/author\s*=\s*\{([^}]+)\}/i);
  const authorsStr = authorMatch ? authorMatch[1] : '';
  const authors = authorsStr.split(/\s+and\s+/).map((author) => {
    if (author.includes(',')) {
      const [lastName, firstName] = author.split(',').map((s) => s.trim());
      return { firstName, lastName };
    } else {
      const parts = author.trim().split(/\s+/);
      return {
        firstName: parts.slice(0, -1).join(' '),
        lastName: parts[parts.length - 1]
      };
    }
  });

  // Convert iterator to array before using for...of
  const fieldMatches = Array.from(cleanedBibtex.matchAll(/,?\s*(\w+)\s*=\s*\{([^}]+)\}/g));
  const additionalFields: { [key: string]: string } = {};

  for (const match of fieldMatches) {
    const [, field, value] = match;
    const fieldName = field.toLowerCase();
    // Skip fields we're already handling specifically
    if (!['title', 'author', 'journal', 'booktitle', 'year', 'volume'].includes(fieldName)) {
      additionalFields[fieldName] = value.replace(/[{}]/g, '');
    }
  }

  return {
    title: extractField('title') || undefined,
    authors,
    journal: extractField('journal') || extractField('booktitle') || undefined,
    year: extractField('year') || undefined,
    volume: extractField('volume') || undefined,
    additionalFields
  };
}

export function formatCitation(parsed: ParsedBibTeX, style: CitationStyle, options: CitationOptions = {}): string {
  const { forCopy = false } = options;
  const formattedAuthors = formatAuthors(parsed.authors, style);
  const formattedJournal = formatJournal(parsed.journal, forCopy);

  const parts: string[] = [];

  switch (style) {
    case 'MLA':
      parts.push(
        `${formattedAuthors}.`,
        parsed.title ? `"${parsed.title}."` : '',
        formattedJournal,
        [parsed.volume?.trim(), parsed.year ? `(${parsed.year})` : ''].filter(Boolean).join(' ')
      );
      break;

    case 'APA':
      parts.push(
        formattedAuthors,
        parsed.year ? `(${parsed.year}).` : '.',
        parsed.title ? `${parsed.title}.` : '',
        [formattedJournal, parsed.volume?.trim()].filter(Boolean).join(', ')
      );
      break;

    case 'CHICAGO':
      parts.push(
        `${formattedAuthors}.`,
        parsed.title ? `"${parsed.title}."` : '',
        [formattedJournal, parsed.volume?.trim(), parsed.year ? `(${parsed.year})` : ''].filter(Boolean).join(' ')
      );
      break;

    case 'HOVER':
      // Title-first format optimized for hover tooltips and quick identification
      if (parsed.title) {
        parts.push(`${parsed.title}. `);
      }

      const authorYear = [formattedAuthors, parsed.year ? `(${parsed.year})` : ''].filter(Boolean).join(' ');
      if (authorYear) {
        parts.push(authorYear);
      }

      if (formattedJournal) {
        parts.push(`${formattedJournal}${parsed.volume ? `, vol. ${parsed.volume}` : ''}`);
      }
      break;
  }

  return parts.filter(Boolean).join(' ');
}

export const toMLA = (parsed: ParsedBibTeX, forCopy = false): string =>
  formatCitation(parsed, CitationStyle.MLA, { forCopy });

export const toAPA = (parsed: ParsedBibTeX, forCopy = false): string =>
  formatCitation(parsed, CitationStyle.APA, { forCopy });

export const toChicago = (parsed: ParsedBibTeX, forCopy = false): string =>
  formatCitation(parsed, CitationStyle.CHICAGO, { forCopy });

export const toHover = (parsed: ParsedBibTeX, forCopy = false): string =>
  formatCitation(parsed, CitationStyle.HOVER, { forCopy });

# @sciencestack-ai/tokens

TypeScript types and runtime schema for ScienceStack AST tokens. Designed for type-safe AST operations and AI agent integration.

## Installation

```bash
npm install @sciencestack-ai/tokens
# or
pnpm add @sciencestack-ai/tokens
```

## Quick Start

```typescript
import {
  TokenType,
  TOKEN_SCHEMA,
  DocumentToken,
  SectionToken,
  canHaveChildren
} from '@sciencestack-ai/tokens';

// Create type-safe tokens
const section: SectionToken = {
  type: TokenType.SECTION,
  title: [{ type: TokenType.TEXT, content: 'Introduction' }],
  level: 1,
  content: [/* ... */]
};

// Use runtime schema for validation and AI operations
const schema = TOKEN_SCHEMA[TokenType.SECTION];
console.log(schema);
// {
//   contentType: "BaseToken[]",
//   description: "Section with hierarchical levels...",
//   requiredFields: {
//     title: { type: "BaseToken[]" },
//     level: { type: "number", range: [1, 5] }
//   }
// }

// Check nesting capabilities
canHaveChildren(TokenType.TEXT);  // false
canHaveChildren(TokenType.SECTION);  // true
```

## Token Schema

The `TOKEN_SCHEMA` provides runtime metadata for all 36 token types, optimized for AI agents and validation:

### Schema Structure

```typescript
interface FieldSchema {
  type: string;
  range?: [number, number];  // Numeric constraints (e.g., [1, 5])
  enum?: string[];           // Valid values (e.g., ["inline", "block"])
}

interface TokenSchema {
  contentType: string;                    // What can nest inside
  description: string;                     // Semantic meaning
  requiredFields?: Record<string, FieldSchema>;  // Critical fields
}
```

### Example: Understanding Token Structure

```typescript
import { TOKEN_SCHEMA, TokenType } from '@sciencestack-ai/tokens';

// Understand what a token accepts
const eqSchema = TOKEN_SCHEMA[TokenType.EQUATION];
console.log(eqSchema.contentType);  // "string | BaseToken[]"
console.log(eqSchema.description);  // "Mathematical equation. 'content' is LaTeX math code..."

// Validate required fields with type info
const codeSchema = TOKEN_SCHEMA[TokenType.CODE];
console.log(codeSchema.requiredFields);
// {
//   display: { type: "DisplayType", enum: ["inline", "block"] }
// }

// Check numeric constraints
const sectionSchema = TOKEN_SCHEMA[TokenType.SECTION];
console.log(sectionSchema.requiredFields?.level);
// { type: "number", range: [1, 5] }
```

### Token Categories

**36 token types** organized by purpose:
- **Document**: Document, Title, Section, Abstract, Appendix
- **Content**: Text, Quote, Group, Command
- **Math**: Equation, EquationArray, Row
- **Code**: Code, Algorithm, Algorithmic
- **Figures/Tables**: Figure, SubFigure, Table, SubTable, Tabular, Caption
- **Graphics**: IncludeGraphics, IncludePDF, Diagram
- **Lists**: List, Item
- **References**: Citation, Ref, URL, Footnote
- **Bibliography**: Bibliography, BibItem
- **Environments**: Environment, MathEnv
- **Metadata**: MakeTitle, Author

## For AI Agents

The schema is designed to help AI understand and manipulate AST structures:

```typescript
// Get all tokens that can have children
const containerTypes = Object.entries(TOKEN_SCHEMA)
  .filter(([_, schema]) => schema.contentType.includes('[]'))
  .map(([type, _]) => type);

// Validate a token has required fields
function validateToken(tokenType: TokenType, data: any): boolean {
  const schema = TOKEN_SCHEMA[tokenType];
  if (!schema.requiredFields) return true;

  return Object.entries(schema.requiredFields).every(([field, fieldSchema]) => {
    if (!data[field]) return false;

    // Check numeric range
    if (fieldSchema.range && typeof data[field] === 'number') {
      const [min, max] = fieldSchema.range;
      return data[field] >= min && data[field] <= max;
    }

    // Check enum values
    if (fieldSchema.enum) {
      return fieldSchema.enum.includes(data[field]);
    }

    return true;
  });
}
```

## TypeScript Types

Full type definitions for all tokens with strict typing:

```typescript
import { DocumentToken, SectionToken, EquationToken } from '@sciencestack-ai/tokens';

// All tokens have type safety
const doc: DocumentToken = {
  type: TokenType.DOCUMENT,
  content: [/* BaseToken[] */]
};

// TypeScript enforces required fields
const section: SectionToken = {
  type: TokenType.SECTION,
  title: [{ type: TokenType.TEXT, content: 'Intro' }],
  level: 2,  // Must be 1-5 (enforced at runtime via schema)
  content: []
};
```

## Utilities

- **Factory**: `TokenNodeFactory` for creating token instances
- **Helpers**: `canHaveChildren()`, `getTokenSchema()`, `processTokenNodes()`
- **Styles**: `STYLE_TO_TAILWIND` mappings
- **Converters**: Citation format converters

## Exporting with Position Spans

Use `toLatexWithSpans()` or `toMarkdownWithSpans()` to export content with position tracking for each node. This enables features like click-to-navigate, highlighting source locations, or mapping rendered output back to AST nodes.

```typescript
import { TokenExporter, TokenNodeFactory } from '@sciencestack-ai/tokens';

const factory = new TokenNodeFactory();
const section = factory.createNode({
  type: "section",
  title: [{ type: "text", content: "Introduction" }],
  content: [
    { type: "text", content: "Hello world " },
    { type: "ref", content: ["fig:1"] },
    { type: "text", content: " end." },
  ],
  level: 1,
});

const { content, spans } = TokenExporter.toLatexWithSpans([section]);

// content: "\section{Introduction}\nHello world \ref{fig:1} end.\n"
// spans: Map<nodeId, { start: number, end: number, type: string }>
```

### Output Structure

```
Content: "\section{Introduction}\nHello world \ref{fig:1} end.\n"

Spans:
  "title-0":   { start: 9,  end: 21, type: "text" }     => "Introduction"
  "content-0": { start: 23, end: 35, type: "text" }     => "Hello world "
  "content-1": { start: 35, end: 46, type: "ref" }      => "\ref{fig:1}"
  "content-2": { start: 46, end: 51, type: "text" }     => " end."
  "<section>": { start: 0,  end: 52, type: "section" }  => (entire section)
```

### Using Spans

```typescript
// Get position of a specific node
const refSpan = spans.get(refNode.id);
console.log(content.substring(refSpan.start, refSpan.end)); // "\ref{fig:1}"

// Filter by type
const textSpans = [...spans].filter(([_, s]) => s.type === "text");

// Find most specific node at position (smallest span containing pos)
function findNodeAtPosition(pos: number): string | undefined {
  let best: { id: string; size: number } | undefined;
  for (const [nodeId, span] of spans) {
    if (pos >= span.start && pos < span.end) {
      const size = span.end - span.start;
      if (!best || size < best.size) {
        best = { id: nodeId, size };
      }
    }
  }
  return best?.id;
}
```

Also available for Markdown:

```typescript
const { content, spans } = TokenExporter.toMarkdownWithSpans(nodes);
// content: "## Introduction\n---\n\nHello world [fig:1] end."
```

## Development

### Testing

The package includes comprehensive test coverage (87 tests):

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.

### Building

```bash
# Build TypeScript
pnpm build

# Watch mode
pnpm dev
```

## License

MIT

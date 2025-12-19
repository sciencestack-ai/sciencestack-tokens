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

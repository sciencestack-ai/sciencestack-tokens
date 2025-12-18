# @sciencestack-ai/tokens

TypeScript types and node implementations for ScienceStack AST tokens.

## Installation

```bash
npm install @sciencestack-ai/tokens
# or
pnpm add @sciencestack-ai/tokens
```

## Usage

```typescript
import {
  TokenType,
  DocumentToken,
  TextToken,
  EquationToken,
  SectionToken,
  // ... and many more
} from '@sciencestack-ai/tokens';

// Use types for type safety
const textToken: TextToken = {
  type: TokenType.TEXT,
  content: 'Hello, world!',
  id: 'text-1'
};
```

## What's Included

### Core Types
- `TokenType` - Enum of all token types
- Token interfaces for all AST nodes (Document, Section, Text, Equation, etc.)
- Display types, list types, and other enums

### Token Node Classes
- `DocumentTokenNode`, `TextTokenNode`, `EquationTokenNode`, etc.
- Full implementations for all token types

### Utilities
- Style mappings (`STYLE_TO_TAILWIND`)
- Token manipulation utilities
- Type guards and helpers

## Token Types

The package includes types for:

- **Document Structure**: Document, Title, Section, Abstract, Appendix
- **Text Content**: Text, Quote, Group
- **Math & Technical**: Equation, EquationArray, Code, Algorithm
- **Figures & Tables**: Figure, SubFigure, Table, Tabular, Caption
- **References**: Citation, Reference, Footnote, URL, Bibliography
- **Lists**: List, ListItem (enumerate, itemize, description)
- **Environments**: Environment, MathEnv
- **Graphics**: IncludeGraphics, IncludePDF, Diagram
- **Metadata**: Author, Affiliation, Keywords

## For SDK Developers

This package is the foundation for the ScienceStack SDK. Use these types to:
- Build type-safe operations
- Validate AST structures
- Create custom token processors
- Integrate with ScienceStack services

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

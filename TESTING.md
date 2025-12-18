# Testing Documentation

## Test Suite Overview

This package includes comprehensive tests covering all major functionality.

### Test Statistics

- **Total Tests**: 87 passing
- **Test Files**: 7
- **Coverage Areas**: Base classes, token nodes, export functions, tree operations, label resolution

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

## Test Structure

### Unit Tests

#### `tests/base/AbstractTokenNode.test.ts` (19 tests)
- Node creation and properties
- Parent-child relationships
- Tree traversal (findById, findByLabel, getRoot, getDepth)
- Sibling navigation
- Leaf node operations
- Inline vs block detection

#### `tests/content/TextTokenNode.test.ts` (9 tests)
- Basic text node functionality
- Export to LaTeX, Markdown, JSON
- Styled text handling (bold, italic, multiple styles)

#### `tests/technical/EquationTokenNode.test.ts` (10 tests)
- Inline vs block equations
- LaTeX export (numbered and unnumbered)
- Markdown export with numbering tags
- Reference text generation
- Anchor ID handling

#### `tests/document/SectionTokenNode.test.ts` (14 tests)
- Section hierarchy (levels 1-3)
- LaTeX export with proper commands (\section, \subsection, etc.)
- Markdown export with heading levels
- Section numbering
- Reference text ("Section X")
- Anchor ID generation

#### `tests/references/CitationTokenNode.test.ts` (10 tests)
- Citation creation and validation
- Multiple citation handling
- LaTeX export (\cite commands)
- Markdown export with bibliography links
- Title/prefix handling

#### `tests/references/ReferenceTokenNode.test.ts` (17 tests)
- **NEW**: Label resolver pattern tests
- Reference creation with single/multiple labels
- LaTeX export (\ref commands)
- Markdown export without resolver (fallback to labels)
- Markdown export WITH resolver (proper reference text)
- Copy content with resolver
- Partial resolution handling
- Math mode references

### Integration Tests

#### `tests/integration/tree-operations.test.ts` (8 tests)
- Complex document tree construction
- Deep nesting and parent-child relationships
- Cross-references using findByLabel
- Label resolver creation from document root
- Token array processing with filters
- Sibling navigation in complex trees
- Predicate-based parent finding

## Key Features Tested

### ✅ Label Resolver Pattern
The test suite includes comprehensive coverage of the new label resolver pattern, which allows decoupled reference resolution:

```typescript
// Without resolver - uses labels directly
const markdown = refNode.getMarkdownContent();
// Result: [fig:example](#fig:example)

// With resolver - resolves to proper text
const resolver = (label) => documentRoot.findByLabel(label);
const markdown = refNode.getMarkdownContent({ labelResolver: resolver });
// Result: [Figure 1](#fig-example)
```

### ✅ Export Formats
All major export formats are tested:
- **LaTeX**: Proper commands and escaping
- **Markdown**: With anchors and references
- **JSON**: Structure preservation
- **Copy**: Human-readable or LaTeX

### ✅ Tree Operations
- Node creation via factory pattern
- Hierarchical relationships
- Deep traversal and search
- Sibling navigation
- Root/leaf identification

## Coverage Exclusions

The following are excluded from coverage as they are configuration or pure types:
- `types.ts` - Type definitions
- `export_types.ts` - Export option types
- `styles.ts` - Style mappings
- `*.config.*` - Configuration files
- `*.d.ts` - Type declaration files

## Test Infrastructure

- **Framework**: Vitest 2.1.8
- **Coverage**: V8 provider
- **Environment**: Node
- **Pool**: Forks (single fork for stability)

## Known Issues

Vitest may show a shutdown error after all tests pass. This is a cosmetic issue with the worker pool termination and does not affect test results. All tests passing indicates success.

## CI/CD Integration

Add these commands to your CI pipeline:

```yaml
- name: Install dependencies
  run: pnpm install

- name: Run tests
  run: pnpm test

- name: Generate coverage
  run: pnpm test:coverage
```

## Future Test Additions

Potential areas for expansion:
- Performance benchmarks for large documents
- Edge case handling for malformed tokens
- More complex table and figure structures
- Bibliography and bibitems
- Algorithm and code blocks
- List structures (enumerate, itemize, description)


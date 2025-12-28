// Export options for content methods

/**
 * Options for getLatexContent() - used for LaTeX export
 * Always returns full content (no partial extraction)
 */

export type BaseExportOptions = {
  /** Resolver for asset paths (images, pdfs, diagrams) */
  assetPathResolver?: (path: string) => string;
  /** Optional resolver to look up token nodes by label for cross-references */
  labelResolver?: (label: string) =>
    | {
        getReferenceText?: () => string | null;
        getAnchorId?: () => string | null;
      }
    | null
    | undefined;
  /** Skip applying text styles (bold, italic, etc.) during export */
  skipStyles?: boolean;
};

export type LatexExportOptions = BaseExportOptions;
export type JSONExportOptions = BaseExportOptions;

export interface MarkdownExportOptions extends BaseExportOptions {
  math?: boolean; // whether in mathmode or not (for checking if we need to wrap in $$)
}

/**
 * Resolves asset path using custom resolver if provided, otherwise returns path as-is.
 *
 * @param path - The asset path (e.g. papers/2304.02643/figs/figure1.png)
 * @param options - Export options containing optional resolver
 * @returns The resolved path
 */
export function resolveAssetPath(
  path: string,
  options?: BaseExportOptions
): string {
  if (!path) return "";
  if (options?.assetPathResolver) {
    return options.assetPathResolver(path);
  }
  return path;
}

/**
 * Options for getCopyContent() - used for raw text extraction with offset support
 * Primarily used for text selection and annotation systems
 */
export interface CopyContentOptions extends BaseExportOptions {
  /** Starting character offset for partial content extraction */
  startOffset?: number;
  /** Ending character offset for partial content extraction */
  endOffset?: number;
  /** Don't include children by default if we are copying already flattened wyiswyg child content e.g. textnodes */
  includeChildren?: boolean;
}

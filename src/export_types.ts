// Export options for content methods
/**
 * Options for getCopyContent() - used for raw text extraction with offset support
 * Primarily used for text selection and annotation systems
 */
export type CopyContentOptions = {
  /** Starting character offset for partial content extraction */
  startOffset?: number;
  /** Ending character offset for partial content extraction */
  endOffset?: number;
  /** Don't include children by default if we are copying already flattened wyiswyg child content e.g. textnodes */
  includeChildren?: boolean;
  /** Optional resolver to look up token nodes by label for cross-references */
  labelResolver?: (label: string) => { getReferenceText?: () => string | null; getAnchorId?: () => string | null } | null | undefined;
};

/**
 * Options for getLatexContent() - used for LaTeX export
 * Always returns full content (no partial extraction)
 */

export type BaseExportOptions = {
  paperId?: string; // used for relative paths
  assetsFolderName?: string; // folder name to prefix asset paths (e.g., 'assets')
};

export type LatexExportOptions = BaseExportOptions;

export interface MarkdownExportOptions extends BaseExportOptions {
  math?: boolean; // whether in mathmode or not (for checking if we need to wrap in $$)
  /** Optional resolver to look up token nodes by label for cross-references */
  labelResolver?: (label: string) => { getReferenceText?: () => string | null; getAnchorId?: () => string | null } | null | undefined;
}

export type JSONExportOptions = BaseExportOptions;

/**
 * Converts asset path to relative path by removing the paperId prefix.
 * Optionally adds a prefix folder for the assets.
 *
 * @param path - The asset path (e.g. papers/2304.02643/figs/figure1.png)
 * @param paperId - The paper ID to remove from the path
 * @param assetsFolderName - Optional folder name to prefix (e.g., 'assets' -> 'assets/figs/figure1.png')
 * @returns The relative path (e.g. assets/figs/figure1.png or figs/figure1.png)
 */
export function getAssetRelativePath(path: string, paperId?: string, assetsFolderName?: string): string {
  if (!paperId) {
    return path;
  }

  const parts = path.split('/');
  let relativePath = path;

  // Remove paperId prefix if found
  if (parts.length > 1 && parts.some((part) => part === paperId)) {
    const paperIdIndex = parts.indexOf(paperId);
    relativePath = parts.slice(paperIdIndex + 1).join('/');
  }

  // Add assets folder prefix if specified
  if (assetsFolderName) {
    relativePath = `${assetsFolderName}/${relativePath}`;
  }

  return relativePath;
}

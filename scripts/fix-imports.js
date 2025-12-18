import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function getAllJsFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getAllJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function fixImportsInFile(filePath) {
  let content = await readFile(filePath, 'utf8');
  let modified = false;
  
  // Fix relative imports without .js extension
  // Match: from "./something" or from "../something"
  const relativeImportRegex = /from\s+(['"])(\.\.?\/[^'"]*?)(?<!\.js)\1/g;
  
  content = content.replace(relativeImportRegex, (match, quote, path) => {
    modified = true;
    // If the path ends with just '/' (directory import), add 'index.js'
    if (path.endsWith('/')) {
      return `from ${quote}${path}index.js${quote}`;
    }
    // Otherwise, just add '.js'
    return `from ${quote}${path}.js${quote}`;
  });
  
  if (modified) {
    await writeFile(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

async function main() {
  const distDir = join(process.cwd(), 'dist');
  const jsFiles = await getAllJsFiles(distDir);
  
  let fixedCount = 0;
  for (const file of jsFiles) {
    const wasFixed = await fixImportsInFile(file);
    if (wasFixed) {
      fixedCount++;
    }
  }
  
  console.log(`Fixed ${fixedCount} files`);
}

main().catch(console.error);


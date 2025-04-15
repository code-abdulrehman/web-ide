import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Apply patches to content
 * @param {string} content - Original content
 * @param {Array} patches - Array of patch operations
 * @returns {string} - Updated content
 */
export const applyPatches = (content, patches) => {
  // Convert content to lines for easier manipulation
  const lines = content.split('\n');
  
  // Sort patches to apply them in the correct order (from bottom to top)
  const sortedPatches = [...patches].sort((a, b) => {
    // Extract line numbers from paths
    const lineA = parseInt(a.path.split('/')[2] || '0');
    const lineB = parseInt(b.path.split('/')[2] || '0');
    return lineB - lineA; // Apply from bottom to top to avoid line number shifting
  });
  
  // Process each patch operation
  for (const patch of sortedPatches) {
    const { op, path: patchPath, value } = patch;
    
    // Extract line number from patch path (e.g., "/lines/5" -> 5)
    const matches = patchPath.match(/\/lines\/(\d+)/);
    if (!matches) continue;
    
    const lineIndex = parseInt(matches[1]);
    
    switch (op) {
      case 'add':
        // Insert new line(s)
        const newLines = value.split('\n');
        lines.splice(lineIndex, 0, ...newLines);
        break;
        
      case 'remove':
        // Remove line(s)
        const count = typeof value === 'number' ? value : 1;
        lines.splice(lineIndex, count);
        break;
        
      case 'replace':
        // Replace line with new content
        lines[lineIndex] = value;
        break;
        
      case 'update':
        // Update part of a line
        if (patch.range && lines[lineIndex]) {
          const { start, end } = patch.range;
          const line = lines[lineIndex];
          lines[lineIndex] = line.substring(0, start) + value + line.substring(end);
        }
        break;
    }
  }
  
  // Join lines back into content
  return lines.join('\n');
};

/**
 * Ensure a directory exists
 * @param {string} dirPath - Directory path
 */
export const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Generate patches between two versions of content
 * @param {string} oldContent - Original content
 * @param {string} newContent - Updated content
 * @returns {Array} - Array of patch operations
 */
export const generatePatches = (oldContent, newContent) => {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const patches = [];
  
  // Simple line-by-line diff algorithm
  // In a real implementation, you'd use a more sophisticated diff algorithm
  let i = 0;
  let j = 0;
  
  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      // All remaining lines in newLines are additions
      const addedLines = newLines.slice(j).join('\n');
      patches.push({
        op: 'add',
        path: `/lines/${i}`,
        value: addedLines
      });
      break;
    } else if (j >= newLines.length) {
      // All remaining lines in oldLines are removals
      patches.push({
        op: 'remove',
        path: `/lines/${i}`,
        value: oldLines.length - i
      });
      break;
    } else if (oldLines[i] !== newLines[j]) {
      // Lines are different, check if it's a replacement or insertion/deletion
      // For simplicity, we'll treat it as a replacement
      patches.push({
        op: 'replace',
        path: `/lines/${i}`,
        value: newLines[j]
      });
    }
    
    i++;
    j++;
  }
  
  return patches;
};

export default {
  applyPatches,
  ensureDirectoryExists,
  generatePatches
}; 
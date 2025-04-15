import fs from 'fs';
import path from 'path';
import { CodeSnippet } from './index.js';

// Base directory for storing code files
const CODE_STORE_DIR = path.join(process.cwd(), 'code-store', 'code');

/**
 * Service to handle saving code from socket connections
 */
export class CodePersistenceService {
  /**
   * Save code to both filesystem and database
   * @param {string} filePath - Path to save the file
   * @param {string} content - File content
   * @param {string} language - Programming language
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - Result of the save operation
   */
  static async saveCode(filePath, content, language, metadata = {}) {
    try {
      const result = {
        filesystem: null,
        database: null,
        errors: []
      };

      // Save to filesystem
      try {
        // For absolute paths outside the code store, store a copy inside our code directory too
        const relativePath = this.getRelativePath(filePath);
        const storeFilePath = path.join(CODE_STORE_DIR, relativePath);
        
        // Create directory if it doesn't exist
        const dir = path.dirname(storeFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write to the original file location
        await fs.promises.writeFile(filePath, content, 'utf8');
        
        // Also save a copy to our code store
        await fs.promises.writeFile(storeFilePath, content, 'utf8');
        
        result.filesystem = {
          originalPath: filePath,
          storePath: storeFilePath
        };
      } catch (error) {
        console.error(`Error saving to filesystem: ${error.message}`);
        result.errors.push({ type: 'filesystem', error: error.message });
      }

      // Save to database if MongoDB is connected
      try {
        if (global.mongoose && global.mongoose.connection.readyState === 1) {
          const fileName = path.basename(filePath);
          const snippet = await CodeSnippet.findOneAndUpdate(
            { title: fileName, 'metadata.path': filePath },
            {
              content,
              language: language || this.detectLanguage(filePath),
              metadata: {
                ...metadata,
                path: filePath,
                lastSaved: new Date()
              }
            },
            { upsert: true, new: true }
          );
          
          result.database = {
            id: snippet._id,
            title: snippet.title
          };
        } else {
          console.log('MongoDB not connected, skipping database save');
        }
      } catch (error) {
        console.error(`Error saving to database: ${error.message}`);
        result.errors.push({ type: 'database', error: error.message });
      }

      return result;
    } catch (error) {
      console.error(`Unhandled error in saveCode: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load code from filesystem or database
   * @param {string} filePath - Path to the file
   * @returns {Promise<string>} - File content
   */
  static async loadCode(filePath) {
    try {
      // First try to load from filesystem
      if (fs.existsSync(filePath)) {
        return await fs.promises.readFile(filePath, 'utf8');
      }
      
      // If file doesn't exist, check if we have a copy in our store
      const relativePath = this.getRelativePath(filePath);
      const storeFilePath = path.join(CODE_STORE_DIR, relativePath);
      
      if (fs.existsSync(storeFilePath)) {
        return await fs.promises.readFile(storeFilePath, 'utf8');
      }
      
      // If still not found, try database
      if (global.mongoose && global.mongoose.connection.readyState === 1) {
        const fileName = path.basename(filePath);
        const snippet = await CodeSnippet.findOne({ 
          'metadata.path': filePath 
        });
        
        if (snippet) {
          return snippet.content;
        }
      }
      
      throw new Error(`File not found: ${filePath}`);
    } catch (error) {
      console.error(`Error loading code: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect language from file extension
   * @param {string} filePath - Path to the file
   * @returns {string} - Language
   */
  static detectLanguage(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const extensionMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.html': 'html',
      '.css': 'css',
      '.json': 'json',
      '.md': 'markdown',
      '.txt': 'plaintext',
      '.cpp': 'cpp',
      '.c': 'c',
      '.java': 'java',
      '.rb': 'ruby',
      '.php': 'php',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.sh': 'shell',
    };
    
    return extensionMap[extension] || 'plaintext';
  }

  /**
   * Get relative path from absolute path
   * @param {string} filePath - Absolute path
   * @returns {string} - Relative path
   */
  static getRelativePath(filePath) {
    // Extract project name from path
    const parts = filePath.split('/');
    const projectIndex = parts.findIndex(part => 
      part === 'projects' || 
      part === 'workspace' || 
      part === 'user project'
    );
    
    if (projectIndex >= 0) {
      // Return path starting from project name
      return parts.slice(projectIndex).join('/');
    }
    
    // Default fallback - create a user project directory with the basename
    return `user project/${path.basename(filePath)}`;
  }
}

export default CodePersistenceService; 
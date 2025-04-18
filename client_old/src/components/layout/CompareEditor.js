import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useSelector, useDispatch } from 'react-redux';
import { FaTimes, FaExchangeAlt, FaCode } from 'react-icons/fa';
import { readFile } from '../../store/slices/fileSystemSlice';

// Custom error boundary for containing editor errors
class EditorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Editor error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <div className="text-red-500 text-xl mb-4">😕 Something went wrong with the editor</div>
          <div className="mb-4">
            {this.state.error && this.state.error.message}
          </div>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
          <button 
            onClick={this.props.onClose}
            className="px-4 py-2 mt-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close Comparison
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const CompareEditor = ({ theme, fontSize = 14, files, onClose }) => {
  const dispatch = useDispatch();
  const fileSystem = useSelector(state => state.fileSystem);
  const { openFiles } = fileSystem || {};
  
  const [originalFile, setOriginalFile] = useState(files?.original || null);
  const [modifiedFile, setModifiedFile] = useState(files?.modified || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const editorRef = useRef(null);
  
  // Helper to determine language from filename
  const getLanguageFromFileName = (fileName) => {
    if (!fileName) return 'plaintext';
    try {
      if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'javascript';
      if (fileName.endsWith('.css')) return 'css';
      if (fileName.endsWith('.html')) return 'html';
      if (fileName.endsWith('.json')) return 'json';
      if (fileName.endsWith('.md')) return 'markdown';
      if (fileName.endsWith('.ts')) return 'typescript';
      if (fileName.endsWith('.tsx')) return 'typescript';
      return 'plaintext';
    } catch (e) {
      console.error("Error determining language:", e);
      return 'plaintext';
    }
  };
  
  // Get Monaco Editor options for theme
  const getEditorOptions = () => {
    return {
      fontSize: fontSize || 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 12,
        horizontalScrollbarSize: 12
      },
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      tabSize: 2,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontLigatures: true,
      renderSideBySide: true, // Show diff side-by-side (true) or inline (false)
      originalEditable: false, // Make original editor read-only
    };
  };
  
  // Determine the theme to use for Monaco Editor
  const getEditorTheme = () => {
    try {
      // Check if theme is an object with properties
      if (typeof theme === 'object') {
        // Look for a type property or infer from background color
        if (theme.type === 'light' || 
            (theme.background && theme.background.includes('light'))) {
          return 'vs';
        }
        if (theme.type === 'high-contrast' || 
            (theme.background && theme.background.includes('high-contrast'))) {
          return 'hc-black';
        }
        return 'vs-dark'; // Default to dark theme
      }
      
      // Legacy theme handling (if theme is a string)
      if (theme === 'light') return 'vs';
      if (theme === 'highContrast') return 'hc-black';
      return 'vs-dark'; // Default to dark theme
    } catch (e) {
      console.error("Error determining theme:", e);
      return 'vs-dark'; // Fallback to dark theme
    }
  };
  
  // Log data for debugging
  useEffect(() => {
    try {
      console.log('CompareEditor - Files to compare:', {
        original: files?.original || 'Not provided',
        modified: files?.modified || 'Not provided',
        openFiles: openFiles ? Object.keys(openFiles) : 'No open files'
      });
    } catch (e) {
      console.error("Error logging file data:", e);
    }
  }, [files, openFiles]);
  
  // Effect to update originalFile and modifiedFile when files prop changes
  useEffect(() => {
    try {
      if (files) {
        if (files.original) {
          setOriginalFile(files.original);
        }
        if (files.modified) {
          setModifiedFile(files.modified);
        }
        console.log('Files updated in CompareEditor:', files);
      }
    } catch (e) {
      console.error("Error updating files:", e);
      setError("Error setting up comparison files");
    }
  }, [files]);
  
  // Get content for a file path - wrapped in useCallback
  const getFileContent = useCallback((filePath) => {
    try {
      if (!filePath) {
        console.warn('No file path provided to getFileContent');
        return '// No file selected';
      }
      
      console.log(`Trying to get content for: ${filePath}`);
      
      if (!openFiles) {
        console.warn('openFiles is undefined or null');
        return '// Error: No open files available';
      }
      
      console.log('Available open files:', Object.keys(openFiles || {}));
      
      if (!openFiles[filePath]) {
        console.warn(`File not found in open files: ${filePath}`);
        
        // Try to fetch the file content
        try {
          dispatch(readFile(filePath))
            .unwrap()
            .then(() => {
              console.log(`File ${filePath} was read successfully`);
              // Force refresh to show the newly loaded content
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 300);
            })
            .catch(error => {
              console.error(`Failed to read file ${filePath}:`, error);
              setError(`Failed to read file: ${filePath}`);
            });
        } catch (e) {
          console.error("Error dispatching readFile:", e);
        }
        
        return `// Loading ${filePath.split('/').pop() || 'file'}...\n// Please wait`;
      }
      
      const content = openFiles[filePath]?.content;
      if (content === undefined || content === null) {
        console.warn(`Content is ${content === undefined ? 'undefined' : 'null'} for file: ${filePath}`);
        return `// No content available for ${filePath.split('/').pop() || 'file'}`;
      }
      
      if (typeof content === 'object' && content !== null) {
        console.log(`Converting object content to string for ${filePath}`);
        return JSON.stringify(content, null, 2);
      }
      
      console.log(`Successfully retrieved content for ${filePath}`);
      return content || '';
    } catch (e) {
      console.error("Error in getFileContent:", e);
      return `// Error loading file: ${e.message || 'Unknown error'}`;
    }
  }, [openFiles, dispatch]);
  
  // Effect to force refresh when openFiles changes
  useEffect(() => {
    try {
      // Only run if we have both files selected
      if (originalFile && modifiedFile) {
        const originalContent = getFileContent(originalFile);
        const modifiedContent = getFileContent(modifiedFile);
        
        console.log(`Content loaded - Original (${originalFile}): ${originalContent.length} chars, Modified (${modifiedFile}): ${modifiedContent.length} chars`);
        
        // Force a re-render of the editor by briefly setting loading state
        setIsLoading(true);
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 300);
        
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error("Error forcing refresh:", e);
    }
  }, [openFiles, originalFile, modifiedFile, getFileContent]);
  
  // Swap original and modified files
  const handleSwapFiles = () => {
    try {
      const temp = originalFile;
      setOriginalFile(modifiedFile);
      setModifiedFile(temp);
    } catch (e) {
      console.error("Error swapping files:", e);
    }
  };
  
  // Get editor reference when mounted
  const handleEditorDidMount = (editor) => {
    try {
      editorRef.current = editor;
      setIsLoading(false);
    } catch (e) {
      console.error("Error during editor mount:", e);
    }
  };
  
  // Handle loading state
  useEffect(() => {
    try {
      setIsLoading(true);
    } catch (e) {
      console.error("Error setting loading state:", e);
    }
  }, [originalFile, modifiedFile]);
  
  // Handle errors
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${theme?.editorBackground || 'bg-gray-800'}`}>
        <div className="text-red-500 text-xl mb-4">Error</div>
        <div className="mb-4">{error}</div>
        <button 
          onClick={() => {
            setError(null);
            onClose();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col h-full ${theme?.editorBackground || 'bg-gray-800'}`}>
      {/* Header with file information */}
      <div className={`flex items-center justify-between ${theme?.tabBarBackground || 'bg-gray-700'} p-2 border-b ${theme?.tabBorder || 'border-gray-600'}`}>
        <div className="flex items-center space-x-4">
          <div className={`px-2 py-1 rounded ${theme?.secondaryButtonBackground || 'bg-gray-600'}`}>
            <span className={theme?.foreground || 'text-white'}>
              {originalFile ? originalFile.split('/').pop() : 'Original File'}
            </span>
          </div>
          
          <button 
            onClick={handleSwapFiles}
            className={`p-1 rounded hover:${theme?.buttonHoverBackground || 'bg-gray-500'}`}
            title="Swap files"
          >
            <FaExchangeAlt className={theme?.iconColor || 'text-gray-300'} />
          </button>
          
          <div className={`px-2 py-1 rounded ${theme?.secondaryButtonBackground || 'bg-gray-600'}`}>
            <span className={theme?.foreground || 'text-white'}>
              {modifiedFile ? modifiedFile.split('/').pop() : 'Modified File'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={onClose}
            className={`p-1 rounded hover:${theme?.buttonHoverBackground || 'bg-gray-500'}`}
            title="Close diff view"
          >
            <FaTimes className={theme?.iconColor || 'text-gray-300'} />
          </button>
        </div>
      </div>
      
      {/* Diff Editor */}
      <div className="flex-grow">
        {isLoading && (
          <div className={`flex items-center justify-center h-full ${theme?.editorBackground || 'bg-gray-800'}`}>
            <div className={`${theme?.foreground || 'text-white'} text-sm`}>Loading...</div>
          </div>
        )}
        
        <EditorErrorBoundary onClose={onClose}>
          <DiffEditor
            height="100%"
            theme={getEditorTheme()}
            original={getFileContent(originalFile)}
            modified={getFileContent(modifiedFile)}
            language={getLanguageFromFileName(originalFile?.split?.('/').pop() || modifiedFile?.split?.('/').pop())}
            options={getEditorOptions()}
            onMount={handleEditorDidMount}
          />
        </EditorErrorBoundary>
      </div>
    </div>
  );
};

export default CompareEditor; 
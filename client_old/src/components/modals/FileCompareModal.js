import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaTimes, FaFileAlt, FaExchangeAlt } from 'react-icons/fa';

const FileCompareModal = ({ theme, onClose, onCompare }) => {
  const fileSystem = useSelector(state => state.fileSystem);
  const { fileTree, openFiles } = fileSystem;
  
  const [flattenedFiles, setFlattenedFiles] = useState([]);
  const [originalFile, setOriginalFile] = useState('');
  const [modifiedFile, setModifiedFile] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);

  // Log redux state for debugging
  useEffect(() => {
    console.log('FileCompareModal - Redux State:', {
      fileSystem,
      fileTree: fileTree || 'Not available',
      openFiles: openFiles || 'Not available',
      flattenedFiles
    });
  }, [fileSystem, fileTree, openFiles, flattenedFiles]);

  // Flatten the file tree to get all files
  useEffect(() => {
    try {
      const files = [];
      
      const traverseTree = (node, parent = '') => {
        if (!node || typeof node !== 'object') {
          console.warn('Invalid node encountered:', node);
          return;
        }

        // Safely get node name
        const nodeName = node.name || '';
        const fullPath = parent ? `${parent}/${nodeName}` : nodeName;
        
        // Check if it's a file (not a folder)
        if (node.isFolder === false) {
          files.push({
            path: fullPath,
            name: nodeName
          });
        }
        
        // Safe access to children
        if (node.children && typeof node.children === 'object') {
          Object.values(node.children).forEach(child => {
            if (child) traverseTree(child, fullPath);
          });
        }
      };
      
      // Check if fileTree is an array or object and handle it appropriately
      if (fileTree) {
        console.log('FileTree type:', Array.isArray(fileTree) ? 'Array' : typeof fileTree);
        
        if (Array.isArray(fileTree)) {
          fileTree.forEach(node => {
            if (node) traverseTree(node);
          });
        } else if (typeof fileTree === 'object') {
          // If it's an object with children property
          if (fileTree.children && typeof fileTree.children === 'object') {
            Object.values(fileTree.children).forEach(node => {
              if (node) traverseTree(node);
            });
          } else {
            // If it's just a plain object of nodes
            Object.values(fileTree).forEach(node => {
              if (node) traverseTree(node);
            });
          }
        }
      } else {
        console.warn('FileTree is undefined or null');
      }
      
      // If we didn't get any files from the fileTree, try to get open files
      if (files.length === 0 && openFiles) {
        console.log('No files found in fileTree, checking openFiles', openFiles);
        
        if (openFiles && typeof openFiles === 'object') {
          Object.keys(openFiles).forEach(filePath => {
            if (filePath) {
              const name = filePath.split('/').pop() || 'Unknown';
              files.push({
                path: filePath,
                name: name
              });
            }
          });
        }
      }
      
      console.log('Found files:', files.length);
      setFlattenedFiles(files);
      setFilteredFiles(files);
    } catch (error) {
      console.error('Error in file tree processing:', error);
      // Set empty arrays to prevent null reference errors
      setFlattenedFiles([]);
      setFilteredFiles([]);
    }
  }, [fileTree, openFiles]);

  // Filter files based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredFiles(flattenedFiles);
      return;
    }
    
    const filtered = flattenedFiles.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredFiles(filtered);
  }, [searchTerm, flattenedFiles]);

  // Get file extension from path
  const getFileExtension = (filePath) => {
    const parts = filePath.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  };

  // Handle file selection
  const handleSelectFile = (filePath, isOriginal) => {
    try {
      if (!filePath) {
        console.warn("Attempted to select a file with empty path");
        return;
      }
      
      if (isOriginal) {
        setOriginalFile(filePath);
      } else {
        setModifiedFile(filePath);
      }
    } catch (error) {
      console.error("Error selecting file:", error);
    }
  };

  // Swap the files
  const handleSwapFiles = () => {
    try {
      if (!originalFile && !modifiedFile) {
        return;
      }
      
      const temp = originalFile;
      setOriginalFile(modifiedFile);
      setModifiedFile(temp);
    } catch (error) {
      console.error("Error swapping files:", error);
    }
  };

  // Check if files are ready to compare
  const canCompare = originalFile && modifiedFile && originalFile !== modifiedFile;

  // Handle the comparison
  const handleCompare = () => {
    try {
      if (!canCompare) {
        alert("Please select two different files to compare");
        return;
      }
      
      onCompare({
        original: originalFile,
        modified: modifiedFile
      });
      onClose();
    } catch (error) {
      console.error("Error handling comparison:", error);
    }
  };

  // Try to auto-select similar files
  useEffect(() => {
    if (originalFile && !modifiedFile) {
      // Try to find similar files
      const originalName = originalFile.split('/').pop();
      const originalExt = getFileExtension(originalName);
      const possibleMatches = flattenedFiles.filter(file => {
        const fileName = file.path.split('/').pop();
        return fileName !== originalName && 
               fileName.includes(originalName.replace(`.${originalExt}`, '')) && 
               getFileExtension(fileName) === originalExt;
      });
      
      if (possibleMatches.length > 0) {
        // Sort by name similarity
        possibleMatches.sort((a, b) => {
          const aName = a.path.split('/').pop();
          const bName = b.path.split('/').pop();
          const aDistance = levenshteinDistance(originalName, aName);
          const bDistance = levenshteinDistance(originalName, bName);
          return aDistance - bDistance;
        });
        
        setModifiedFile(possibleMatches[0].path);
      }
    }
  }, [originalFile, flattenedFiles]);

  // Simple implementation of Levenshtein distance for string similarity
  const levenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    
    // Initialize the matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Calculate distances
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={`w-full max-w-6xl max-h-[90vh] ${theme.background} rounded shadow-lg flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
          <h2 className={`text-xl font-medium ${theme.foreground}`}>Compare Files</h2>
          <button 
            onClick={onClose}
            className={`p-1 rounded hover:${theme.buttonHoverBackground}`}
          >
            <FaTimes className={theme.iconColor} />
          </button>
        </div>
        
        {flattenedFiles.length === 0 ? (
          // No files found
          <div className={`p-8 text-center ${theme.foreground}`}>
            <div className="text-3xl mb-4">📁</div>
            <h3 className="text-lg font-medium mb-2">No Files Available</h3>
            <p className={`${theme.descriptionForeground} mb-6`}>
              No files were found to compare. Please make sure you have opened some files first.
            </p>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded ${theme.buttonBackground} ${theme.buttonForeground}`}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="p-4">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3 py-2 rounded border ${theme.inputBackground} ${theme.foreground} ${theme.inputBorder}`}
              />
            </div>
            
            {/* File Selection Area */}
            <div className="flex flex-col md:flex-row p-4 gap-4 flex-grow">
              {/* Original File */}
              <div className={`flex-1 border ${theme.border} rounded flex flex-col`}>
                <div className={`p-2 ${theme.secondaryButtonBackground} font-medium ${theme.foreground}`}>
                  Original File
                </div>
                <div className={`flex-grow overflow-auto p-2 ${theme.inputBackground}`}>
                  {filteredFiles.length > 0 ? (
                    <ul className="space-y-1">
                      {filteredFiles.map((file) => (
                        <li 
                          key={file.path}
                          className={`flex items-center p-2 rounded cursor-pointer ${
                            originalFile === file.path 
                              ? `${theme.listActiveBackground} ${theme.listActiveForeground}` 
                              : `hover:${theme.listHoverBackground} ${theme.foreground}`
                          }`}
                          onClick={() => handleSelectFile(file.path, true)}
                        >
                          <FaFileAlt className="mr-2" size={14} />
                          <span className="truncate">{file.path}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={`flex items-center justify-center h-full ${theme.descriptionForeground}`}>
                      No files found
                    </div>
                  )}
                </div>
              </div>
              
              {/* Switch Button */}
              <div className="flex items-center justify-center">
                <button 
                  onClick={handleSwapFiles}
                  disabled={!originalFile || !modifiedFile}
                  className={`p-2 rounded ${
                    !originalFile || !modifiedFile 
                      ? 'opacity-50 cursor-not-allowed' 
                      : `hover:${theme.buttonHoverBackground}`
                  }`}
                  title="Swap files"
                >
                  <FaExchangeAlt className={theme.iconColor} size={20} />
                </button>
              </div>
              
              {/* Modified File */}
              <div className={`flex-1 border ${theme.border} rounded flex flex-col`}>
                <div className={`p-2 ${theme.secondaryButtonBackground} font-medium ${theme.foreground}`}>
                  Modified File
                </div>
                <div className={`flex-grow overflow-auto p-2 ${theme.inputBackground}`}>
                  {filteredFiles.length > 0 ? (
                    <ul className="space-y-1">
                      {filteredFiles.map((file) => (
                        <li 
                          key={file.path}
                          className={`flex items-center p-2 rounded cursor-pointer ${
                            modifiedFile === file.path 
                              ? `${theme.listActiveBackground} ${theme.listActiveForeground}` 
                              : `hover:${theme.listHoverBackground} ${theme.foreground}`
                          }`}
                          onClick={() => handleSelectFile(file.path, false)}
                        >
                          <FaFileAlt className="mr-2" size={14} />
                          <span className="truncate">{file.path}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={`flex items-center justify-center h-full ${theme.descriptionForeground}`}>
                      No files found
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer with actions */}
            <div className={`p-4 border-t ${theme.border} flex justify-end space-x-2`}>
              <button 
                onClick={onClose}
                className={`px-4 py-2 rounded ${theme.secondaryButtonBackground} ${theme.secondaryButtonForeground} hover:${theme.secondaryButtonHoverBackground}`}
              >
                Cancel
              </button>
              <button 
                onClick={handleCompare}
                disabled={!canCompare}
                className={`px-4 py-2 rounded ${
                  canCompare 
                    ? `${theme.buttonBackground} ${theme.buttonForeground} hover:${theme.buttonHoverBackground}` 
                    : `opacity-50 cursor-not-allowed ${theme.secondaryButtonBackground} ${theme.secondaryButtonForeground}`
                }`}
              >
                Compare
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FileCompareModal; 
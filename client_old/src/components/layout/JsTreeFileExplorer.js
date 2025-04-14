import React, { useState } from 'react';
import { 
  FaFolder, 
  FaFolderOpen,
  FaFile, 
  FaJs, 
  FaHtml5,
  FaCss3,
  FaMarkdown,
  FaFileAlt,
  FaCode,
  FaChevronDown,
  FaChevronRight
} from 'react-icons/fa';

const FileTreeNode = ({ node, onFileSelect, currentFile, level = 0, theme }) => {
  const [isOpen, setIsOpen] = useState(node.isOpen || false);
  const isFolder = node.isFolder;
  const isActive = currentFile === node.path;
  const hasChildren = isFolder && node.children && Object.keys(node.children).length > 0;
  
  // Get the appropriate icon for file type
  const getFileIcon = () => {
    if (isFolder) {
      return isOpen ? <FaFolderOpen className="text-yellow-400" size={14} /> : <FaFolder className="text-yellow-400" size={14} />;
    }
    
    const fileName = node.name.toLowerCase();
    
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) {
      return <FaJs className="text-yellow-400" size={12} />;
    } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      return <FaHtml5 className="text-orange-500" size={12} />;
    } else if (fileName.endsWith('.css')) {
      return <FaCss3 className="text-blue-500" size={12} />;
    } else if (fileName.endsWith('.md')) {
      return <FaMarkdown className={theme.descriptionForeground} size={12} />;
    } else if (fileName.endsWith('.json')) {
      return <FaFileAlt className="text-yellow-300" size={12} />;
    } else if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) {
      return <FaCode className="text-blue-400" size={12} />;
    }
    
    return <FaFile className={theme.iconColor} size={12} />;
  };
  
  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(node);
    }
  };
  
  const renderChildren = () => {
    if (!hasChildren || !isOpen) return null;
    
    return (
      <div className="pl-4">
        {Object.values(node.children).map((childNode) => (
          <FileTreeNode
            key={childNode.path || childNode.id}
            node={childNode}
            onFileSelect={onFileSelect}
            currentFile={currentFile}
            level={level + 1}
            theme={theme}
          />
        ))}
      </div>
    );
  };
  
  return (
    <div>
      <div 
        className={`flex items-center py-1 px-2 cursor-pointer text-sm rounded-sm hover:${theme.listHoverBackground} ${isActive ? theme.listActiveBackground : ''}`}
        onClick={handleClick}
        style={{ paddingLeft: `${level * 8}px` }}
      >
        {hasChildren && (
          <span className="mr-1">
            {isOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
          </span>
        )}
        <span className="mr-2">{getFileIcon()}</span>
        <span className="truncate">{node.name}</span>
      </div>
      {renderChildren()}
    </div>
  );
};

const JsTreeFileExplorer = ({ fileData, onFileSelect, theme, currentFile }) => {
  if (!fileData || fileData.length === 0) {
    return <div className="p-4 text-center">No files found</div>;
  }
  
  return (
    <div className="file-explorer w-full">
      {fileData.map((rootNode) => (
        <FileTreeNode
          key={rootNode.path || rootNode.id}
          node={rootNode}
          onFileSelect={onFileSelect}
          currentFile={currentFile}
          theme={theme}
        />
      ))}
    </div>
  );
};

export default JsTreeFileExplorer; 
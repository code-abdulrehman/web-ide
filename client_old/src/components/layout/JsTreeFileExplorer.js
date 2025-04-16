import React, { useState, useEffect, useRef } from 'react';
import path from 'path-browserify';
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
  FaFileCode,
  FaFileImage,
  FaPython,
  FaFileAudio,
  FaFileVideo,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFilePdf,
  FaGitAlt,
  FaChevronDown,
  FaChevronRight,
  FaTimes,
  FaEdit,
  FaTrash,
  FaPlus
} from 'react-icons/fa';
import { GiSettingsKnobs } from "react-icons/gi"; // .env
import { TbFileTypeJsx, TbFileTypeTsx } from "react-icons/tb"; //jsx
import { VscNewFile, VscNewFolder } from 'react-icons/vsc';
import { useDispatch } from 'react-redux';
import { createFile, deleteFile, renameFile, fetchFileTree } from '../../store/slices/fileSystemSlice';

// Context Menu Component
const ContextMenu = ({ x, y, items, onClose, theme }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className={`${theme.descriptionForeground} bg-transparent backdrop-blur-sm min-w-32 w-40 absolute border border-gray-700 rounded shadow-lg z-50 text-sm`}
      style={{ top: `${y}px`, left: `${x}px` }}
    >
      <ul className="py-1">
        {items.map((item, index) => (
          <li 
            key={index}
            className={` ${theme.buttonHoverBackground} px-4 py-2 cursor-pointer flex items-center`}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

// New File/Folder Input Component
const NewItemInput = ({ parentPath, type, onCancel, onSave, theme }) => {
  const [name, setName] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    // Focus the input when mounted
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (name.trim()) {
        onSave(name);
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-center ml-5 my-1">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => name.trim() ? onSave(name) : onCancel()}
        className={`${theme.descriptionForeground} ${theme.inputBackground} border rounded px-2 py-1 w-full text-sm`}
        placeholder={type === 'file' ? 'filename.js' : 'folder name'}
      />
    </div>
  );
};

// RenameInput Component
const RenameInput = ({ node, onCancel, onSave, theme }) => {
  const [name, setName] = useState(node.name);
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      // Select file name without extension for easier renaming
      if (!node.isFolder) {
        const dotIndex = node.name.lastIndexOf('.');
        if (dotIndex > 0) {
          inputRef.current.setSelectionRange(0, dotIndex);
        } else {
          inputRef.current.select();
        }
      } else {
        inputRef.current.select();
      }
    }
  }, [node]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (name.trim() && name !== node.name) {
        onSave(name);
      } else {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onCancel()}
      className={`${theme.descriptionForeground} ${theme.inputBackground} border border-gray-600 rounded px-2 py-1 w-full text-sm mx-2`}
    />
  );
};

const FileTreeNode = ({ 
  node, 
  onFileSelect, 
  currentFile, 
  level = 0, 
  theme, 
  collapseAllTrigger, 
  onFolderToggle 
}) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(node.isOpen || false);
  const [contextMenu, setContextMenu] = useState(null);
  const [isCreatingNewItem, setIsCreatingNewItem] = useState(null); // 'file' or 'folder' or null
  const [isRenaming, setIsRenaming] = useState(false);
  
  const isFolder = node.isFolder;
  const isActive = currentFile === node.path;
  const hasChildren = isFolder && node.children && Object.keys(node.children).length > 0;

  // Notify parent when folder is opened or closed
  useEffect(() => {
    if (isFolder && onFolderToggle) {
      onFolderToggle(node.path, isOpen);
    }
  }, [isOpen, isFolder, node.path, onFolderToggle]);

  // Add useEffect to handle collapsing all nodes
  useEffect(() => {
    if (isFolder && isOpen) {
      setIsOpen(false);
    }
  }, [collapseAllTrigger, isFolder]);

  // Add useEffect to auto-open folders when they are in creating mode
  useEffect(() => {
    if (isFolder && isCreatingNewItem && !isOpen) {
      setIsOpen(true);
    }
  }, [isCreatingNewItem, isFolder, isOpen]);

  // Handle context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // If it's a folder, make sure it's selected for context operations
    if (isFolder) {
      // Don't toggle the open state, just ensure it's selected for operations
      // This helps with the mental model - right click = select this folder for operations
    }
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: getContextMenuItems()
    });
  };

  // Generate context menu items based on node type
  const getContextMenuItems = () => {
    const items = [];
    
    if (isFolder) {
      items.push(
        { 
          label: 'New File', 
          icon: <VscNewFile />,
          onClick: () => {
            // First make sure the folder is opened
            setIsOpen(true);
            // Then set the creating state
            setIsCreatingNewItem('file');
          }
        },
        { 
          label: 'New Folder', 
          icon: <VscNewFolder />,
          onClick: () => {
            // First make sure the folder is opened
            setIsOpen(true);
            // Then set the creating state
            setIsCreatingNewItem('folder');
          }
        }
      );
    }
    
    items.push(
      { 
        label: 'Rename', 
        icon: <FaEdit />,
        onClick: () => setIsRenaming(true)
      },
      { 
        label: 'Delete', 
        icon: <FaTrash />,
        onClick: handleDelete
      }
    );
    
    return items;
  };

  // Handle file/folder creation
  const handleCreateItem = (name) => {
    // Make sure we have the correct path when creating in a folder
    let newPath;
    if (isFolder) {
      // When creating inside a folder, join the folder path with the new name
      newPath = `${node.path}/${name}`;
      
      // Make sure the folder is opened to see the new item
      setIsOpen(true);
    } else {
      // When creating next to a file, use the directory name of the file's path
      newPath = `${path.dirname(node.path)}/${name}`;
    }
    
    console.log('Creating item at path:', newPath);
    
    dispatch(createFile({
      path: newPath,
      type: isCreatingNewItem
    }))
    .unwrap()
    .then(() => {
      // Only refresh file tree after successful creation
      dispatch(fetchFileTree());
    })
    .catch((error) => {
      console.error('Error creating item:', error);
      alert(`Failed to create ${isCreatingNewItem}: ${error.message || 'Unknown error'}`);
    });
    
    setIsCreatingNewItem(null);
  };

  // Handle rename
  const handleRename = (newName) => {
    const pathParts = node.path.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');
    
    dispatch(renameFile({
      oldPath: node.path,
      newPath: newPath
    }))
    .unwrap()
    .then(() => {
      // Only refresh file tree after successful rename
      dispatch(fetchFileTree());
    })
    .catch(error => {
      console.error('Error renaming item:', error);
      alert(`Failed to rename to ${newName}: ${error.message || 'Unknown error'}`);
    });
    
    setIsRenaming(false);
  };

  // Handle delete
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${node.name}?`)) {
      dispatch(deleteFile(node.path))
      .unwrap()
      .then(() => {
        // Only refresh file tree after successful deletion
        dispatch(fetchFileTree());
      })
      .catch(error => {
        console.error('Error deleting item:', error);
        alert(`Failed to delete ${node.name}: ${error.message || 'Unknown error'}`);
      });
    }
  };

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
    } else if (fileName.endsWith('.jsx')) {
      return <TbFileTypeJsx className="text-blue-400" size={12} />;
    } else if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) {
      return <TbFileTypeTsx className="text-blue-400" size={12} />;
    } else if (fileName.endsWith('.py')) {
      return <FaPython className="text-blue-500" size={12} />;
    } else if (fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.m4a')) {
      return <FaFileAudio className="text-green-400" size={12} />;
    } else if (fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi')) {
      return <FaFileVideo className="text-red-400" size={12} />;
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return <FaFileWord className="text-blue-400" size={12} />;
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return <FaFileExcel className="text-green-400" size={12} />;
    } else if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
      return <FaFilePowerpoint className="text-red-400" size={12} />;
    } else if (fileName.endsWith('.pdf')) {
      return <FaFilePdf className="text-red-400" size={12} />;
    } else if (fileName.endsWith('.env')) {
      return <GiSettingsKnobs className="text-yellow-400" size={12} />;
    } else if (fileName.includes('.git')) {
      return <FaGitAlt className="text-rose-500" size={12} />;
    }
    
    return <FaFile className={theme.iconColor} size={12} />;
  };
  
  const handleClick = () => {
    if (isFolder) {
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      
      // Notify parent about folder open state change
      if (onFolderToggle) {
        onFolderToggle(node.path, newIsOpen);
      }
    } else {
      onFileSelect(node);
    }
  };
  
  const renderChildren = () => {
    if (!isFolder) return null;
    
    // Always render this div when it's a folder - regardless of isOpen
    // This ensures the creation input is shown even if folder was closed
    return (
      <div className="ml-2">
        {/* Only render children nodes when the folder is open */}
        {isOpen && hasChildren && 
          Object.values(node.children).map((childNode, index) => (
          <div className="border-l border-l-[#333] group-hover:border-l-[#444]" style={{ marginLeft: (level === 0 || level === 1) ? "3px": ((level *level*4  +4 )/level)+"px" }}>
            <FileTreeNode
              key={childNode.id}
              node={childNode}
              onFileSelect={onFileSelect}
              currentFile={currentFile}
              level={level + 1}
              theme={theme}
              collapseAllTrigger={collapseAllTrigger}
              onFolderToggle={onFolderToggle}
            />
          </div>
          ))
        }
        
        {/* Always show the new item input when creating, even if folder was closed */}
        {isCreatingNewItem && (
          <NewItemInput 
          theme={theme}
            parentPath={node.path}
            type={isCreatingNewItem}
            onCancel={() => setIsCreatingNewItem(null)}
            onSave={handleCreateItem}
          />
        )}
      </div>
    );
  };
  
  return (
    <div>
      <div 
        className={`group flex items-center ${level === 0 ? "px-0" : "px-2"} cursor-pointer text-sm hover:${theme.listHoverBackground} ${isActive ? theme.listActiveForeground : theme.foreground}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{ 
          paddingLeft: `${level === 0 || level === 1 ? "5px" : (level *level*4  +5 )/level+"px"}`,
          position: 'relative'
        }}
      >
        {/* Left border for grouping folders/files */}
        {level > 0 && (
          <div 
            className={`absolute left-0 h-full opacity-30 group-hover:opacity-100 bg-transparent`}
            style={{ 
              width: '1px',
              left: `${level === 0 || level === 1 ? "3px" : (level *level*4  +4 )/level+"px"}`
            }}
          />
        )}
        
        <div className="flex items-center py-1">
          {hasChildren && (
            <span className="mr-1">
              {isOpen ? <FaChevronDown size={10} className={theme.iconColor}/> : <FaChevronRight size={10} className={theme.iconColor}/>}
            </span>
          )}
          
          <span className={`${theme.iconColor} ${level === 0 ? "hidden" : "mx-1"}`}>{getFileIcon()}</span>
          
          {isRenaming ? (
            <RenameInput 
              node={node}
              theme={theme}
              onCancel={() => setIsRenaming(false)}
              onSave={handleRename}
            />
          ) : (
            <span className={`${level === 0 ? `${theme.panelTitleForeground} uppercase font-medium text-xs` : `${theme.foreground}`} truncate`}>
              {node.name}
            </span>
          )}
        </div>
      </div>
      {renderChildren()}
      
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          theme={theme}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

const JsTreeFileExplorer = ({ 
  fileData, 
  onFileSelect, 
  theme, 
  currentFile, 
  collapseAllTrigger,
  onFolderToggle
}) => {
  const dispatch = useDispatch();
  const [isCreatingNewItem, setIsCreatingNewItem] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  
  const handleRootContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { 
          label: 'New File', 
          icon: <VscNewFile />,
          onClick: () => setIsCreatingNewItem('file')
        },
        { 
          label: 'New Folder', 
          icon: <VscNewFolder />,
          onClick: () => setIsCreatingNewItem('folder')
        }
      ]
    });
  };
  
  const handleCreateItem = (name) => {
    // For root level, we use the first directory name as parent or empty string
    const parentPath = fileData.length > 0 ? fileData[0].path.split('/')[0] : '';
    
    dispatch(createFile({
      path: parentPath ? `${parentPath}/${name}` : name,
      type: isCreatingNewItem
    }))
    .unwrap()
    .then(() => {
      // Only refresh file tree after successful creation
      dispatch(fetchFileTree());
    })
    .catch((error) => {
      console.error('Error creating item:', error);
      alert(`Failed to create ${isCreatingNewItem}: ${error.message || 'Unknown error'}`);
    });
    
    setIsCreatingNewItem(null);
  };
  
  if (!fileData || fileData.length === 0) {
    return (
      <div 
        className="p-4 text-center" 
        style={{ color: theme.descriptionForeground }}
        onContextMenu={handleRootContextMenu}
      >
        No files found
        
        {contextMenu && (
          <ContextMenu 
            x={contextMenu.x} 
            y={contextMenu.y} 
            theme={theme}
            items={contextMenu.items}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    );
  }
  
  return (
    <div className="file-explorer w-full" onContextMenu={handleRootContextMenu}>
      {fileData.map((rootNode) => (
        <FileTreeNode
          key={rootNode.path || rootNode.id}
          node={rootNode}
          onFileSelect={onFileSelect}
          currentFile={currentFile}
          theme={theme}
          collapseAllTrigger={collapseAllTrigger}
          onFolderToggle={onFolderToggle}
        />
      ))}
      
      {isCreatingNewItem && (
        <NewItemInput 
          parentPath=""
          theme={theme}
          type={isCreatingNewItem}
          onCancel={() => setIsCreatingNewItem(null)}
          onSave={handleCreateItem}
        />
      )}
      
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          theme={theme}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default JsTreeFileExplorer; 
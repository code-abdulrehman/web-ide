import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaFolder, 
  FaFolderOpen,
  FaSearch, 
  FaCode, 
  FaGithub, 
  FaBug, 
  FaChevronRight, 
  FaChevronDown, 
  FaFile, 
  FaJs, 
  FaHtml5,
  FaCss3,
  FaReact,
  FaMarkdown,
  FaFileAlt,
  FaCog,
  FaEllipsisH,
  FaTimes,
  FaCircleNotch,
  FaPlus,
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
  FaCheck
} from 'react-icons/fa';
import { GiSettingsKnobs } from "react-icons/gi"; // .env
import { TbFileTypeJsx, TbFileTypeTsx } from "react-icons/tb"; //jsx
import { VscNewFile, VscNewFolder, VscRefresh, VscCollapseAll } from 'react-icons/vsc';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFileTree, readFile, setCurrentFile, closeFile, createFile } from '../../store/slices/fileSystemSlice';
import JsTreeFileExplorer from './JsTreeFileExplorer';

// Main component
const LeftSidebar = ({ isOpen, setIsOpen, activePanel, setActivePanel, theme, showIconsOnly = false, showContentOnly = false }) => {
  const dispatch = useDispatch();
  const fileSystem = useSelector(state => state.fileSystem);
  const { fileTree, status: fileTreeStatus, error: fileTreeError, currentFile, openFiles } = fileSystem;

  // Local state
  const [treeData, setTreeData] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [contentWidth, setContentWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mainFolderName, setMainFolderName] = useState('Files');
  const [showNoDataOptions, setShowNoDataOptions] = useState(false);
  const [apiCallFailed, setApiCallFailed] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [collapseAllTrigger, setCollapseAllTrigger] = useState(false);
  const [openFilesCollapsed, setOpenFilesCollapsed] = useState(false);
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemInputVisible, setNewItemInputVisible] = useState(false);
  const [newItemType, setNewItemType] = useState(null); // 'file' or 'folder'
  const [folderOpenState, setFolderOpenState] = useState({});
  
  // Define activity bar items
  const activityBarItems = [
    { id: 'explorer', icon: <FaFolder />, title: 'Explorer' },
    { id: 'search', icon: <FaSearch />, title: 'Search' },
    { id: 'git', icon: <FaGithub />, title: 'Source Control' },
    { id: 'debug', icon: <FaBug />, title: 'Run and Debug' },
    { id: 'settings', icon: <FaCog />, title: 'Settings', position: 'bottom' }
  ];

  // Convert the object-based tree to array format - memoize for performance
  const convertTreeToArray = useCallback((treeObj, forceCollapsed = false, openState = {}) => {
    if (!treeObj || typeof treeObj !== 'object') {
      return [];
    }
    
    const result = Object.keys(treeObj).map(key => {
      const node = treeObj[key];
      if (!node) {
        return null;
      }
      
      // Use path as the key for remembering open state
      const nodePath = node.path || key;
      
      // Determine if the folder should be open
      // 1. If forceCollapsed is true, close all folders
      // 2. If this path is in openState, use that value
      // 3. If node has an isOpen property, use that
      // 4. Default to true
      let isOpen = false;
      if (forceCollapsed) {
        isOpen = false;
      } else if (openState[nodePath] !== undefined) {
        isOpen = openState[nodePath];
      } else if (node.isOpen !== undefined) {
        isOpen = node.isOpen;
      } else {
        isOpen = true;
      }
      
      // Create a node with all properties properly copied
      const newNode = {
        id: node.id || key,
        name: node.name || key,
        path: nodePath,
        isFolder: node.isFolder || false,
        isOpen: isOpen,
        children: node.children ? convertTreeToArray(node.children, forceCollapsed, openState) : null
      };
      
      return newNode;
    }).filter(Boolean); // Filter out any null entries
    
    return result;
  }, []);

  // Fetch data from API
  const fetchFileData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Dispatch the actual Redux action to fetch file tree
      const result = await dispatch(fetchFileTree()).unwrap();
      
      // If result is empty or undefined, show the no data options
      if (!result || Object.keys(result).length === 0) {
        setShowNoDataOptions(true);
        setApiCallFailed(false);
        setTreeData([]);
      } else {
        // Process the API data
        const formattedTree = convertTreeToArray(result, false, folderOpenState);
        setTreeData(formattedTree);
        setShowNoDataOptions(false);
        setApiCallFailed(false);
        
        // Set main folder name
        if (formattedTree.length > 0 && formattedTree[0]?.path) {
          const pathParts = formattedTree[0].path.split('/');
          if (pathParts.length > 0) {
            setMainFolderName(pathParts[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching file data:", error);
      setApiCallFailed(true);
      setShowNoDataOptions(true);
    } finally {
      setIsLoading(false);
      setFirstLoad(false);
    }
  }, [convertTreeToArray, dispatch]);

  // Format the file tree when folder open state changes
  const formatFileTree = useCallback(() => {
    if (fileTree) {
      const formattedTree = convertTreeToArray(fileTree, false, folderOpenState);
      setTreeData(formattedTree);
      
      // Set main folder name if needed
      if (formattedTree.length > 0 && formattedTree[0]?.path) {
        const pathParts = formattedTree[0].path.split('/');
        if (pathParts.length > 0) {
          setMainFolderName(pathParts[0]);
        }
      }
    }
  }, [fileTree, folderOpenState, convertTreeToArray]);

  // Apply folder open state changes
  useEffect(() => {
    formatFileTree();
  }, [folderOpenState, formatFileTree]);

  // Load data on component mount
  useEffect(() => {
    fetchFileData();
  }, [fetchFileData]);

  // Also update when fileTree changes in Redux
  useEffect(() => {
    if (fileTreeStatus === 'succeeded' && fileTree) {
      formatFileTree();
      
      if (treeData.length === 0) {
        setShowNoDataOptions(true);
      } else {
        setShowNoDataOptions(false);
      }
    } else if (fileTreeStatus === 'failed') {
      setApiCallFailed(true);
      setShowNoDataOptions(true);
    }
  }, [fileTree, fileTreeStatus, formatFileTree, treeData.length]);

  // Function to handle file click
  const handleFileClick = (node) => {
    // Use the path property from the node
    const filePath = node.path;
    
    // If file is not already open, read its content
    if (!openFiles[filePath]) {
      dispatch(readFile(filePath));
    } else {
      // If already loaded, just set as current file
      dispatch(setCurrentFile(filePath));
    }
  };

  // Function to refresh file tree
  const handleRefreshFileTree = () => {
    fetchFileData();
  };

  // Function to collapse all folders in the tree
  const collapseAll = () => {
    // Set forceCollapsed to true to collapse all folders
    setTreeData(convertTreeToArray(fileTree, true, folderOpenState));
    // Toggle collapseAllTrigger to trigger re-render in children
    setCollapseAllTrigger(prev => !prev);
    // Also collapse the Open Files section
    setOpenFilesCollapsed(true);
  };

  // Get the appropriate icon for file type
  const getFileIcon = (fileName) => {
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

  // Handle click on activity bar item
  const handleActivityBarClick = (itemId) => {
    if (activePanel === itemId && isOpen) {
      // If clicking the same panel that's already open, close the sidebar
      setIsOpen(false);
    } else {
      // Either new panel selected or sidebar is currently closed
      setActivePanel(itemId);
      setIsOpen(true);
    }
  };

  // Resize handler for content panel
  const startResize = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    const newWidth = Math.max(200, Math.min(450, e.clientX - 48)); // 48px is activityBar width
    setContentWidth(newWidth);
  };

  const stopResize = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResize);
  };

  // Cleanup resize event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing]);

  // Render open editors 
  const renderOpenEditors = () => {
    const openFilesList = Object.keys(openFiles).map(path => ({
      path,
      name: path.split('/').pop(), // Extract filename from path
      isActive: path === currentFile
    }));

    if (openFilesList.length === 0) {
      return (
        <div className={`px-2 py-1 text-sm ${theme.descriptionForeground}`}>
          No open files
        </div>
      );
    }

    return openFilesList.map((file, index) => (
      <div 
        key={index}
        className={`px-2 py-1 text-sm rounded flex items-center justify-between hover:${theme.listHoverBackground} ${file.isActive ? theme.listActiveForeground : ''}`}
        onClick={() => dispatch(setCurrentFile(file.path))}
      >
        <div className="flex items-center truncate">
          {getFileIcon(file.name)}
          <span className={`${theme.foreground} ml-2 truncate`}>{file.name}</span>
          {openFiles[file.path]?.isDirty && (
            <span className="ml-1 text-xs">•</span>
          )}
        </div>
        <div 
          className="opacity-0 group-hover:opacity-100 hover:text-gray-300"
          onClick={(e) => {
            e.stopPropagation();
            dispatch(closeFile(file.path));
          }}
        >
          <FaTimes size={10} />
        </div>
      </div>
    ));
  };
  
  // Handle import project button
  const handleImportProject = () => {
    console.log("Import project button clicked");
    // Create an example project structure to show
    const exampleProject = {
      "project": {
        "id": "project",
        "name": "project",
        "path": "project",
        "isFolder": true,
        "isOpen": true,
        "children": {
          "src": {
            "id": "src",
            "name": "src",
            "path": "project/src",
            "isFolder": true,
            "isOpen": true,
            "children": {
              "index.js": {
                "id": "index.js",
                "name": "index.js",
                "path": "project/src/index.js",
                "isFolder": false,
                "isOpen": false,
                "children": null
              },
              "App.js": {
                "id": "App.js",
                "name": "App.js",
                "path": "project/src/App.js",
                "isFolder": false,
                "isOpen": false,
                "children": null
              }
            }
          },
          "package.json": {
            "id": "package.json",
            "name": "package.json",
            "path": "project/package.json",
            "isFolder": false,
            "isOpen": false,
            "children": null
          }
        }
      }
    };

    // Here, you would normally send this to your API
    // For demo, we'll just update the local state
    setTreeData(convertTreeToArray(exampleProject));
    setMainFolderName("Project");
    setShowNoDataOptions(false);
  };

  // Handle create new project button
  const handleCreateProject = () => {
    console.log("Create new project button clicked");
    // Create a simple new project structure
    const newProject = {
      "new-project": {
        "id": "new-project",
        "name": "new-project",
        "path": "new-project",
        "isFolder": true,
        "isOpen": true,
        "children": {
          "index.js": {
            "id": "index.js",
            "name": "index.js",
            "path": "new-project/index.js",
            "isFolder": false,
            "isOpen": false,
            "children": null
          },
          "README.md": {
            "id": "README.md",
            "name": "README.md",
            "path": "new-project/README.md",
            "isFolder": false,
            "isOpen": false,
            "children": null
          }
        }
      }
    };

    // Here, you would normally send this to your API
    // For demo, we'll just update the local state
    setTreeData(convertTreeToArray(newProject));
    setMainFolderName("New Project");
    setShowNoDataOptions(false);
  };

  // Handle new file/folder creation
  const handleNewItemClick = (type) => {
    setNewItemType(type);
    setNewItemName('');
    setNewItemInputVisible(true);
  };

  const handleNewItemCreate = () => {
    if (!newItemName.trim()) {
      setNewItemInputVisible(false);
      return;
    }

    // Determine parent path
    const parentPath = treeData.length > 0 ? treeData[0].path.split('/')[0] : '';
    const itemPath = parentPath ? `${parentPath}/${newItemName}` : newItemName;

    dispatch(createFile({
      path: itemPath,
      type: newItemType
    })).then(() => {
      // Refresh file tree after creation
      dispatch(fetchFileTree());
    });

    setNewItemInputVisible(false);
  };

  // Render the no data or error view
  const renderNoDataView = () => {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${theme.descriptionForeground}`}>
        {apiCallFailed ? (
          <>
            <div className="text-red-500 mb-4 text-center">Failed to load files</div>
            <button 
              className={`px-3 py-2 text-sm ${theme.buttonBackground} ${theme.buttonForeground} rounded flex items-center`}
              onClick={handleRefreshFileTree}
            >
              <VscRefresh className="mr-2" />
              Retry
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 text-center">No files found</div>
            <div className="flex flex-col space-y-2">
              <button 
                className={`px-3 py-2 text-sm ${theme.buttonBackground} ${theme.buttonForeground} rounded flex items-center`}
                onClick={handleImportProject}
              >
                <VscNewFolder className="mr-2" />
                Import Project
              </button>
              <button 
                className={`px-3 py-2 text-sm ${theme.buttonBackground} ${theme.buttonForeground} rounded flex items-center`}
                onClick={handleCreateProject}
              >
                <FaPlus className="mr-2" />
                Create New Project
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Explorer panel
  const renderExplorerPanel = () => {
    return (
      <div className="h-full flex flex-col">
        <div className={`px-2 py-1 font-medium h-[31px] uppercase text-xs flex justify-between items-center border-b ${theme.tabBorder} ${theme.panelTitleForeground}`}>
          {/* <span>{mainFolderName}</span> */}
          <span>Explorer</span>
          <div className="flex space-x-1">
            <button 
              className={`p-1 rounded hover:${theme.buttonHoverBackground}`} 
              title="New File"
              onClick={() => handleNewItemClick('file')}
            >
              <VscNewFile size={14} />
            </button>
            <button 
              className={`p-1 rounded hover:${theme.buttonHoverBackground}`} 
              title="New Folder"
              onClick={() => handleNewItemClick('folder')}
            >
              <VscNewFolder size={14} />
            </button>
            <button 
              className={`p-1 rounded hover:${theme.buttonHoverBackground} relative`} 
              title="Refresh Explorer"
              onClick={handleRefreshFileTree}
              disabled={isLoading}
            >
              {isLoading ? (
                <FaCircleNotch size={14} className="animate-spin" />
              ) : (
                <VscRefresh size={14} />
              )}
            </button>

            <button className={`p-1 rounded hover:${theme.buttonHoverBackground}`} title="Collapse All" onClick={collapseAll}>
              <VscCollapseAll size={14} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* New File/Folder Input */}
          {newItemInputVisible && (
            <div className={`p-2 ${theme.inputBackground}`}>
              <div className="flex items-center">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={newItemType === 'file' ? 'filename.js' : 'folder name'}
                  className={`flex-1 px-2 py-1 text-sm rounded-sm border ${theme.inputBorder} focus:outline-none`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNewItemCreate();
                    if (e.key === 'Escape') setNewItemInputVisible(false);
                  }}
                  autoFocus
                />
                <button 
                  className={`ml-1 p-1 rounded hover:${theme.buttonHoverBackground}`}
                  onClick={handleNewItemCreate}
                >
                  <FaCheck size={10} />
                </button>
                <button 
                  className={`ml-1 p-1 rounded hover:${theme.buttonHoverBackground}`}
                  onClick={() => setNewItemInputVisible(false)}
                >
                  <FaTimes size={10} />
                </button>
              </div>
            </div>
          )}
        
          {/* Open Files Section */}
          <div className="px-0">
            <div
              className={`flex items-center px-2 py-2 ${theme.panelTitleForeground} hover:${theme.listHoverBackground} cursor-pointer`} 
              onClick={() => setOpenFilesCollapsed(!openFilesCollapsed)}
            >
              <span className="mr-1">
                {openFilesCollapsed ? 
                  <FaChevronRight size={10} className={theme.iconColor}/> : 
                  <FaChevronDown size={10} className={theme.iconColor}/>
                }
              </span>
              <span className="text-xs uppercase font-medium">Open Files</span>
            </div>
                
            {!openFilesCollapsed && (
              <div className="pl-2">
                {renderOpenEditors()}
              </div>
            )}
          </div>
          
          {/* File Explorer */}
          <div className="px-2 mt-1">
            {isLoading && firstLoad ? (
              <div className={`flex items-center justify-center py-4 ${theme.descriptionForeground}`}>
                <FaCircleNotch className="animate-spin mr-2" />
                <span className={theme.descriptionForeground}>Loading files...</span>
              </div>
            ) : showNoDataOptions || treeData.length === 0 ? (
              renderNoDataView()
            ) : (
              <JsTreeFileExplorer 
                fileData={treeData}
                onFileSelect={handleFileClick}
                theme={theme}
                currentFile={currentFile}
                collapseAllTrigger={collapseAllTrigger}
                onFolderToggle={(path, isOpen) => {
                  setFolderOpenState(prev => ({
                    ...prev,
                    [path]: isOpen
                  }));
                }}
              />
            )}
            
            {/* Loading indicator for background refresh */}
            {isLoading && !firstLoad && (
              <div className="absolute bottom-2 right-2 p-1">
                <FaCircleNotch className="animate-spin text-xs opacity-50" />
              </div>
            )}
          </div>
        </div>
{/* bottom */}
      </div>
    );
  };
  
  // Panel content renderer
  const renderPanelContent = () => {
    switch (activePanel) {
      case 'explorer':
        return renderExplorerPanel();
        
      case 'search':
        return (
          <div className="h-full flex flex-col">
            <div className={`px-4 py-1 font-medium h-[31px] uppercase text-xs border-b ${theme.tabBorder} ${theme.panelTitleForeground}`}>Search</div>
            <div className="px-4 py-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search in workspace" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-sm ${theme.inputBackground} pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500`} 
                />
                <button className="absolute right-0 top-0 h-full px-2 flex items-center">
                  <FaEllipsisH size={12} className={theme.descriptionForeground} />
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'git':
        return (
          <div className="h-full flex flex-col">
            <div className={`px-4 py-1 font-medium h-[31px] uppercase text-xs flex justify-between items-center border-b ${theme.tabBorder} ${theme.panelTitleForeground}`}>
              <span>Source Control</span>
              <div className="flex space-x-1">
                <button className={`p-1 rounded hover:${theme.buttonHoverBackground}`} title="Refresh">
                  <VscRefresh size={14} />
                </button>
                <button className={`p-1 rounded hover:${theme.buttonHoverBackground}`} title="More Actions">
                  <FaEllipsisH size={12} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="px-4 py-3">
                <div className={`text-sm mb-2 ${theme.foreground}`}>Changes</div>
                <div className={`text-sm border p-2 rounded-sm ${theme.inputBackground}`}>
                  <textarea 
                    placeholder="Message (press Ctrl+Enter to commit)" 
                    className={`w-full bg-transparent outline-none text-sm resize-none ${theme.foreground}`}
                    rows={2}
                  ></textarea>
                </div>
                <button className={`mt-2 px-3 py-1 text-sm ${theme.buttonBackground} ${theme.buttonForeground} rounded-sm hover:${theme.buttonHoverBackground}`}>
                  Commit
                </button>
                <div className={`mt-4 text-sm ${theme.descriptionForeground} text-center`}>
                  No changes detected
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="h-full flex flex-col">
            <div className={`px-4 py-1 font-medium h-[31px] uppercase text-xs border-b ${theme.tabBorder} ${theme.panelTitleForeground}`}>
              {activePanel.charAt(0).toUpperCase() + activePanel.slice(1)}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className={`p-4 text-center ${theme.descriptionForeground}`}>
                {activePanel === 'debug' && "No active debug session"}
              </div>
            </div>
          </div>
        );
    }
  };

  // Render activity bar only
  if (showIconsOnly) {
  return (
      <div className={`h-full flex-shrink-0 ${theme.activityBarBackground}`} style={{ width: '48px' }}>
        {/* Top positioned items */}
        <div className="flex flex-col items-center w-full">
          {activityBarItems.filter(item => item.position !== 'bottom').map((item) => (
            <div 
              key={item.id}
              className={`w-full flex justify-center p-2 cursor-pointer hover:${theme.activityBarItemHoverBackground} ${activePanel === item.id && isOpen ? theme.activityBarItemActiveBackground : ''}`}
              onClick={() => handleActivityBarClick(item.id)}
              title={item.title}
            >
              <span className={`text-xl ${activePanel === item.id && isOpen ? theme.activityBarItemActiveForeground : theme.activityBarItemForeground}`}>
                {item.icon}
              </span>
            </div>
          ))}
        </div>
        
        {/* Bottom positioned items */}
        <div className="mt-auto w-full">
          {activityBarItems.filter(item => item.position === 'bottom').map((item) => (
            <div 
              key={item.id}
              className={`w-full flex justify-center p-2 cursor-pointer hover:${theme.activityBarItemHoverBackground} ${activePanel === item.id && isOpen ? theme.activityBarItemActiveBackground : ''}`}
              onClick={() => handleActivityBarClick(item.id)}
              title={item.title}
            >
              <span className={`text-xl ${activePanel === item.id && isOpen ? theme.activityBarItemActiveForeground : theme.activityBarItemForeground}`}>
                {item.icon}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render content panel only
  if (showContentOnly) {
    return (
      <div className={`h-full overflow-hidden flex flex-col w-full ${theme.sidebarBackground}`}>
        {renderPanelContent()}
      </div>
    );
  }

  // Full rendering with both activity bar and content panel
  return (
    <div className={`h-full flex ${isOpen ? 'w-auto' : 'w-12'}`}>
      {/* Activity Bar */}
      <div className={`h-full flex-shrink-0 flex flex-col justify-between ${theme.activityBarBackground}`} style={{ width: '48px' }}>
        {/* Top positioned items */}
        <div className="flex flex-col items-center w-full gap-2">
          {activityBarItems.filter(item => item.position !== 'bottom').map((item) => (
            <div 
              key={item.id}
              className={`w-full flex justify-center p-2 cursor-pointer hover:${theme.activityBarItemHoverBackground} ${activePanel === item.id && isOpen ? theme.activityBarItemActiveBackground : ''}`}
              onClick={() => handleActivityBarClick(item.id)}
              title={item.title}
            >
              <span className={`text-xl ${activePanel === item.id && isOpen ? theme.activityBarItemActiveForeground : theme.activityBarItemForeground}`}>
                {item.icon}
              </span>
            </div>
          ))}
        </div>
        
        {/* Bottom positioned items */}
        <div className="mt-auto w-full gap-2 flex flex-col">
          {activityBarItems.filter(item => item.position === 'bottom').map((item) => (
            <div 
              key={item.id}
              className={`w-full flex justify-center p-2 cursor-pointer hover:${theme.activityBarItemHoverBackground} ${activePanel === item.id && isOpen ? theme.activityBarItemActiveBackground : ''}`}
              onClick={() => handleActivityBarClick(item.id)}
              title={item.title}
            >
              <span className={`text-xl ${activePanel === item.id && isOpen ? theme.activityBarItemActiveForeground : theme.activityBarItemForeground}`}>
                {item.icon}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Panel */}
      {isOpen && (
        <div className="h-full flex flex-shrink-0 relative">
          <div 
            className={`h-full overflow-hidden border-r-[1px] ${theme.tabBorder} ${theme.sidebarBackground}`}
            style={{ width: `${contentWidth}px` }}
          >
            {/* Panel content */}
            <div className="flex-1 overflow-hidden h-[calc(100%-36px)]">
        {renderPanelContent()}
      </div>
          </div>
          
          {/* Resize handle */}
          <div 
            className={`border-r h-full cursor-col-resize border-gray-700 hover:border-blue-500 hover:opacity-80 active:border-blue-600 active:opacity-100 absolute right-0 top-0 z-10 ${isResizing ? 'border-blue-500' : ''}`}
            onMouseDown={startResize}
          ></div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar; 
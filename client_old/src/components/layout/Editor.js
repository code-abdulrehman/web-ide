import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FaTimes, 
  FaChevronLeft,
  FaChevronRight,
  FaFolder, 
  FaFolderOpen,
  FaFile, 
  FaJs, 
  FaHtml5,
  FaCss3,
  FaMarkdown,
  FaFileAlt,
  FaPython,
  FaFileAudio,
  FaFileVideo,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFilePdf,
  FaGitAlt,
  FaRegSave,
  FaExchangeAlt,
  FaCodeBranch,
  FaColumns,
  FaEllipsisV,
  FaSearch,
  FaCode,
  FaCog
} from 'react-icons/fa';
import { GiSettingsKnobs } from "react-icons/gi"; // .env
import { TbFileTypeJsx, TbFileTypeTsx } from "react-icons/tb"; //jsx
import Editor from '@monaco-editor/react';
import { useSelector, useDispatch } from 'react-redux';
import { updateFileContent, closeFile, setCurrentFile, markFileSaved, saveFile, readFile } from '../../store/slices/fileSystemSlice';
import { 
  connectSocket, 
  disconnectSocket, 
  joinFileEditingRoom, 
  sendCodeChanges, 
  saveFileChanges
} from '../../services/socketService';
import CompareEditor from './CompareEditor';
import FileCompareModal from '../modals/FileCompareModal';

// EditorDropdown Component
const EditorDropdown = ({ theme, onOptionSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const options = [
    { id: 'compare', label: 'Compare Files', icon: <FaColumns size={12} /> },
    { id: 'search', label: 'Find in Files', icon: <FaSearch size={12} /> },
    { id: 'format', label: 'Format Document', icon: <FaCode size={12} /> },
    { id: 'settings', label: 'Editor Settings', icon: <FaCog size={12} /> }
  ];
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`px-2 py-1 flex items-center justify-center hover:${theme.buttonHoverBackground} transition-colors duration-150`}
        onClick={() => setIsOpen(!isOpen)}
        title="Editor Options"
      >
        <FaEllipsisV className={`text-sm ${theme.iconColor}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute right-0 mt-1 w-48 rounded-md shadow-lg ${theme.background} ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}>
          <div className={`py-1 border ${theme.border} rounded`} role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {options.map((option) => (
              <button
                key={option.id}
                className={`w-full text-left px-4 py-2 flex items-center hover:${theme.buttonHoverBackground} ${theme.foreground}`}
                onClick={() => {
                  onOptionSelect(option.id);
                  setIsOpen(false);
                }}
                role="menuitem"
              >
                <span className="mr-2">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Search In Files Modal Component
const SearchFilesModal = ({ theme, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`w-full max-w-2xl max-h-[90vh] ${theme.background} rounded shadow-lg flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
          <h2 className={`text-xl font-medium ${theme.foreground}`}>Find in Files</h2>
          <button 
            onClick={onClose}
            className={`p-1 rounded hover:${theme.buttonHoverBackground}`}
          >
            <FaTimes className={theme.iconColor} />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="p-4">
          <div className="flex">
            <input
              type="text"
              placeholder="Search term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-l border ${theme.inputBackground} ${theme.foreground} ${theme.inputBorder}`}
            />
            <button 
              className={`px-4 py-2 rounded-r ${theme.buttonBackground} ${theme.buttonForeground} hover:${theme.buttonHoverBackground}`}
              onClick={() => console.log('Search for:', searchTerm)}
            >
              <FaSearch />
            </button>
          </div>
          
          <div className="mt-2 flex space-x-4">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className={`text-sm ${theme.foreground}`}>Match case</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className={`text-sm ${theme.foreground}`}>Whole word</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className={`text-sm ${theme.foreground}`}>Use regex</span>
            </label>
          </div>
        </div>
        
        {/* Results Area (placeholder) */}
        <div className={`flex-grow overflow-auto p-4 border-t ${theme.border}`}>
          <div className={`flex items-center justify-center h-full ${theme.descriptionForeground}`}>
            Search results will appear here
          </div>
        </div>
        
        {/* Footer */}
        <div className={`p-4 border-t ${theme.border} flex justify-end space-x-2`}>
          <button 
            onClick={onClose}
            className={`px-4 py-2 rounded ${theme.secondaryButtonBackground} ${theme.secondaryButtonForeground} hover:${theme.secondaryButtonHoverBackground}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Editor Settings Modal Component
const EditorSettingsModal = ({ theme, fontSize, onClose, onUpdateSettings }) => {
  const [newFontSize, setNewFontSize] = useState(fontSize);
  const [wordWrap, setWordWrap] = useState('on');
  const [tabSize, setTabSize] = useState(2);
  
  const handleSave = () => {
    onUpdateSettings({
      fontSize: newFontSize,
      wordWrap,
      tabSize
    });
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`w-full max-w-md max-h-[90vh] ${theme.background} rounded shadow-lg flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
          <h2 className={`text-xl font-medium ${theme.foreground}`}>Editor Settings</h2>
          <button 
            onClick={onClose}
            className={`p-1 rounded hover:${theme.buttonHoverBackground}`}
          >
            <FaTimes className={theme.iconColor} />
          </button>
        </div>
        
        {/* Settings Form */}
        <div className="p-4 overflow-auto">
          <div className="mb-4">
            <label className={`block mb-2 text-sm font-medium ${theme.foreground}`}>
              Font Size
            </label>
            <input
              type="number"
              value={newFontSize}
              onChange={(e) => setNewFontSize(Number(e.target.value))}
              min="8"
              max="32"
              className={`w-full px-3 py-2 rounded border ${theme.inputBackground} ${theme.foreground} ${theme.inputBorder}`}
            />
          </div>
          
          <div className="mb-4">
            <label className={`block mb-2 text-sm font-medium ${theme.foreground}`}>
              Word Wrap
            </label>
            <select
              value={wordWrap}
              onChange={(e) => setWordWrap(e.target.value)}
              className={`w-full px-3 py-2 rounded border ${theme.inputBackground} ${theme.foreground} ${theme.inputBorder}`}
            >
              <option value="on">On</option>
              <option value="off">Off</option>
              <option value="wordWrapColumn">Bounded</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className={`block mb-2 text-sm font-medium ${theme.foreground}`}>
              Tab Size
            </label>
            <input
              type="number"
              value={tabSize}
              onChange={(e) => setTabSize(Number(e.target.value))}
              min="1"
              max="8"
              className={`w-full px-3 py-2 rounded border ${theme.inputBackground} ${theme.foreground} ${theme.inputBorder}`}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className={`p-4 border-t ${theme.border} flex justify-end space-x-2`}>
          <button 
            onClick={onClose}
            className={`px-4 py-2 rounded ${theme.secondaryButtonBackground} ${theme.secondaryButtonForeground} hover:${theme.secondaryButtonHoverBackground}`}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className={`px-4 py-2 rounded ${theme.buttonBackground} ${theme.buttonForeground} hover:${theme.buttonHoverBackground}`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const EditorComponent = ({ theme, fontSize = 14 }) => {
  const dispatch = useDispatch();
  const fileSystem = useSelector(state => state.fileSystem);
  const { openFiles, currentFile } = fileSystem;
  
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for tabs and active file
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState();
  
  // State for file comparison
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareFiles, setCompareFiles] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  // Ref for tab container to handle scrolling
  const tabsContainerRef = useRef(null);
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  
  // Add new state for modals
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editorSettings, setEditorSettings] = useState({
    fontSize: fontSize,
    wordWrap: 'on',
    tabSize: 2
  });
  
  // Initialize socket connection on component mount
  useEffect(() => {
    socketRef.current = connectSocket();
    
    // Set up event listeners
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      if (activeTab) {
        joinFileEditingRoom(activeTab);
      }
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });
    
    socketRef.current.on('file-saved', (data) => {
      console.log('File saved response:', data);
      if (data.success) {
        dispatch(markFileSaved(data.path));
        setIsSaving(false);
        console.log(`File ${data.path} saved successfully`);
      } else {
        console.error('Error saving file:', data.error);
        setIsSaving(false);
        // Could show an error notification here
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('file-saved');
        disconnectSocket();
      }
    };
  }, [dispatch]);
  
  // Join file editing room when active tab changes
  useEffect(() => {
    if (activeTab && isConnected) {
      joinFileEditingRoom(activeTab);
    }
  }, [activeTab, isConnected]);

  // Get editor reference when mounted
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Add keyboard shortcut for save
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyS, 
      () => handleSaveFile()
    );
  };

  // Auto save on content change (with debounce)
  const autoSaveDebounced = useCallback((content) => {
    if (activeTab && openFiles[activeTab]) {
      setIsSaving(true);
      console.log('Auto saving file...');
      
      if (isConnected) {
        saveFileChanges(activeTab);
      } else {
        // Fallback save method if socket is not connected
        dispatch(saveFile({ path: activeTab, content }))
          .unwrap()
          .then(() => {
            setIsSaving(false);
          })
          .catch(err => {
            console.error('Error saving file:', err);
            setIsSaving(false);
          });
      }
    }
  }, [activeTab, dispatch, isConnected, openFiles]);

  // Use this with a debounce hook in your component
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (activeTab && openFiles[activeTab]?.isDirty) {
        const content = tabs.find(tab => tab.id === activeTab)?.content;
        if (content) {
          autoSaveDebounced(content);
        }
      }
    }, 5000); // Auto save after 5 seconds of inactivity
    
    return () => clearTimeout(debounceTimer);
  }, [tabs, activeTab, openFiles, autoSaveDebounced]);

  // Effect to handle file opening from sidebar
  useEffect(() => {
    if (currentFile && openFiles[currentFile]) {
      // Check if the file is already in tabs
      const existingTab = tabs.find(tab => tab.id === currentFile);
      
      if (!existingTab) {
        // Add a new tab for the opened file
        const fileName = currentFile.split('/').pop(); // Get just the filename part
        
        // Handle the case where the content might be an error object
        let fileContent = openFiles[currentFile].content;
        if (typeof fileContent === 'object' && fileContent !== null) {
          // Convert error object to string representation
          fileContent = JSON.stringify(fileContent, null, 2);
        }
        
        const newTab = {
          id: currentFile,
          label: fileName,
          language: getLanguageFromFileName(fileName),
          content: fileContent
        };
        
        setTabs(prevTabs => [...prevTabs, newTab]);
      }
      
      // Set as active tab
      setActiveTab(currentFile);
    }
  }, [currentFile, openFiles]);

  // Helper to determine language from filename
  const getLanguageFromFileName = (fileName) => {
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'javascript';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.md')) return 'markdown';
    if (fileName.endsWith('.ts')) return 'typescript';
    if (fileName.endsWith('.tsx')) return 'typescript';
    return 'plaintext';
  };
  
  
  // Add a new tab
  const addTab = () => {
    const newId = `file-${tabs.length + 1}.js`;
    setTabs([
      ...tabs,
      { id: newId, label: `file-${tabs.length + 1}.js`, language: 'javascript', content: '// New file' }
    ]);
    setActiveTab(newId);
  };
  
  // Close a tab
  const closeTab = (e, tabId) => {
    e.stopPropagation();
    
    // Create new array without the closed tab
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    // If this is a file from the file system, dispatch to Redux to close it
    if (openFiles[tabId]) {
      dispatch(closeFile(tabId));
    }
    
    // If the active tab is being closed, activate another tab or show welcome screen
    if (activeTab === tabId) {
      if (newTabs.length > 0) {
        setActiveTab(newTabs[0].id);
      } else {
        setActiveTab(null);
      }
    }
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
  
  // Handle content change
  const handleEditorChange = (value) => {
    // Update local state
    setTabs(tabs.map(tab => 
      tab.id === activeTab 
        ? { ...tab, content: value } 
        : tab
    ));
    
    // Update content in Redux if the file came from the filesystem
    if (openFiles[activeTab]) {
      // Dispatch to Redux store
      dispatch(updateFileContent({ path: activeTab, content: value }));
      
      // Send changes via socket if connected
      if (isConnected) {
        try {
          const language = getLanguageFromFileName(activeTab.split('/').pop());
          console.log(`Sending changes to ${activeTab} via socket`);
          sendCodeChanges(activeTab, value, language);
        } catch (error) {
          console.error('Error sending code changes via socket:', error);
        }
      }
    }
  };
  
  // Handle manual file save
  const handleSaveFile = () => {
    if (!activeTab || !openFiles[activeTab]) return;
    
    setIsSaving(true);
    
    try {
      const tab = tabs.find(tab => tab.id === activeTab);
      if (!tab) {
        setIsSaving(false);
        return;
      }
      
      console.log(`Manual save triggered for ${activeTab}`);
      
      // Use socket to save the file
      if (isConnected) {
        console.log('Saving via socket connection');
        saveFileChanges(activeTab);
        
        // We'll set isSaving to false when we get the file-saved event from the server
      } else {
        // Fallback to traditional save if socket isn't connected
        console.log('Saving via traditional method (socket disconnected)');
        dispatch(saveFile({ 
          path: activeTab, 
          content: tab.content 
        }))
          .unwrap()
          .then(() => {
            dispatch(markFileSaved(activeTab));
            setIsSaving(false);
            console.log(`File ${activeTab} saved successfully via traditional method`);
          })
          .catch(err => {
            console.error('Error saving file:', err);
            setIsSaving(false);
            // Could show an error notification here
          });
      }
    } catch (error) {
      console.error('Error in save process:', error);
      setIsSaving(false);
    }
  };
  
  // Get the active tab's language
  const getLanguage = () => {
    const tab = tabs.find(tab => tab.id === activeTab);
    if (!tab) return 'javascript';
    
    return getLanguageFromFileName(tab.label);
  };
  
  // Get the active tab's content
  const getContent = () => {
    const tab = tabs.find(tab => tab.id === activeTab);
    if (!tab) return '';
    
    // Ensure content is a string, not an object
    const content = tab.content;
    if (typeof content === 'object' && content !== null) {
      return JSON.stringify(content, null, 2);
    }
    
    return content || '';
  };
  
  // ScrollLeft/ScrollRight for tab overflow
  const scrollTabs = (direction) => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const scrollAmount = 100; // px to scroll each time
      
      if (direction === 'left') {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  };
  
  // Handle wheel event for horizontal scrolling of tabs
  const handleWheel = (e) => {
    if (tabsContainerRef.current && e.deltaY !== 0) {
      e.preventDefault();
      tabsContainerRef.current.scrollLeft += e.deltaY;
    }
  };
  
  // Handle dropdown option selection
  const handleOptionSelect = (optionId) => {
    switch (optionId) {
      case 'compare':
        setShowCompareModal(true);
        break;
      case 'search':
        setShowSearchModal(true);
        break;
      case 'format':
        // Format current document
        try {
          if (editorRef.current) {
            editorRef.current.getAction('editor.action.formatDocument')?.run();
          }
        } catch (error) {
          console.error('Error formatting document:', error);
        }
        break;
      case 'settings':
        setShowSettingsModal(true);
        break;
      default:
        break;
    }
  };
  
  // Update editor settings
  const handleUpdateSettings = (newSettings) => {
    setEditorSettings({
      ...editorSettings,
      ...newSettings
    });
    
    // Apply new settings to editor if needed
    if (editorRef.current) {
      try {
        // Update editor options
        editorRef.current.updateOptions({
          fontSize: newSettings.fontSize,
          wordWrap: newSettings.wordWrap,
          tabSize: newSettings.tabSize
        });
      } catch (error) {
        console.error('Error updating editor settings:', error);
      }
    }
  };
  
  // Get Monaco Editor options for theme
  const getEditorOptions = () => {
    return {
      fontSize: editorSettings.fontSize,
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
      tabSize: editorSettings.tabSize,
      wordWrap: editorSettings.wordWrap,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontLigatures: true
    };
  };
  
  // Determine the theme to use for Monaco Editor
  const getEditorTheme = () => {
    // Check if theme is an object with properties (as in our updated app)
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
  };
  
  // Render welcome screen when no tabs are open
  const renderWelcomeScreen = () => {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${theme.editorBackground}`}>
        <div className="text-center max-w-lg animate-fade-in">
          <div className="text-6xl mb-6 opacity-100">👋</div>
          <h1 className={`text-2xl font-light mb-4 ${theme.foreground}`}>Welcome to Web IDE</h1>
          <p className={`text-sm mb-6 ${theme.descriptionForeground} max-w-md text-center`}>
            A powerful, lightweight IDE for web development right in your browser.
          </p>
          
          <div className="flex space-x-4 justify-center mb-10">
            <button 
              className={`px-4 py-2 rounded-sm text-sm ${theme.buttonBackground} ${theme.buttonForeground} hover:${theme.buttonHoverBackground}`}
              // onClick={addTab}
            >
              New File
            </button>
            <button 
              className={`px-4 py-2 rounded-sm text-sm ${theme.secondaryButtonBackground} ${theme.secondaryButtonForeground} hover:${theme.secondaryButtonHoverBackground}`}
              onClick={() => {/* Could open a project */}}
            >
              Open Folder
            </button>
            <button 
              className={`px-4 py-2 rounded-sm text-sm ${theme.secondaryButtonBackground} ${theme.secondaryButtonForeground} hover:${theme.secondaryButtonHoverBackground}`}
              onClick={() => {/* Could clone a repository */}}
            >
              Clone Repository
            </button>
          </div>
          
          <div className="flex gap-8 text-left mt-8">
            <div className="flex-1">
              <h3 className={`text-sm font-medium mb-2 ${theme.foreground}`}>Get Started</h3>
              <p className={`text-xs ${theme.descriptionForeground}`}>
                Create a new file, open a folder or clone a git repository to begin.
              </p>
              <p className={`text-xs mt-2 ${theme.descriptionForeground}`}>
                Use <span className={`bg-opacity-20 bg-black px-1 py-0.5 rounded font-mono ${theme.foreground}`}>Ctrl+N</span> to create a new file.
              </p>
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-medium mb-2 ${theme.foreground}`}>Recent Projects</h3>
              <p className={`text-xs ${theme.descriptionForeground}`}>
                Quick access to your recent projects will appear here.
              </p>
              <p className={`text-xs mt-2 ${theme.descriptionForeground}`}>
                Use <span className={`bg-opacity-20 bg-black px-1 py-0.5 rounded font-mono ${theme.foreground}`}>Ctrl+R</span> to open the recent projects list.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full flex-1 ${theme.editorBackground}`}>
      {/* Tabs header - only show if there are tabs */}
      {tabs.length > 0 && (
        <div className={`flex items-center ${theme.tabBarBackground} border-b ${theme.tabBorder}`}>
          {/* Left scroll button */}
          <button 
            className={`px-1 py-1 flex items-center justify-center hover:${theme.buttonHoverBackground} transition-colors duration-150`}
            onClick={() => scrollTabs('left')}
          >
            <FaChevronLeft className={`text-xs ${theme.iconColor}`} />
          </button>
          
          {/* Tabs container with horizontal scrolling */}
          <div 
            ref={tabsContainerRef}
            className="flex-1 flex overflow-x-auto no-scrollbar"
            onWheel={handleWheel}
            style={{ scrollBehavior: 'smooth' }}
          >
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`px-3 py-1 h-[30px] text-xs cursor-pointer flex items-center border-r ${theme.tabBorder} whitespace-nowrap transition-colors duration-150 ${
                  activeTab === tab.id 
                    ? `${theme.tabActiveBackground} border-t-2 ${theme.tabActiveBorder}` 
                    : `${theme.tabInactiveBackground} hover:${theme.tabHoverBackground}`
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="mr-2">{getFileIcon(tab.label)}</span>
                <span className={activeTab === tab.id ? theme.foreground : theme.descriptionForeground}>
                  {tab.label}
                  {openFiles[tab.id]?.isDirty && <span className="ml-1">•</span>}
                </span>
                <FaTimes 
                  className={`ml-2 opacity-50 hover:opacity-100 transition-opacity duration-150 ${theme.iconColor}`}
                  onClick={(e) => closeTab(e, tab.id)}
                />
              </div>
            ))}
            
            {/* Add tab button */}
            {/*
            <div 
              className={`px-3 py-1 text-xs cursor-pointer flex items-center hover:${theme.tabHoverBackground} transition-colors duration-150`}
              onClick={addTab}
            >
              <span className={`text-xs ${theme.iconColor}`}>+</span>
            </div>
            */}
          </div>
          
          {/* Right scroll button */}
          <button 
            className={`px-1 py-1 flex items-center justify-center hover:${theme.buttonHoverBackground} transition-colors duration-150`}
            onClick={() => scrollTabs('right')}
          >
            <FaChevronRight className={`text-xs ${theme.iconColor}`} />
          </button>
          
          {/* Save button and dropdown */}
          {activeTab && openFiles[activeTab] && (
            <>
              <button 
                className={`px-2 py-1 flex items-center justify-center hover:${theme.buttonHoverBackground} transition-colors duration-150`}
                onClick={handleSaveFile}
                title="Save file (Ctrl+Alt+S)"
                disabled={isSaving}
              >
                <FaRegSave className={`text-sm ${isSaving ? 'text-green-400 animate-pulse' : theme.iconColor}`} />
              </button>
              <EditorDropdown 
                theme={theme} 
                onOptionSelect={handleOptionSelect}
              />
            </>
          )}
        </div>
      )}
      
      {/* Editor area or welcome screen */}
      <div className="flex-1 overflow-hidden">
        {tabs.length > 0 ? (
          isCompareMode ? (
            <CompareEditor 
              theme={theme}
              fontSize={fontSize}
              files={compareFiles}
              onClose={() => {
                setIsCompareMode(false);
                setCompareFiles(null);
              }}
            />
          ) : (
            <Editor
              height="100%"
              language={getLanguage()}
              value={getContent()}
              onChange={handleEditorChange}
              theme={getEditorTheme()}
              options={getEditorOptions()}
              onMount={handleEditorDidMount}
              loading={
                <div className={`flex items-center justify-center h-full ${theme.editorBackground}`}>
                  <div className={`text-sm ${theme.foreground} animate-pulse`}>Loading editor...</div>
                </div>
              }
            />
          )
        ) : (
          renderWelcomeScreen()
        )}
      </div>
      
      {/* File Compare Modal */}
      {showCompareModal && (
        <FileCompareModal 
          theme={theme}
          onClose={() => setShowCompareModal(false)}
          onCompare={(files) => {
            // Ensure both files are opened and available before proceeding
            const ensureFilesAreOpen = async () => {
              try {
                if (!files || !files.original || !files.modified) {
                  console.error("Invalid file selection:", files);
                  alert("Please select both original and modified files to compare.");
                  return;
                }
                
                console.log("Opening files for comparison:", files);
                
                // Make sure the files are opened in the editor
                if (files.original && !openFiles[files.original]) {
                  console.log(`Opening original file: ${files.original}`);
                  try {
                    await dispatch(readFile(files.original)).unwrap();
                  } catch (err) {
                    console.error(`Failed to open original file: ${files.original}`, err);
                    alert(`Error opening original file: ${files.original.split('/').pop()}`);
                    return;
                  }
                }
                
                if (files.modified && !openFiles[files.modified]) {
                  console.log(`Opening modified file: ${files.modified}`);
                  try {
                    await dispatch(readFile(files.modified)).unwrap();
                  } catch (err) {
                    console.error(`Failed to open modified file: ${files.modified}`, err);
                    alert(`Error opening modified file: ${files.modified.split('/').pop()}`);
                    return;
                  }
                }
                
                // Now set the comparison files and activate compare mode
                console.log("Files are now open, proceeding with comparison");
                setCompareFiles({
                  original: files.original,
                  modified: files.modified
                });
                setIsCompareMode(true);
                setShowCompareModal(false);
              } catch (error) {
                console.error("Error ensuring files are open:", error);
                alert(`Failed to open files for comparison: ${error.message || 'Unknown error'}`);
              }
            };
            
            ensureFilesAreOpen();
          }}
        />
      )}
      
      {/* Modals */}
      {showSearchModal && (
        <SearchFilesModal
          theme={theme}
          onClose={() => setShowSearchModal(false)}
        />
      )}
      
      {showSettingsModal && (
        <EditorSettingsModal
          theme={theme}
          fontSize={editorSettings.fontSize}
          onClose={() => setShowSettingsModal(false)}
          onUpdateSettings={handleUpdateSettings}
        />
      )}
    </div>
  );
};

export default EditorComponent; 
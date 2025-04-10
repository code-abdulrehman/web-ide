import React, { useState, useEffect } from 'react';
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
  FaCircleNotch
} from 'react-icons/fa';
import { VscNewFile, VscNewFolder, VscRefresh, VscCollapseAll } from 'react-icons/vsc';
// Initial file tree data
const initialTreeData = [
  {
    id: "root",
    name: "project",
    isFolder: true,
    isOpen: true,
    children: [
      {
        id: "src",
        name: "src",
        isFolder: true,
        isOpen: true,
        children: [
          {
            id: "components",
            name: "components",
            isFolder: true,
            isOpen: true,
            children: [
              {
                id: "layout",
                name: "layout",
                isFolder: true,
                isOpen: true,
                children: [
                  { id: "app-js", name: "App.js", isFolder: false },
                  { id: "layout-js", name: "Layout.js", isFolder: false },
                  { id: "topbar-js", name: "Topbar.js", isFolder: false },
                  { id: "sidebar-js", name: "LeftSidebar.js", isFolder: false },
                  { id: "editor-js", name: "Editor.js", isFolder: false },
                  { id: "statusbar-js", name: "Statusbar.js", isFolder: false },
                ]
              }
            ]
          },
          { id: "index-js", name: "index.js", isFolder: false },
          { id: "index-css", name: "index.css", isFolder: false },
          { id: "app-js-root", name: "App.js", isFolder: false },
        ]
      },
      {
        id: "public",
        name: "public",
        isFolder: true,
        isOpen: false,
        children: [
          { id: "index-html", name: "index.html", isFolder: false },
          { id: "favicon-ico", name: "favicon.ico", isFolder: false },
        ]
      },
      { id: "package-json", name: "package.json", isFolder: false },
      { id: "package-lock-json", name: "package-lock.json", isFolder: false },
      { id: "readme-md", name: "README.md", isFolder: false },
      { id: ".env", name: ".env", isFolder: false },
      { id: "tailwind-config", name: "tailwind.config.js", isFolder: false },
    ]
  }
];

// Custom recursive file tree component
const FileTreeNode = ({ node, level = 0, theme, onToggle, onFileClick }) => {
  const isFolder = node.isFolder;
  const isOpen = node.isOpen;
  
  // Get the appropriate icon for the file type
  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return <FaJs className={theme.iconActiveColor} />;
    if (fileName.endsWith('.html')) return <FaHtml5 className="text-orange-500" />;
    if (fileName.endsWith('.css')) return <FaCss3 className="text-blue-500" />;
    if (fileName.endsWith('.md')) return <FaMarkdown className={theme.descriptionForeground} />;
    if (fileName.endsWith('.json')) return <FaFileAlt className="text-yellow-300" />;
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) return <FaCode className="text-blue-400" />;
    if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) return <FaReact className="text-blue-400" />;
    return <FaFile className={theme.iconColor} />;
  };

  // Get folder icon
  const getFolderIcon = (isOpen) => {
    return isOpen ? <FaFolderOpen className="text-yellow-300" /> : <FaFolder className="text-yellow-300" />;
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isFolder && onToggle) {
      onToggle(node.id);
    }
  };

  const handleClick = () => {
    if (isFolder) {
      onToggle(node.id);
    } else if (onFileClick) {
      onFileClick(node);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 hover:${theme.listHoverBackground} cursor-pointer rounded-sm group`}
        onClick={handleClick}
        style={{ paddingLeft: `${level * 12}px` }}
      >
        <div className="flex items-center w-full">
          {isFolder && (
            <span className={`mr-1 ${theme.iconColor}`} onClick={handleToggle}>
              {isOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
          </span>
        )}
          <span className={`mr-2 ${theme.accentColor}`}>
            {isFolder ? getFolderIcon(isOpen) : getFileIcon(node.name)}
        </span>
          <span className={`text-sm truncate ${theme.foreground}`}>{node.name}</span>
        </div>
      </div>
      
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map(childNode => (
            <FileTreeNode
              key={childNode.id}
              node={childNode}
              level={level + 1}
              theme={theme}
              onToggle={onToggle}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main component
const LeftSidebar = ({ isOpen, setIsOpen, activePanel, setActivePanel, theme, showIconsOnly = false, showContentOnly = false }) => {
  // Local state
  const [treeData, setTreeData] = useState(initialTreeData);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [contentWidth, setContentWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [searchOptions, setSearchOptions] = useState({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    includeIgnored: false,
    includePattern: '',
    excludePattern: ''
  });
  
  // Define activity bar items - centralized configuration
  const activityBarItems = [
    { id: 'explorer', icon: <FaFolder />, title: 'Explorer' },
    { id: 'search', icon: <FaSearch />, title: 'Search' },
    { id: 'git', icon: <FaGithub />, title: 'Source Control' },
    { id: 'debug', icon: <FaBug />, title: 'Run and Debug' },
    { id: 'settings', icon: <FaCog />, title: 'Settings', position: 'bottom' }
  ];

  // Map panel ID to title
  const panelTitles = {
    'explorer': 'Explorer',
    'search': 'Search',
    'git': 'Source Control',
    'debug': 'Run and Debug',
    'settings': 'Settings'
  };

  // Handle section collapsing for Explorer
  const [sections, setSections] = useState({
    openEditors: true,
    project: true,
    outline: false
  });

  const toggleSection = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Toggle folder open/closed state in the tree
  const toggleNode = (nodeId) => {
    const toggleNodeRecursive = (nodes) => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: toggleNodeRecursive(node.children) };
        }
        return node;
      });
    };
    
    setTreeData(toggleNodeRecursive(treeData));
  };

  // Handle file click
  const handleFileClick = (node) => {
    console.log('Opening file:', node.name);
    // Here you would implement file opening logic
  };

  // Simulate search functionality
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    // Simulate delay for search operation
    setTimeout(() => {
      const results = [
        { file: 'src/components/layout/Layout.js', line: 45, preview: 'const Layout = ({ theme, toggleTheme }) => {' },
        { file: 'src/App.js', line: 12, preview: 'import { ThemeProvider } from "./contexts/ThemeContext";' },
        { file: 'src/components/layout/Editor.js', line: 23, preview: 'const EditorComponent = ({ theme }) => {' }
      ];
      setSearchResults(results);
      setIsResizing(false);
    }, 800);
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

  // Render different panel contents based on activePanel
  const renderPanelContent = () => {
    switch (activePanel) {
      case 'explorer':
        return (
          <div className="h-full flex flex-col">
            <div className={`px-4 py-1 font-medium h-[31px] uppercase text-xs flex justify-between items-center border-b ${theme.tabBorder} ${theme.panelTitleForeground}`}>
              <span>Explorer</span>
              <div className="flex space-x-1">
                <button className={`p-1 rounded hover:${theme.buttonHoverBackground}`} title="New File">
                  <VscNewFile size={14} />
                </button>
                <button className={`p-1 rounded hover:${theme.buttonHoverBackground}`} title="New Folder">
                  <VscNewFolder size={14} />
                </button>
                <button className={`p-1 rounded hover:${theme.buttonHoverBackground}`} title="Refresh Explorer">
                  <VscRefresh size={14} />
                </button>
                <button className={`p-1 rounded hover:${theme.buttonHoverBackground}`} title="Collapse All">
                  <VscCollapseAll size={14} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {/* Open Editors Section */}
              <div className="mb-2">
                <div 
                  className={`flex items-center px-2 py-1 cursor-pointer hover:${theme.listHoverBackground}`}
                  onClick={() => toggleSection('openEditors')}
                >
                  <span className="mr-1 text-gray-500">
                    {sections.openEditors ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                  </span>
                  <span className="text-xs uppercase font-medium">Open Editors</span>
                </div>
                
                {sections.openEditors && (
                  <div className="pl-4 mt-1">
                    <div className={`px-2 py-1 text-sm rounded flex items-center hover:${theme.listHoverBackground}`}>
                      <FaJs className="text-yellow-400 mr-2" size={12} />
                      <span className="truncate">App.js</span>
                    </div>
                    <div className={`px-2 py-1 text-sm rounded flex items-center hover:${theme.listHoverBackground} ${theme.listActiveBackground}`}>
                      <FaJs className="text-yellow-400 mr-2" size={12} />
                      <span className="truncate">Layout.js</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Project Section */}
              <div className="px-1">                
                {sections.project && (
                  <div className="px-1 mt-1">
                    {treeData.map(node => (
                      <FileTreeNode
                        key={node.id}
                        node={node}
                        theme={theme}
                        onToggle={toggleNode}
                        onFileClick={handleFileClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className={`w-full px-3 py-2 text-sm rounded-sm ${theme.inputBackground} pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500`} 
                />
                <button 
                  className="absolute right-0 top-0 h-full px-2 flex items-center"
                  onClick={() => setShowSearchOptions(!showSearchOptions)}
                >
                  <FaEllipsisH size={12} className={theme.descriptionForeground} />
                </button>
              </div>
              
              {showSearchOptions && (
                <div className={`mt-2 p-2 rounded-sm text-xs ${theme.inputBackground} border ${theme.menuBorder}`}>
                  <div className="mb-3">
                    <h4 className={`mb-2 font-medium ${theme.foreground}`}>Filters</h4>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex-1 min-w-[140px]">
                        <div className="mb-1 flex items-center">
                          <input 
                            type="checkbox" 
                            id="case-sensitive" 
                            className={`mr-2 ${theme.accentColor}`}  
                            checked={searchOptions.caseSensitive || false}
                            onChange={(e) => setSearchOptions(prev => ({...prev, caseSensitive: e.target.checked}))}
                          />
                          <label htmlFor="case-sensitive" className={theme.foreground}>Case Sensitive</label>
                        </div>
                        <div className="mb-1 flex items-center">
                          <input 
                            type="checkbox" 
                            id="whole-word" 
                            className={`mr-2 ${theme.accentColor}`} 
                            checked={searchOptions.wholeWord || false}
                            onChange={(e) => setSearchOptions(prev => ({...prev, wholeWord: e.target.checked}))}
                          />
                          <label htmlFor="whole-word" className={theme.foreground}>Whole Word</label>
                        </div>
                      </div>
                      <div className="flex-1 min-w-[140px]">
                  <div className="mb-1 flex items-center">
                          <input 
                            type="checkbox" 
                            id="regex" 
                            className={`mr-2 ${theme.accentColor}`}  
                            checked={searchOptions.useRegex || false}
                            onChange={(e) => setSearchOptions(prev => ({...prev, useRegex: e.target.checked}))}
                          />
                          <label htmlFor="regex" className={theme.foreground}>Regular Expression</label>
                        </div>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="include-ignore" 
                            className={`mr-2 ${theme.accentColor}`}  
                            checked={searchOptions.includeIgnored || false}
                            onChange={(e) => setSearchOptions(prev => ({...prev, includeIgnored: e.target.checked}))}
                          />
                          <label htmlFor="include-ignore" className={theme.foreground}>Include Ignored Files</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <h4 className={`mb-2 font-medium ${theme.foreground}`}>Files to Include</h4>
                    <input 
                      type="text" 
                      placeholder="e.g. *.js, src/**/*.ts" 
                      className={`w-full px-2 py-1 text-xs rounded-sm ${theme.inputBackground} border ${theme.menuBorder} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      value={searchOptions.includePattern || ''}
                      onChange={(e) => setSearchOptions(prev => ({...prev, includePattern: e.target.value}))}
                    />
                  </div>
                  
                  <div className="mb-2">
                    <h4 className={`mb-2 font-medium ${theme.foreground}`}>Files to Exclude</h4>
                    <input 
                      type="text" 
                      placeholder="e.g. node_modules, *.test.js" 
                      className={`w-full px-2 py-1 text-xs rounded-sm ${theme.inputBackground} border ${theme.menuBorder} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      value={searchOptions.excludePattern || ''}
                      onChange={(e) => setSearchOptions(prev => ({...prev, excludePattern: e.target.value}))}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-3">
                    <button 
                      className={`px-2 py-1 text-xs ${theme.buttonBackground} ${theme.buttonForeground} rounded`}
                      onClick={handleSearch}
                    >
                      Search
                    </button>
                    <button 
                      className={`px-2 py-1 text-xs ${theme.secondaryButtonBackground} ${theme.secondaryButtonForeground} rounded`}
                      onClick={() => setSearchOptions({
                        caseSensitive: false,
                        wholeWord: false,
                        useRegex: false,
                        includeIgnored: false,
                        includePattern: '',
                        excludePattern: ''
                      })}
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar px-4">
              {isSearching ? (
                <div className={`text-sm my-2 ${theme.descriptionForeground} flex items-center`}>
                  <div className="animate-spin mr-2">
                    <FaCircleNotch size={14} />
                  </div>
                  Searching...
                </div>
              ) : searchTerm && searchResults.length === 0 ? (
                <div className={`text-sm my-2 ${theme.descriptionForeground}`}>
                  No results found
                </div>
              ) : (
                <div>
                  {searchResults.length > 0 && (
                    <div className={`text-xs mb-3 ${theme.descriptionForeground}`}>
                      {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
                    </div>
                  )}
                  
                  {searchResults.map((result, index) => (
                    <div key={index} className={`my-2 rounded-sm p-1 hover:${theme.listHoverBackground} cursor-pointer`}>
                      <div className={`text-sm flex items-center ${theme.foreground}`}>
                        {result.fileType === 'js' && <FaJs className="text-yellow-400 mr-2" size={12} />}
                        {result.fileType === 'css' && <FaCss3 className="text-blue-400 mr-2" size={12} />}
                        {result.fileType === 'html' && <FaHtml5 className="text-orange-400 mr-2" size={12} />}
                        {result.fileType === 'unknown' && <FaFile className={`${theme.iconColor} mr-2`} size={12} />}
                        {result.file}
                      </div>
                      <div className={`text-xs ${theme.descriptionForeground} pl-4 border-l ml-2 mt-1 ${theme.tabBorder}`}>
                        <div className="py-1">Line {result.line}: <span className={theme.foreground}>{result.preview}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
        
      case 'debug':
        return (
          <div className="h-full flex flex-col">
            <div className={`px-4 py-1 font-medium h-[31px] uppercase text-xs flex justify-between items-center border-b ${theme.tabBorder} ${theme.panelTitleForeground}`}>
              <span>Run and Debug</span>
              <div className="flex space-x-1">
                <button className={`p-1 rounded hover:${theme.buttonHoverBackground}`} title="More Actions">
                  <FaEllipsisH size={12} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="p-4 text-center">
                <div className={`text-sm ${theme.descriptionForeground}`}>No active debug session</div>
                <button className={`mt-3 px-3 py-1 text-sm ${theme.buttonBackground} ${theme.buttonForeground} rounded-sm hover:${theme.buttonHoverBackground}`}>
                  Start Debugging
                </button>
              </div>
            </div>
          </div>
        );
    
      case 'settings':
        return (
          <div className="h-full flex flex-col">
            <div className={`px-4 py-1 font-medium h-[31px] uppercase text-xs border-b ${theme.tabBorder} ${theme.panelTitleForeground}`}>Settings</div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="p-4">
                <div className={`text-sm font-medium mb-3 ${theme.foreground}`}>Commonly Used</div>
                <div className="space-y-3">
                  {[
                    { name: 'Editor: Font Size', value: '14px' },
                    { name: 'Editor: Tab Size', value: '2' },
                    { name: 'Files: Auto Save', value: 'off' },
                    { name: 'Workbench: Color Theme', value: 'Dark+' }
                  ].map((setting, i) => (
                    <div key={i} className={`p-2 rounded-sm hover:${theme.listHoverBackground}`}>
                      <div className={`text-sm ${theme.foreground}`}>{setting.name}</div>
                      <div className={`text-xs ${theme.descriptionForeground}`}>
                        {setting.value}
                      </div>
                    </div>
                  ))}
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

  // If we're only showing icons (the activity bar)
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

  // If we're only showing the content panel
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
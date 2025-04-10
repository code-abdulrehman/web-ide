import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes, FaFile, FaFolder, FaCode } from 'react-icons/fa';

const GlobalSearch = ({ theme, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const inputRef = useRef(null);
  
  // Mock search results
  const mockResults = [
    { id: 1, type: 'file', name: 'index.js', path: '/src/index.js' },
    { id: 2, type: 'file', name: 'App.js', path: '/src/App.js' },
    { id: 3, type: 'file', name: 'Layout.js', path: '/src/components/layout/Layout.js' },
    { id: 4, type: 'folder', name: 'components', path: '/src/components' },
    { id: 5, type: 'file', name: 'Topbar.js', path: '/src/components/layout/Topbar.js' },
    { id: 6, type: 'file', name: 'LeftSidebar.js', path: '/src/components/layout/LeftSidebar.js' },
    { id: 7, type: 'file', name: 'package.json', path: '/package.json' },
    { id: 8, type: 'file', name: 'tailwind.config.js', path: '/tailwind.config.js' },
    { id: 9, type: 'symbol', name: 'Layout', path: '/src/components/layout/Layout.js:10' },
    { id: 10, type: 'symbol', name: 'toggleTheme', path: '/src/App.js:25' },
  ];
  
  useEffect(() => {
    // Focus the input when the component mounts
    inputRef.current?.focus();
    
    // Close on escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  useEffect(() => {
    // Filter results based on search term
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    const filtered = mockResults.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSearchResults(filtered);
  }, [searchTerm]);
  
  const getIconForType = (type) => {
    switch (type) {
      case 'file': return <FaFile />;
      case 'folder': return <FaFolder />;
      case 'symbol': return <FaCode />;
      default: return <FaFile />;
    }
  };
  
  const handleResultClick = (result) => {
    console.log('Selected:', result);
    // Here you would navigate to the file or open it
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div 
        className={`w-full max-w-2xl rounded-lg shadow-2xl ${theme.background} overflow-hidden`}
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {/* Search input */}
        <div className={`flex items-center p-3 border-b ${theme.inputBackground}`}>
          <FaSearch className={`mr-3 ${theme.foreground}`} />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files, symbols (Ctrl+P)"
            className={`flex-1 bg-transparent outline-none ${theme.foreground}`}
          />
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <FaTimes className={theme.foreground} />
          </button>
        </div>
        
        {/* Search results */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {searchResults.length > 0 ? (
            <ul>
              {searchResults.map((result) => (
                <li 
                  key={result.id} 
                  className={`px-4 py-2 flex items-center cursor-pointer hover:${theme.listItemHoverBackground}`}
                  onClick={() => handleResultClick(result)}
                >
                  <span className={`text-sm mr-3 ${theme.foreground}`}>
                    {getIconForType(result.type)}
                  </span>
                  <span className={`${theme.foreground} flex-1`}>{result.name}</span>
                  <span className={`text-xs ${theme.descriptionForeground}`}>{result.path}</span>
                </li>
              ))}
            </ul>
          ) : searchTerm.trim() ? (
            <div className={`p-4 text-center ${theme.descriptionForeground}`}>
              No results found
            </div>
          ) : null}
        </div>
        
        {/* Keyboard shortcut help */}
        <div className={`px-4 py-2 text-xs border-t ${theme.statusBarBackground} ${theme.statusBarForeground}`}>
          <div className="flex justify-between">
            <span>Enter to open</span>
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch; 
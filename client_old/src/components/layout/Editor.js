import React, { useState, useRef, useEffect } from 'react';
import { 
  FaCode, 
  FaTimes, 
  FaJs, 
  FaCss3, 
  FaHtml5, 
  FaReact, 
  FaFile,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import Editor from '@monaco-editor/react';

const EditorComponent = ({ theme, fontSize = 14 }) => {
  // State for tabs and active file
  const [tabs, setTabs] = useState([
    { id: 'index.js', label: 'index.js', language: 'javascript', content: getInitialContent('index.js') },
    { id: 'app.js', label: 'App.js', language: 'javascript', content: getInitialContent('app.js') },
    { id: 'styles.css', label: 'styles.css', language: 'css', content: getInitialContent('styles.css') },
  ]);
  const [activeTab, setActiveTab] = useState('index.js');
  
  // Ref for tab container to handle scrolling
  const tabsContainerRef = useRef(null);
  
  // Get file content based on type
  function getInitialContent(filename) {
    if (filename.includes('index.js')) {
      return `import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();`;
    } else if (filename.includes('App.js')) {
      return `import React, { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import { themes } from './themes/themes';
import ThemeService from './themes/ThemeService';

function App() {
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [themeObj, setThemeObj] = useState(themes.dark);
  
  useEffect(() => {
    // Initialize the theme on load
    const tailwindTheme = ThemeService.getCurrentTailwindTheme();
    setThemeObj(tailwindTheme);
    
    // Apply the VSCode theme CSS variables
    ThemeService.applyTheme();
  }, []);
  
  const toggleTheme = () => {
    // Toggle the theme using the service
    ThemeService.toggleTheme();
    
    // Apply the new theme
    ThemeService.applyTheme();
    
    // Update the Tailwind theme object
    setThemeObj(ThemeService.getCurrentTailwindTheme());
  };
  
  return (
    <div className="min-h-screen">
      <Layout theme={themeObj} toggleTheme={toggleTheme} />
    </div>
  );
}

export default App;`;
    } else if (filename.includes('styles.css')) {
      return `/* Base styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

/* Theme-specific styles */
.theme-dark {
  color: #d4d4d4;
  background-color: #1e1e1e;
}

.theme-light {
  color: #333333;
  background-color: #ffffff;
}`;
    }
    
    return '// New file';
  }
  
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
    
    if (tabs.length > 1) {
      const newTabs = tabs.filter(tab => tab.id !== tabId);
      setTabs(newTabs);
      
      // If the active tab is being closed, activate another tab
      if (activeTab === tabId) {
        setActiveTab(newTabs[0].id);
      }
    }
  };
  
  // Get the appropriate icon for file type
  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) 
      return <FaJs className="text-yellow-400" />;
    if (fileName.endsWith('.css')) 
      return <FaCss3 className="text-blue-500" />;
    if (fileName.endsWith('.html')) 
      return <FaHtml5 className="text-orange-500" />;
    if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) 
      return <FaReact className="text-blue-400" />;
    return <FaFile className={theme.iconColor} />;
  };
  
  // Handle content change
  const handleEditorChange = (value) => {
    setTabs(tabs.map(tab => 
      tab.id === activeTab 
        ? { ...tab, content: value } 
        : tab
    ));
  };
  
  // Get the active tab's language
  const getLanguage = () => {
    const tab = tabs.find(tab => tab.id === activeTab);
    if (!tab) return 'javascript';
    
    if (tab.label.endsWith('.js') || tab.label.endsWith('.jsx')) return 'javascript';
    if (tab.label.endsWith('.css')) return 'css';
    if (tab.label.endsWith('.html')) return 'html';
    if (tab.label.endsWith('.json')) return 'json';
    if (tab.label.endsWith('.md')) return 'markdown';
    
    return 'javascript';
  };
  
  // Get the active tab's content
  const getContent = () => {
    const tab = tabs.find(tab => tab.id === activeTab);
    return tab ? tab.content : '';
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
  
  // Get Monaco Editor options for theme
  const getEditorOptions = () => {
    return {
      fontSize: fontSize,
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
  
  return (
    <div className={`flex flex-col h-full flex-1 ${theme.editorBackground}`}>
      {/* Tabs header */}
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
              </span>
              <FaTimes 
                className={`ml-2 opacity-50 hover:opacity-100 transition-opacity duration-150 ${theme.iconColor}`}
                onClick={(e) => closeTab(e, tab.id)}
              />
            </div>
          ))}
          
          {/* Add tab button */}
          <div 
            className={`px-3 py-1 text-xs cursor-pointer flex items-center hover:${theme.tabHoverBackground} transition-colors duration-150`}
            onClick={addTab}
          >
            <span className={`text-xs ${theme.iconColor}`}>+</span>
          </div>
        </div>
        
        {/* Right scroll button */}
        <button 
          className={`px-1 py-1 flex items-center justify-center hover:${theme.buttonHoverBackground} transition-colors duration-150`}
          onClick={() => scrollTabs('right')}
        >
          <FaChevronRight className={`text-xs ${theme.iconColor}`} />
        </button>
      </div>
      
      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={getLanguage()}
          value={getContent()}
          onChange={handleEditorChange}
          theme={getEditorTheme()}
          options={getEditorOptions()}
          loading={
            <div className={`flex items-center justify-center h-full ${theme.editorBackground}`}>
              <div className={`text-sm ${theme.foreground} animate-pulse`}>Loading editor...</div>
            </div>
          }
          beforeMount={(monaco) => {
            // You can customize Monaco before it mounts here
          }}
        />
      </div>
    </div>
  );
};

export default EditorComponent; 
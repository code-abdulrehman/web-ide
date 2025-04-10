import React, { useState, useEffect, createContext } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import Layout from './components/layout/Layout';
import SettingsModal from './components/modals/SettingsModal';
import { themes } from './themes/themes';
import ThemeService from './themes/ThemeService';

// Create theme context for global access
export const ThemeContext = createContext({
  currentTheme: 'dark',
  themeObj: null,
  toggleTheme: () => {},
  fontSize: 14,
  setFontSize: () => {},
  showSettings: () => {},
  activeTerminalTab: 'terminal',
  isTerminalOpen: false,
  showTerminal: () => {}
});

function App() {
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [themeObj, setThemeObj] = useState(themes.dark);
  const [fontSize, setFontSize] = useState(14);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTerminalTab, setActiveTerminalTab] = useState('terminal');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  
  useEffect(() => {
    // Initialize the theme on load
    const tailwindTheme = ThemeService.getCurrentTailwindTheme();
    setThemeObj(tailwindTheme);
    
    // Apply the VSCode theme CSS variables
    ThemeService.applyTheme();
    
    // Load font size from local storage if available
    const savedFontSize = localStorage.getItem('editor-font-size');
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize, 10));
    }
    
    // Load sidebar states from localStorage
    const savedLeftSidebar = localStorage.getItem('leftSidebarOpen');
    if (savedLeftSidebar) {
      setLeftSidebarOpen(savedLeftSidebar === 'true');
    }
    
    const savedRightSidebar = localStorage.getItem('rightSidebarOpen');
    if (savedRightSidebar) {
      setRightSidebarOpen(savedRightSidebar === 'true');
    }
    
    // Load terminal state from localStorage
    const savedTerminalOpen = localStorage.getItem('terminalOpen');
    if (savedTerminalOpen) {
      setIsTerminalOpen(savedTerminalOpen === 'true');
    }
  }, []);
  
  // Save sidebar and terminal states when they change
  useEffect(() => {
    localStorage.setItem('leftSidebarOpen', leftSidebarOpen.toString());
    localStorage.setItem('rightSidebarOpen', rightSidebarOpen.toString());
    localStorage.setItem('terminalOpen', isTerminalOpen.toString());
  }, [leftSidebarOpen, rightSidebarOpen, isTerminalOpen]);
  
  const toggleTheme = () => {
    // Toggle the theme using the service
    ThemeService.toggleTheme();
    
    // Apply the new theme
    ThemeService.applyTheme();
    
    // Update the Tailwind theme object
    setThemeObj(ThemeService.getCurrentTailwindTheme());
  };
  
  const changeTheme = (themeId) => {
    // Set the theme directly
    ThemeService.setTheme(themeId.endsWith('-plus') ? themeId : `${themeId}-plus`);
    
    // Apply the new theme
    ThemeService.applyTheme();
    
    // Update the Tailwind theme object
    setThemeObj(ThemeService.getCurrentTailwindTheme());
  };
  
  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize);
    localStorage.setItem('editor-font-size', newSize.toString());
  };
  
  const showSettings = () => {
    setIsSettingsOpen(true);
  };
  
  const showTerminal = (tabId = 'terminal') => {
    setIsTerminalOpen(true);
    setActiveTerminalTab(tabId);
  };
  
  const toggleLeftSidebar = () => {
    setLeftSidebarOpen(prev => !prev);
  };
  
  const toggleRightSidebar = () => {
    setRightSidebarOpen(prev => !prev);
  };
  
  // Register global keyboard shortcuts
  useHotkeys('ctrl+k ctrl+t', (e) => {
    e.preventDefault();
    toggleTheme();
  });
  
  useHotkeys('ctrl+,', (e) => {
    e.preventDefault();
    showSettings();
  });
  
  // Terminal tab shortcuts
  useHotkeys('ctrl+`', (e) => {
    e.preventDefault();
    showTerminal('terminal');
  });
  
  useHotkeys('ctrl+shift+m', (e) => {
    e.preventDefault();
    showTerminal('problems');
  });
  
  useHotkeys('ctrl+shift+u', (e) => {
    e.preventDefault();
    showTerminal('output');
  });
  
  useHotkeys('ctrl+shift+y', (e) => {
    e.preventDefault();
    showTerminal('debug');
  });
  
  useHotkeys('ctrl+shift+o', (e) => {
    e.preventDefault();
    showTerminal('outline');
  });

  // Sidebar shortcuts
  useHotkeys('ctrl+b', (e) => {
    e.preventDefault();
    toggleLeftSidebar();
  });

  // Create theme context value
  const themeContextValue = {
    currentTheme,
    themeObj,
    toggleTheme,
    fontSize,
    setFontSize: handleFontSizeChange,
    showSettings,
    activeTerminalTab,
    isTerminalOpen,
    showTerminal
  };
  
  return (
    <ThemeContext.Provider value={themeContextValue}>
      <div className="min-h-screen">
        <Layout 
          theme={themeObj} 
          toggleTheme={toggleTheme} 
          fontSize={fontSize}
          showSettings={showSettings}
          activeTerminalTab={activeTerminalTab}
          isTerminalOpen={isTerminalOpen}
          setIsTerminalOpen={setIsTerminalOpen}
          setActiveTerminalTab={setActiveTerminalTab}
          leftSidebarOpen={leftSidebarOpen}
          setLeftSidebarOpen={setLeftSidebarOpen}
          rightSidebarOpen={rightSidebarOpen}
          setRightSidebarOpen={setRightSidebarOpen}
          toggleLeftSidebar={toggleLeftSidebar}
          toggleRightSidebar={toggleRightSidebar}
        />
        
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          theme={themeObj}
          onThemeChange={changeTheme}
          onFontSizeChange={handleFontSizeChange}
        />
      </div>
    </ThemeContext.Provider>
  );
}

export default App;

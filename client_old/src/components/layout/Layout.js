import React, { useState, useCallback, useEffect, useRef } from 'react';
import {  
  FaTerminal as FaTerminalIcon, 
  FaSearch
} from 'react-icons/fa';
import { 
  VscLayoutSidebarLeft, 
  VscLayoutSidebarLeftOff,
  VscLayoutSidebarRight,
  VscLayoutSidebarRightOff 
} from "react-icons/vsc";
import { 
  BiDockBottom, 
  BiSolidDockBottom 
} from "react-icons/bi";

import Topbar from './Topbar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import Terminal from './Terminal';
import Chatbot from './Chatbot';
import Statusbar from './Statusbar';
import EditorComponent from './Editor';
import GlobalSearch from './GlobalSearch';

// Layout constants
const DEFAULT_LEFT_WIDTH = 240;
const DEFAULT_RIGHT_WIDTH = 320;
const MIN_RIGHT_WIDTH = 300;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 450;
const ACTIVITY_BAR_WIDTH = 48;
const MIN_TERMINAL_HEIGHT = 80;
const MAX_TERMINAL_HEIGHT = 800;
const DEFAULT_TERMINAL_HEIGHT = 280;

const Layout = ({ 
  theme, 
  toggleTheme, 
  fontSize, 
  showSettings,
  activeTerminalTab,
  isTerminalOpen,
  setIsTerminalOpen,
  setActiveTerminalTab,
  leftSidebarOpen,
  setLeftSidebarOpen,
  rightSidebarOpen,
  setRightSidebarOpen,
  toggleLeftSidebar,
  toggleRightSidebar
}) => {
  // Container ref
  const containerRef = useRef(null);
  
  // Get layout settings from localStorage or use defaults
  const getLayoutSettings = () => {
    const savedSettings = localStorage.getItem('layoutSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Error parsing layout settings:', e);
        return {};
      }
    }
    return {};
  };
  
  const layoutSettings = getLayoutSettings();
  
  // States for sizes
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(
    layoutSettings.leftSidebarWidth || DEFAULT_LEFT_WIDTH
  );
  const [rightSidebarWidth, setRightSidebarWidth] = useState(
    layoutSettings.rightSidebarWidth || DEFAULT_RIGHT_WIDTH
  );
  const [terminalHeight, setTerminalHeight] = useState(
    layoutSettings.terminalHeight || DEFAULT_TERMINAL_HEIGHT
  );

  // UI states
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [activeLeftPanel, setActiveLeftPanel] = useState('explorer');
  const [isTerminalResizing, setIsTerminalResizing] = useState(false);
  
  // Save preferences to localStorage whenever they change
  useEffect(() => {
    const settings = {
      leftSidebarWidth,
      rightSidebarWidth,
      terminalHeight,
      leftSidebarOpen,
      rightSidebarOpen,
      terminalOpen: isTerminalOpen
    };
    
    localStorage.setItem('layoutSettings', JSON.stringify(settings));
  }, [leftSidebarWidth, rightSidebarWidth, terminalHeight, leftSidebarOpen, rightSidebarOpen, isTerminalOpen]);
  
  // Handle global search
  const toggleGlobalSearch = useCallback(() => {
    setGlobalSearchOpen(prev => !prev);
  }, []);

  // Handle terminal resizing
  const startTerminalResize = useCallback((e) => {
    e.preventDefault();
    setIsTerminalResizing(true);
    
    const startY = e.clientY;
    const startHeight = terminalHeight;
    
    const handleMouseMove = (moveEvent) => {
      // Prevent defaults to avoid text selection during resize
      moveEvent.preventDefault();
      
      // Calculate the change in height
      const delta = startY - moveEvent.clientY;
      
      // Only resize if movement is significant (prevents tiny accidental movements)
      if (Math.abs(delta) >= 2) {
        const newHeight = Math.max(MIN_TERMINAL_HEIGHT, Math.min(MAX_TERMINAL_HEIGHT, startHeight + delta));
        setTerminalHeight(newHeight);
      }
    };
    
    const handleMouseUp = () => {
      setIsTerminalResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Attach events to document to handle mouse movements outside the terminal
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
  }, [terminalHeight]);

  // Handle left sidebar width change
  const handleLeftSidebarWidthChange = useCallback((newWidth) => {
    setLeftSidebarWidth(newWidth);
  }, []);

  // Handle right sidebar width change
  const handleRightSidebarWidthChange = useCallback((newWidth) => {
    setRightSidebarWidth(newWidth);
  }, []);

  // Function to set the active terminal tab
  const handleTerminalTabChange = useCallback((tabId) => {
    if (setActiveTerminalTab && activeTerminalTab !== tabId) {
      setActiveTerminalTab(tabId);
    }
  }, [activeTerminalTab, setActiveTerminalTab]);

  return (
    <div className={`flex flex-col h-screen ${theme.background}`}>
      {/* Top toolbar */}
      <Topbar 
        theme={theme} 
        toggleTheme={toggleTheme} 
        toggleGlobalSearch={toggleGlobalSearch}
        toggleLeftSidebar={toggleLeftSidebar}
        toggleRightSidebar={toggleRightSidebar}
        toggleTerminal={() => setIsTerminalOpen(prev => !prev)}
        showSettings={showSettings}
        leftSidebarOpen={leftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
        terminalOpen={isTerminalOpen}
        setLeftSidebarOpen={setLeftSidebarOpen}
        setRightSidebarOpen={setRightSidebarOpen}
        setTerminalOpen={setIsTerminalOpen}
      />
      
      {/* Global search overlay */}
      {globalSearchOpen && (
        <GlobalSearch 
          theme={theme} 
          onClose={() => setGlobalSearchOpen(false)} 
        />
      )}
      
      {/* Action buttons for mobile/responsive view - shown on small screens */}
      <div className={`flex md:hidden items-center justify-between p-1 ${theme.statusBarBackground}`}>
        <div className="flex space-x-2">
          <button 
            className={`p-1 rounded ${leftSidebarOpen ? theme.statusBarItemActiveBackground : ''}`}
            onClick={toggleLeftSidebar}
            title="Toggle Explorer"
          >
            {leftSidebarOpen ? <VscLayoutSidebarLeft className={theme.statusBarForeground} /> : 
                              <VscLayoutSidebarLeftOff className={theme.statusBarForeground} />}
          </button>
          
          <button 
            className={`p-1 rounded ${isTerminalOpen ? theme.statusBarItemActiveBackground : ''}`}
            onClick={() => setIsTerminalOpen(prev => !prev)}
            title="Toggle Terminal"
          >
            {isTerminalOpen ? <BiSolidDockBottom className={theme.statusBarForeground} /> : 
                             <BiDockBottom className={theme.statusBarForeground} />}
          </button>
          
          <button 
            className={`p-1 rounded ${rightSidebarOpen ? theme.statusBarItemActiveBackground : ''}`}
            onClick={toggleRightSidebar}
            title="Toggle Right Sidebar"
          >
            {rightSidebarOpen ? <VscLayoutSidebarRight className={theme.statusBarForeground} /> : 
                               <VscLayoutSidebarRightOff className={theme.statusBarForeground} />}
          </button>
          
          <button 
            className={`p-1 rounded ${globalSearchOpen ? theme.statusBarItemActiveBackground : ''}`}
            onClick={toggleGlobalSearch}
            title="Global Search"
          >
            <FaSearch className={theme.statusBarForeground} />
          </button>
        </div>
      </div>
      
      {/* Main content area with clean layout */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden flex flex-col"
      >
        {/* Overlay that appears during terminal resize */}
        {isTerminalResizing && (
          <div className="absolute inset-0 z-10 bg-black bg-opacity-10 cursor-ns-resize" />
        )}
        
        <div className="flex-1 overflow-hidden flex">
          {/* Left sidebar with activity bar */}
          <LeftSidebar 
            isOpen={leftSidebarOpen}
            setIsOpen={setLeftSidebarOpen}
            activePanel={activeLeftPanel}
            setActivePanel={setActiveLeftPanel}
            theme={theme}
            width={leftSidebarWidth}
            onWidthChange={handleLeftSidebarWidthChange}
          />
          
          {/* Main content area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Editor */}
            <div 
              className="flex-1 overflow-hidden" 
              style={{ 
                height: isTerminalOpen ? `calc(100% - ${terminalHeight}px)` : '100%' 
              }}
            >
              <EditorComponent theme={theme} fontSize={fontSize} />
            </div>
              
            {/* Terminal section */}
            {isTerminalOpen && (
              <div className="flex flex-col flex-shrink-0 relative"   
              style={{ 
                height: `${terminalHeight}px`,
                minHeight: `${MIN_TERMINAL_HEIGHT}px`,
                maxHeight: `${MAX_TERMINAL_HEIGHT}px`,
                marginTop: '2px', // offset for the resize handle
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Resize handle indicator */}
                <div 
                  className={`border-t w-full cursor-ns-resize hover:border-blue-500 hover:opacity-80 active:bg-blue-600 active:opacity-100 absolute top-0 z-20 ${isTerminalResizing ? 'border-blue-500' : 'border-gray-700'}`}
                  onMouseDown={startTerminalResize}
                  title="Drag to resize terminal"
                ></div>
                
                {/* Terminal content */}
                <div
                  className="overflow-hidden h-full"
                >
                  <Terminal 
                    theme={theme} 
                    isVisible={isTerminalOpen} 
                    activeTab={activeTerminalTab}
                    setActiveTab={handleTerminalTabChange}
                    inSidebar={false}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Right sidebar */}
          {rightSidebarOpen && (
            <RightSidebar 
              isOpen={rightSidebarOpen} 
              setIsOpen={setRightSidebarOpen}
              theme={theme}
              width={rightSidebarWidth}
              onWidthChange={handleRightSidebarWidthChange}
              minWidth={MIN_RIGHT_WIDTH}
            />
          )}
        </div>
      </div>
      
      {/* Status bar */}
      <Statusbar 
        theme={theme} 
        toggleTheme={toggleTheme}
        toggleGlobalSearch={toggleGlobalSearch}
        terminalOpen={isTerminalOpen}
        setTerminalOpen={setIsTerminalOpen}
        leftSidebarOpen={leftSidebarOpen}
        setLeftSidebarOpen={setLeftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
        setRightSidebarOpen={setRightSidebarOpen}
      />
    </div>
  );
};

export default Layout; 
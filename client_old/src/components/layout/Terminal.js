import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { 
  FaTerminal, 
  FaTimes, 
  FaPlus, 
  FaBug, 
  FaList, 
  FaExclamationTriangle, 
  FaInfoCircle,
  FaTrash
} from 'react-icons/fa';
import { Terminal as XTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

// Memoized terminal history item to reduce re-renders
const TerminalHistoryItem = memo(({ content, isPrompt, className }) => (
  <div className={className}>
    {content}
  </div>
));

// Simple Terminal component
const Terminal = ({ 
  theme, 
  isVisible, 
  activeTab: initialActiveTab = 'terminal', 
  setActiveTab: externalSetActiveTab,
  inSidebar = false
}) => {
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [terminals, setTerminals] = useState([
    { id: 1, name: 'bash', history: ['Welcome to Web IDE Terminal', '> '], input: '' }
  ]);
  
  const [activeTerminal, setActiveTerminal] = useState(1);
  const [problems] = useState([
    { id: 1, type: 'error', message: 'Expected \';\' at line 42', file: 'src/components/App.js', line: 42, column: 24 },
    { id: 2, type: 'warning', message: 'Unused variable \'temp\'', file: 'src/utils/helpers.js', line: 15, column: 10 }
  ]);
  const [filterProblems, setFilterProblems] = useState('all');
  
  const terminalRef = useRef(null);
  const termInstanceRef = useRef(null);
  const prevInitialActiveTabRef = useRef(initialActiveTab);
  
  // Handle Tab Changes
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    if (typeof externalSetActiveTab === 'function') {
      externalSetActiveTab(tabId);
    }
  }, [externalSetActiveTab]);
  
  // Update local state when external state changes
  useEffect(() => {
    if (prevInitialActiveTabRef.current !== initialActiveTab) {
      setActiveTab(initialActiveTab);
      prevInitialActiveTabRef.current = initialActiveTab;
    }
  }, [initialActiveTab]);
  
  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Need to make sure the terminal element is visible and has dimensions
    const initializeTerminal = () => {
      // Initialize XTerm.js
      const term = new XTerminal({
        cursorBlink: true,
        theme: {
          background: theme.terminalBackground || '#1e1e1e',
          foreground: theme.terminalForeground || '#ffffff',
        },
        fontFamily: 'monospace',
        fontSize: 14,
        rows: 24,
        cols: 80,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      
      // Open the terminal in the container
      term.open(terminalRef.current);
      
      // Wait for a moment before fitting to ensure the DOM is ready
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          console.error("Error fitting terminal:", e);
        }
      }, 100);
      
      termInstanceRef.current = term;

      // Display welcome message
      term.writeln('Welcome to Web IDE Terminal');
      term.writeln('Type commands and press Enter to see simulated responses.');
      term.writeln('');
      
      // Handle user input in terminal
      term.onData((data) => {
        // Process terminal input
        if (data === '\r') {
          // Process the current line when Enter is pressed
          const currentLine = term.buffer.active.getLine(term.buffer.active.cursorY)?.translateToString();
          
          // Move to new line
          term.writeln('');
          
          // Simple command simulation
          if (currentLine.includes('mkdir')) {
            term.writeln(`root@web-ide:~# ${currentLine.split(' ')[1]}`);
            console.log(`Created directory: ${currentLine.split(' ')[1]}`);
          } else if (currentLine.includes('ls')) {
            term.writeln('README.md    package.json    node_modules/    src/    public/');
            console.log('README.md    package.json    node_modules/    src/    public/');
          } else if (currentLine.includes('cd')) {
            term.writeln(`root@web-ide:~# ${currentLine.split(' ')[1]}`);
            console.log(`Changed directory to: ${currentLine.split(' ')[1]}`);
          } else if (currentLine.includes('clear')) {
            term.clear();
            console.log('Cleared terminal');
          } else if (currentLine.trim() !== '') {
            term.writeln(`root@web-ide:~# ${currentLine.trim()}`);
            console.log(`root@web-ide:~# ${currentLine.trim()}`);
          }
          
          // Show prompt
          term.write('root@web-ide:~# ');
        } else {
          // Echo character input
          term.write(data);
        }
      });

      // Initial prompt
      term.write('root@web-ide:~# ');
    };
    
    // Initialize with a slight delay to ensure DOM is ready
    setTimeout(initializeTerminal, 0);

    // Clean up on unmount
    return () => {
      if (termInstanceRef.current) {
        termInstanceRef.current.dispose();
      }
    };
  }, [theme.terminalBackground, theme.terminalForeground, isVisible, activeTab]);

  // Handle resize events
  useEffect(() => {
    const handleResize = () => {
      if (termInstanceRef.current && terminalRef.current) {
        try {
          const fitAddon = new FitAddon();
          termInstanceRef.current.loadAddon(fitAddon);
          fitAddon.fit();
        } catch (e) {
          console.error("Error fitting terminal on resize:", e);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Clear the terminal
  const clearTerminal = () => {
    if (termInstanceRef.current) {
      termInstanceRef.current.clear();
      termInstanceRef.current.write('$ ');
    }
  };

  // Render the terminal tabs
  const renderTerminalTabs = () => {
    return (
      <div className={`flex border-b ${theme.tabBorder} ${theme.terminalHeaderBackground}`}>
        {terminals.map((term) => (
          <div
            key={term.id}
            className={`flex items-center px-3 py-1 text-sm cursor-pointer border-r ${theme.tabBorder} ${
              activeTerminal === term.id ? theme.tabActiveBackground : theme.tabInactiveBackground
            }`}
            onClick={() => setActiveTerminal(term.id)}
          >
            <FaTerminal className={activeTerminal === term.id ? theme.iconActiveColor : theme.iconColor} size={12} />
            <span className={`ml-2 ${theme.foreground}`}>{term.name}</span>
          </div>
        ))}
        
        <div className="ml-auto">
          <button 
            className={`px-2 py-1 hover:${theme.buttonHoverBackground}`} 
            title="Clear Terminal"
            onClick={clearTerminal}
          >
            <FaTrash className={theme.iconColor} size={12} />
          </button>
        </div>
      </div>
    );
  };

  // Render the terminal content
  const renderTerminalContent = () => {
    return (
      <div className={`flex-1 flex flex-col justify-between overflow-hidden`} style={{ minHeight: '200px' }}>
        <div 
          ref={terminalRef} 
          className={`flex-1 overflow-hidden font-mono ${theme.terminalBackground}`}
          style={{ height: '100%', width: '100%', minHeight: '200px' }}
        />
      </div>
    );
  };

  // Render the main tabs 
  const renderMainTabs = () => {
    const tabs = [
      { id: 'terminal', label: 'Terminal', icon: <FaTerminal size={12} /> },
      { id: 'problems', label: 'Problems', icon: <FaExclamationTriangle size={12} /> },
      { id: 'output', label: 'Output', icon: <FaList size={12} /> }
    ];
    
    return (
      <div className={`flex border-b ${theme.tabBorder}`}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`px-3 py-1 text-sm cursor-pointer flex items-center border-r ${theme.tabBorder} ${
              activeTab === tab.id ? theme.tabActiveBackground : theme.tabInactiveBackground
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className={activeTab === tab.id ? theme.iconActiveColor : theme.iconColor}>{tab.icon}</span>
            <span className={`ml-2 ${theme.foreground}`}>{tab.label}</span>
          </div>
        ))}
      </div>
    );
  };

  // Render problems content
  const renderProblems = () => {
    const filteredProblems = filterProblems === 'all' 
      ? problems 
      : problems.filter(p => p.type === filterProblems);
      
    return (
      <div className="flex-1 flex flex-col">
        <div className={`flex p-2 border-b ${theme.tabBorder}`}>
          <button 
            className={`px-2 py-1 text-xs rounded-sm mr-1 ${filterProblems === 'all' ? theme.buttonBackground : ''}`}
            onClick={() => setFilterProblems('all')}
          >
            All
          </button>
          <button 
            className={`px-2 py-1 text-xs rounded-sm mr-1 ${filterProblems === 'error' ? theme.buttonBackground : ''}`}
            onClick={() => setFilterProblems('error')}
          >
            Errors
          </button>
          <button 
            className={`px-2 py-1 text-xs rounded-sm mr-1 ${filterProblems === 'warning' ? theme.buttonBackground : ''}`}
            onClick={() => setFilterProblems('warning')}
          >
            Warnings
          </button>
        </div>
        
        <div className={`flex-1 overflow-y-auto ${theme.sidebarBackground}`}>
          {filteredProblems.length === 0 ? (
            <div className={`p-4 text-center ${theme.descriptionForeground}`}>
              No problems found
            </div>
          ) : (
            filteredProblems.map(problem => (
              <div 
                key={problem.id} 
                className={`p-2 border-b ${theme.tabBorder} hover:${theme.listHoverBackground}`}
              >
                <div className="flex items-start">
                  <span className="mt-0.5 mr-2">
                    {problem.type === 'error' ? 
                      <FaExclamationTriangle className="text-red-500" /> : 
                      <FaExclamationTriangle className="text-yellow-500" />
                    }
                  </span>
                  <div>
                    <div className={theme.foreground}>{problem.message}</div>
                    <div className={`text-xs ${theme.descriptionForeground}`}>
                      {problem.file}:{problem.line}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Render output content
  const renderOutput = () => {
    return (
      <div className={`flex-1 p-4 font-mono text-sm overflow-y-auto ${theme.terminalBackground}`}>
        <div className={theme.terminalTextColor}>
          [10:45:32] Starting compilation...
          <br />
          [10:45:34] Compilation completed successfully.
        </div>
      </div>
    );
  };

  // Main tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'terminal':
        return renderTerminalContent();
      case 'problems':
        return renderProblems();
      case 'output':
        return renderOutput();
      default:
        return <div className={`p-4 ${theme.foreground}`}>Unknown tab</div>;
    }
  };

  if (!isVisible) return null;
  
  return (
    <div className={`flex flex-col h-full overflow-hidden ${theme.terminalBackground}`} style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Main tab selection */}
      {renderMainTabs()}
      
      {/* Terminal tabs - only shown when in terminal tab */}
      {activeTab === 'terminal' && renderTerminalTabs()}
      
      {/* Tab content with flex-grow to fill available space */}
      <div className="flex-1 overflow-auto flex flex-col" style={{ flexGrow: 1, minHeight: 0 }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Terminal; 
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

// Memoized terminal history item to reduce re-renders
const TerminalHistoryItem = memo(({ content, isPrompt, className }) => (
  <div className={className}>
    {content}
  </div>
));

// Optimized Terminal component
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
  
  const terminalInputRef = useRef(null);
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
  
  // Focus terminal input when visible
  useEffect(() => {
    if (isVisible && activeTab === 'terminal' && terminalInputRef.current) {
      terminalInputRef.current.focus();
    }
  }, [isVisible, activeTab, activeTerminal]);

  // Handle terminal input change
  const handleTerminalInput = (e, terminalId) => {
    const updatedTerminals = terminals.map(term => {
      if (term.id === terminalId) {
        return { ...term, input: e.target.value };
      }
      return term;
    });
    setTerminals(updatedTerminals);
  };

  // Handle terminal command submission
  const handleTerminalSubmit = (e, terminalId) => {
    e.preventDefault();
    
    const terminal = terminals.find(t => t.id === terminalId);
    if (!terminal || !terminal.input.trim()) return;

    const command = terminal.input.trim();
    let response = 'Command executed';
    
    // Simple command handling
    if (command === 'clear') {
      setTerminals(prevTerminals => 
        prevTerminals.map(term => 
          term.id === terminalId 
            ? { ...term, history: ['Terminal cleared', '> '], input: '' }
            : term
        )
      );
      return;
    } else if (command === 'help') {
      response = 'Available commands: help, clear, ls, cd';
    } else if (command === 'ls') {
      response = 'README.md    package.json    node_modules/    src/    public/';
    } else if (command.startsWith('cd ')) {
      response = `Changed directory to ${command.substring(3)}`;
    }
    
    // Update terminal history
    const updatedHistory = [...terminal.history.slice(0, -1), `> ${command}`, response, '> '];
    setTerminals(prevTerminals => 
      prevTerminals.map(term => 
        term.id === terminalId 
          ? { ...term, history: updatedHistory, input: '' }
          : term
      )
    );
  };

  // Add a new terminal
  const addNewTerminal = () => {
    const newId = terminals.length > 0 ? Math.max(...terminals.map(t => t.id)) + 1 : 1;
    setTerminals([...terminals, { 
      id: newId, 
      name: 'bash', 
      history: ['Welcome to Web IDE Terminal', '> '], 
      input: '' 
    }]);
    setActiveTerminal(newId);
  };

  // Close a terminal
  const closeTerminal = (id, e) => {
    if (e) e.stopPropagation();
    if (terminals.length === 1) return;
    
    const updatedTerminals = terminals.filter(term => term.id !== id);
    setTerminals(updatedTerminals);
    
    if (activeTerminal === id) {
      setActiveTerminal(updatedTerminals[0].id);
    }
  };

  // Clear the terminal
  const clearTerminal = () => {
    setTerminals(prevTerminals => 
      prevTerminals.map(term => 
        term.id === activeTerminal 
          ? { ...term, history: ['Terminal cleared', '> '], input: '' }
          : term
      )
    );
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
            {terminals.length > 1 && (
              <button
                className={`ml-2 p-0.5 rounded-sm hover:${theme.buttonHoverBackground}`}
                onClick={(e) => closeTerminal(term.id, e)}
              >
                <FaTimes size={10} className={theme.iconColor} />
              </button>
            )}
          </div>
        ))}
        
        <button
          className={`px-2 flex items-center justify-center hover:${theme.buttonHoverBackground}`}
          onClick={addNewTerminal}
          title="New Terminal"
        >
          <FaPlus className={theme.iconColor} size={10} />
        </button>
        
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
    const terminal = terminals.find(t => t.id === activeTerminal);
    if (!terminal) return null;
    
    return (
      <div className={`flex-1 flex flex-col justify-between overflow-hidden`}>
        {/* Terminal output - use virtualization for large outputs */}
        <div className={`flex-1 overflow-y-auto p-2 font-mono text-sm ${theme.terminalBackground}`}>
          {terminal.history.map((item, index) => (
            <TerminalHistoryItem 
              key={index}
              content={item}
              isPrompt={item.startsWith('>')}
              className={item.startsWith('>') ? theme.terminalPromptColor : theme.terminalOutputColor}
            />
          ))}
        </div>
        
        {/* Terminal input */}
        <form 
          className={`flex items-center p-1 border-t ${theme.tabBorder} ${theme.terminalBackground}`}
          onSubmit={(e) => handleTerminalSubmit(e, terminal.id)}
        >
          <span className={theme.terminalPromptColor}>{'>'}</span>
          <input
            ref={terminalInputRef}
            type="text"
            value={terminal.input}
            onChange={(e) => handleTerminalInput(e, terminal.id)}
            className={`flex-1 bg-transparent border-0 outline-none ml-2 ${theme.terminalForeground} font-mono text-sm`}
            spellCheck="false"
            autoComplete="off"
          />
        </form>
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
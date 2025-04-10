import React, { useState, useRef, useEffect } from 'react';
import { 
  FaRobot, 
  FaPaperPlane, 
  FaUser, 
  FaTimes, 
  FaCode, 
  FaCopy, 
  FaChevronDown,
  FaEraser,
  FaCog
} from 'react-icons/fa';
import Button from '../ui/Button';
import Dropdown from '../ui/Dropdown';
import AISettingsModal from '../modals/AISettingsModal';

const Chatbot = ({ theme, onClose }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'assistant', 
      content: 'Hello! I\'m your coding assistant. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentMode, setAgentMode] = useState('assistant'); // 'assistant', 'agent', 'reviewer'
  const [currentModel, setCurrentModel] = useState('gpt-4'); // Default model
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  
  // AI settings state - load from localStorage if available
  const [aiSettings, setAiSettings] = useState(() => {
    const savedSettings = localStorage.getItem('aiSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Error parsing AI settings:', e);
        return {
          apiKey: '',
          model: 'gpt-4',
          customModels: [],
          server: 'https://api.openai.com/v1',
          history: {
            saveHistory: true,
            maxMessages: 100,
            autoDeleteAfterDays: 7
          }
        };
      }
    }
    return {
      apiKey: '',
      model: 'gpt-4',
      customModels: [],
      server: 'https://api.openai.com/v1',
      history: {
        saveHistory: true,
        maxMessages: 100,
        autoDeleteAfterDays: 7
      }
    };
  });
  
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Available AI models - combine standard models with custom models from settings
  const availableModels = [
    { id: 'gpt-4', name: 'GPT-4', description: 'Most powerful model for complex tasks' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Most powerful model for complex tasks' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient for most tasks' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most powerful model for complex tasks' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and efficient for most tasks' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Excellent for code understanding' },
    { id: 'claude-3-sonnet', name: 'Claude 3.5 Sonnet', description: 'Most powerful model for complex tasks' },
    { id: 'claude-3-sonnet', name: 'Claude 3.7 Sonnet', description: 'Most powerful model for complex tasks' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Specialized for programming tasks' },
    ...(aiSettings.customModels || []).map(model => ({
      id: model.id,
      name: model.label,
      description: 'Custom model'
    }))
  ];
  
  // Agent modes with descriptions
  const agentModes = [
    { 
      id: 'assistant', 
      name: 'Assistant', 
      description: 'Helps answer questions and provide guidance',
      welcomeMessage: 'Hello! I\'m your coding assistant. How can I help you today?'
    },
    { 
      id: 'agent', 
      name: 'Agent', 
      description: 'Proactively executes tasks and suggests improvements',
      welcomeMessage: 'Agent mode activated. I can help implement features and fix issues in your codebase. What would you like me to work on?'
    },
    { 
      id: 'reviewer', 
      name: 'Code Reviewer', 
      description: 'Reviews code for best practices and improvements',
      welcomeMessage: 'Code review mode active. Share your code, and I\'ll provide feedback on style, performance, and potential issues.'
    }
  ];
  
  // Sample responses for demo
  const sampleResponses = [
    "Here's a solution to your problem. Try using a map function to iterate through the array:",
    "The error in your code is likely due to an undefined variable. Check line 42 where you're using 'result' before it's defined.",
    "For React components, remember that useEffect runs after the component mounts. You might want to add a dependency array to control when it runs.",
    "Your CSS issue could be related to specificity. Try adding a more specific selector or use !important (but only as a last resort).",
    "The best way to handle this state management issue would be to use the useReducer hook instead of multiple useState calls.",
  ];
  
  // Sample code snippet
  const codeSnippet = `function calculateTotal(items) {
  return items
    .map(item => item.price * item.quantity)
    .reduce((total, value) => total + value, 0);
}`;

  // Load custom models and current model from settings when component mounts
  useEffect(() => {
    if (aiSettings.model) {
      setCurrentModel(aiSettings.model);
    }
  }, []);
  
  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
        setIsSettingsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleUserInput = (e) => {
    setUserInput(e.target.value);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (userInput.trim() === '') return;
    
    // Add user message
    const newUserMessage = {
      id: messages.length + 1,
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserInput('');
    
    // Simulate assistant typing
    setIsTyping(true);
    
    // Simulate response after a delay
    setTimeout(() => {
      const randomResponse = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
      const includeCode = Math.random() > 0.5;
      
      const botResponse = {
        id: messages.length + 2,
        role: 'assistant',
        content: randomResponse,
        code: includeCode ? codeSnippet : null,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, botResponse]);
      setIsTyping(false);
    }, 1500);
  };
  
  const changeAgentMode = (mode) => {
    setAgentMode(mode);
    
    // Add a system message about the mode change
    const selectedMode = agentModes.find(m => m.id === mode);
    
    setMessages([
      { 
        id: 1, 
        role: 'assistant', 
        content: selectedMode.welcomeMessage,
        timestamp: new Date().toISOString()
      }
    ]);
  };
  
  const changeModel = (model) => {
    setCurrentModel(model);
    setIsModelDropdownOpen(false);
    
    // Add a system message about the model change
    const selectedModel = availableModels.find(m => m.id === model);
    
    const systemMessage = {
      id: messages.length + 1,
      role: 'system',
      content: `Switched to ${selectedModel.name} model.`,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, systemMessage]);
  };
  
  const clearConversation = () => {
    const selectedMode = agentModes.find(m => m.id === agentMode);
    
    setMessages([
      { 
        id: 1, 
        role: 'assistant', 
        content: selectedMode.welcomeMessage,
        timestamp: new Date().toISOString()
      }
    ]);
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };
  
  const getCurrentModelName = () => {
    const model = availableModels.find(m => m.id === currentModel);
    return model ? model.name : 'Select Model';
  };
  
  const getSystemMessageClass = (role) => {
    if (role === 'system') {
      return `italic text-center my-2 text-xs ${theme.descriptionForeground}`;
    }
    return '';
  };
  
  // Transform for dropdown component
  const modelOptions = [
    ...availableModels.map(model => ({
      id: model.id,
      label: model.name,
      description: model.description
    }))
  ];
  
  // Function to handle saving AI settings
  const handleSaveAISettings = (newSettings) => {
    setAiSettings(newSettings);
    
    // Update the current model if it changed in settings
    if (newSettings.model !== currentModel) {
      setCurrentModel(newSettings.model);
      
      // Add a system message about the model change
      const selectedModel = [...availableModels, ...newSettings.customModels].find(m => m.id === newSettings.model);
      
      if (selectedModel) {
        const systemMessage = {
          id: messages.length + 1,
          role: 'system',
          content: `Switched to ${selectedModel.name || selectedModel.label} model.`,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prevMessages => [...prevMessages, systemMessage]);
      }
    }
    
    // You could also save the settings to localStorage here
    localStorage.setItem('aiSettings', JSON.stringify(newSettings));
  };
  
  return (
    <div className={`flex flex-col h-full ${theme.sidebarBackground}`}>
      {/* Header */}
      <div className={`flex flex-col border-b ${theme.tabBorder}`}>
        <div className="flex items-center justify-between px-4 py-1 h-[30px]">
          <div className="flex items-center">
            <FaRobot className={`mr-2 ${theme.foreground}`} />
            <h2 className={`text-sm font-medium ${theme.foreground} capitalize`}>Code {agentMode}</h2>
          </div>
          <div className="flex items-center">
            <button 
              className={`text-sm p-1 rounded-sm mr-2 ${theme.foreground} opacity-60 hover:opacity-100 hover:${theme.buttonHoverBackground}`}
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="Settings"
            >
              <FaCog />
            </button>
            <button 
              className={`text-sm p-1 rounded-sm ${theme.foreground} opacity-60 hover:opacity-100 hover:${theme.buttonHoverBackground}`}
              onClick={onClose}
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        
        {/* Settings dropdown */}
        {isSettingsOpen && (
          <div 
            className={`absolute top-12 right-4 z-10 w-56 rounded-md shadow-lg ${theme.menuBackground} border ${theme.menuBorder}`}
            ref={dropdownRef}
          >
            <div className="py-1">
              <button
                className={`w-full text-left px-4 py-2 text-sm ${theme.foreground} hover:${theme.menuItemHoverBackground} flex items-center justify-between`}
                onClick={clearConversation}
              >
                <span>Clear conversation</span>
                <FaEraser size={12} />
              </button>
              <button
                className={`w-full text-left px-4 py-2 text-sm ${theme.foreground} hover:${theme.menuItemHoverBackground} flex items-center justify-between`}
                onClick={() => {
                  setIsSettingsOpen(false);
                  setShowAISettings(true);
                }}
              >
                <span>AI Settings</span>
                <FaCog size={12} />
              </button>
            </div>
          </div>
        )}
        
        {/* Model selector */}
        <div className={`px-4 py-2 border-t  ${theme.tabBorder} ${theme.tabActiveBackground}`}>
        {/* Agent mode selector */}
        <div className="flex pb-2 space-x-1">
          {agentModes.map(mode => (
            <Button
              key={mode.id}
              theme={theme}
              variant={agentMode === mode.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => changeAgentMode(mode.id)}
              title={mode.description}
              className="flex-1"
            >
              {mode.name}
            </Button>
          ))}
        </div>
        
          <Dropdown
            theme={theme}
            options={modelOptions}
            value={currentModel}
            onChange={changeModel}
            placeholder="Select AI model"
            fullWidth
            size="sm"
          />
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`mb-4 ${
              message.role === 'system' 
                ? getSystemMessageClass(message.role)
                : message.role === 'user' 
                  ? 'flex flex-row-reverse' 
                  : 'flex'
            }`}
          >
            {message.role === 'system' ? (
              <div className={getSystemMessageClass(message.role)}>
                {message.content}
              </div>
            ) : (
              <div className={`p-3 rounded-lg max-w-3/4 ${
                message.role === 'user' 
                  ? `ml-auto ${theme.menuBackground} shadow-sm` 
                  : `mr-auto ${theme.terminalBackground} shadow-sm`
              }`}>
                <div className="flex items-start mb-1">
                  <div className={`p-1 mr-2 rounded-full ${
                    message.role === 'user' 
                      ? theme.buttonBackground
                      : 'bg-green-500'
                  }`}>
                    {message.role === 'user' ? <FaUser size={10} className="text-white" /> : <FaRobot size={10} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm ${theme.foreground}`}>{message.content}</div>
                    
                    {/* Code block if present */}
                    {message.code && (
                      <div className={`mt-3 p-3 rounded ${theme.terminalBackground} relative`}>
                        <div className={`absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1 text-xs ${theme.tabActiveBackground} rounded-t`}>
                          <span className={theme.foreground}>Code</span>
                          <button 
                            className="opacity-50 hover:opacity-100"
                            onClick={() => copyToClipboard(message.code)}
                            title="Copy code"
                          >
                            <FaCopy size={12} className={theme.foreground} />
                          </button>
                        </div>
                        <pre className={`text-xs font-mono whitespace-pre-wrap overflow-x-auto mt-6 ${theme.terminalOutputColor}`}>
                          {message.code}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`text-xs text-right mt-2 ${theme.descriptionForeground}`}>
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex mb-4">
            <div className={`p-3 rounded-lg ${theme.terminalBackground}`}>
              <div className="flex items-center">
                <span className="p-1 mr-2 rounded-full bg-green-500">
                  <FaRobot size={10} className="text-white" />
                </span>
                <div className={`typing-indicator ${theme.foreground}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className={`p-3 border-t ${theme.tabBorder} ${theme.terminalHeaderBackground}`}>
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={userInput}
            onChange={handleUserInput}
            placeholder={`Ask a question in ${agentMode} mode...`}
            className={`flex-1 px-3 py-2 rounded-l-md ${theme.inputBackground} focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
          <Button
            theme={theme}
            variant="primary"
            type="submit"
            disabled={userInput.trim() === ''}
            className="rounded-l-none"
            rightIcon={<FaPaperPlane size={12} />}
          >
            {/* Empty button text - icon only */}
          </Button>
        </form>
        <div className={`mt-2 text-xs ${theme.descriptionForeground}`}>
          Press Enter to send your message • Using {getCurrentModelName()}
        </div>
      </div>
      
      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        theme={theme}
        aiSettings={aiSettings}
        onSaveSettings={handleSaveAISettings}
      />
    </div>
  );
};

export default Chatbot; 
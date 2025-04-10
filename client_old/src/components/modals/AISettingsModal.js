import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaTimes, 
  FaRobot, 
  FaKey, 
  FaServer, 
  FaHistory,
  FaCog,
  FaCheck,
  FaTrash,
  FaSave,
  FaPlus,
  FaToggleOn,
  FaToggleOff,
  FaPencilAlt,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';

import Button from '../ui/Button';
import Dropdown from '../ui/Dropdown';

// Local storage key
const STORAGE_KEY = 'ai_settings';

const AISettingsModal = ({ 
  isOpen, 
  onClose, 
  theme,
  aiSettings = {},
  onSaveSettings
}) => {
  // Default settings
  const defaultSettings = {
    apiKey: '',
    model: 'gpt-4',
    customModels: [],
    server: 'https://api.openai.com/v1',
    mcpServers: [],
    useProxy: false,
    proxyUrl: '',
    history: {
      saveHistory: true,
      maxMessages: 100,
      autoDeleteAfterDays: 7
    }
  };

  // Load settings from localStorage if available
  const loadSettingsFromStorage = () => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        return JSON.parse(storedSettings);
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
    return {};
  };

  // Initialize settings from props, localStorage, and defaults
  const getInitialSettings = () => {
    const storageSettings = loadSettingsFromStorage();
    return { ...defaultSettings, ...storageSettings, ...aiSettings };
  };

  // State for form values
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(getInitialSettings);
  const [newCustomModel, setNewCustomModel] = useState({ id: '', label: '' });
  const [showAPIKey, setShowAPIKey] = useState(false);
  const [newServer, setNewServer] = useState({ name: '', url: '', enabled: true });
  const [editingServerId, setEditingServerId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
  // Update settings when props change
  useEffect(() => {
    setSettings(prev => ({ ...prev, ...aiSettings }));
  }, [aiSettings]);

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }, [settings]);

  // AI model options
  const modelOptions = [
    { id: 'gpt-4', label: 'GPT-4' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { id: 'claude-3-opus', label: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet', label: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-sonnet', label: 'Claude 3.7 Sonnet' },
    { id: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    ...settings.customModels
  ];

  // Tab definitions
  const tabs = [
    { id: 'general', label: 'General', icon: <FaCog /> },
    { id: 'models', label: 'Models', icon: <FaRobot /> },
    { id: 'server', label: 'Server', icon: <FaServer /> },
    { id: 'history', label: 'History', icon: <FaHistory /> }
  ];

  // Handle input changes
  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested changes
  const handleNestedChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Add custom model
  const addCustomModel = () => {
    if (newCustomModel.id && newCustomModel.label) {
      setSettings((prev) => ({
        ...prev,
        customModels: [...prev.customModels, { ...newCustomModel, id: newCustomModel.id.trim(), label: newCustomModel.label.trim() }]
      }));
      setNewCustomModel({ id: '', label: '' });
    }
  };

  // Remove custom model
  const removeCustomModel = (modelId) => {
    setSettings((prev) => ({
      ...prev,
      customModels: prev.customModels.filter(model => model.id !== modelId)
    }));
  };

  // Handle MCP server operations
  const addOrUpdateServer = () => {
    if (!newServer.name || !newServer.url) return;
    
    const server = {
      id: editingServerId || `server-${Date.now()}`,
      name: newServer.name.trim(),
      url: newServer.url.trim(),
      enabled: newServer.enabled
    };

    setSettings(prev => {
      const updatedServers = editingServerId 
        ? prev.mcpServers.map(s => s.id === editingServerId ? server : s)
        : [...prev.mcpServers, server];
      
      return {
        ...prev,
        mcpServers: updatedServers
      };
    });

    // Reset form
    setNewServer({ name: '', url: '', enabled: true });
    setEditingServerId(null);
  };

  const editServer = (server) => {
    setNewServer({
      name: server.name,
      url: server.url,
      enabled: server.enabled
    });
    setEditingServerId(server.id);
  };

  const removeServer = (serverId) => {
    setSettings(prev => ({
      ...prev,
      mcpServers: prev.mcpServers.filter(server => server.id !== serverId)
    }));
  };

  const toggleServerEnabled = (serverId) => {
    setSettings(prev => ({
      ...prev,
      mcpServers: prev.mcpServers.map(server => 
        server.id === serverId ? { ...server, enabled: !server.enabled } : server
      )
    }));
  };

  // Sorting functionality
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedItems = (items, key) => {
    if (!sortConfig.key) return items;
    
    return [...items].sort((a, b) => {
      if (a[key] < b[key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  // Get sort icon based on current sort state
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className={`text-xs ${theme.descriptionForeground}`} />;
    return sortConfig.direction === 'ascending' 
      ? <FaSortUp className="text-blue-500" />
      : <FaSortDown className="text-blue-500" />;
  };

  // Save settings
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
    
    if (typeof onSaveSettings === 'function') {
      onSaveSettings(settings);
    }
    onClose();
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`mb-2 font-medium ${theme.foreground}`}>API Key</h3>
              <div className="flex items-center">
                <div className="relative flex-1">
                  <input
                    type={showAPIKey ? "text" : "password"}
                    value={settings.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    placeholder="Enter your API key"
                    className={`w-full px-3 py-2 rounded-md ${theme.inputBackground} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  <button
                    type="button"
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:${theme.buttonHoverBackground}`}
                    onClick={() => setShowAPIKey(!showAPIKey)}
                  >
                    <FaKey className={theme.iconColor} size={14} />
                  </button>
                </div>
              </div>
              <p className={`mt-2 text-xs ${theme.descriptionForeground}`}>
                Your API key is stored locally and never shared
              </p>
            </div>

            <div>
              <h3 className={`mb-2 font-medium ${theme.foreground}`}>Default Model</h3>
              <Dropdown
                theme={theme}
                options={modelOptions}
                value={settings.model}
                onChange={(value) => handleInputChange('model', value)}
                placeholder="Select AI model"
                fullWidth
              />
            </div>
          </div>
        );

      case 'models':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`mb-2 font-medium ${theme.foreground}`}>Custom Models</h3>
              <div className="mb-4">
                <div className="flex flex-col mb-2 gap-[1px]">
                  <input
                    type="text"
                    value={newCustomModel.id}
                    onChange={(e) => setNewCustomModel(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="Model ID (e.g. gpt-4-fine-tuned)"
                    className={`flex-1 px-3 py-2 rounded-t-md ${theme.inputBackground} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  <input
                    type="text"
                    value={newCustomModel.label}
                    onChange={(e) => setNewCustomModel(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="Display Name"
                    className={`flex-1 px-3 py-2 rounded-b-md ${theme.inputBackground} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  <Button
                    theme={theme}
                    onClick={addCustomModel}
                    disabled={!newCustomModel.id || !newCustomModel.label}
                    className="mt-2 rounded-md"
                    leftIcon={<FaPlus size={12} />}
                  >
                    Add
                  </Button>
                </div>
              </div>
              
              <div className={`rounded overflow-auto ${theme.terminalBackground}`}>
                {settings.customModels.length === 0 ? (
                  <div className={`p-4 text-center ${theme.descriptionForeground}`}>
                    No custom models added yet
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className={`border-b border-gray-700 bg-opacity-30 ${theme.listActiveBackground}`}>
                        <th 
                          className={`px-4 py-2 text-left text-xs font-semibold ${theme.foreground} cursor-pointer`}
                          onClick={() => handleSort('label')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>NAME</span>
                            {getSortIcon('label')}
                          </div>
                        </th>
                        <th 
                          className={`px-4 py-2 text-left text-xs font-semibold min-w-16 max-w-28 h-8 overflow-hidden text-ellipsis ${theme.foreground} cursor-pointer`}
                          onClick={() => handleSort('id')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>MODEL ID</span>
                            {getSortIcon('id')}
                          </div>
                        </th>
                        <th className={`px-4 py-2 text-right text-xs font-semibold ${theme.foreground}`}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedItems(settings.customModels, sortConfig.key).map((model) => (
                        <tr key={model.id} className="border-b border-gray-700">
                          <td className={`px-4 py-3 min-w-16 max-w-28 h-8 max-h-8 overflow-hidden text-ellipsis ${theme.foreground}`}>{model.label}</td>
                          <td className={`px-4 py-3 text-xs min-w-32 max-w-48 h-6 max-h-6 overflow-hidden text-ellipsis ${theme.descriptionForeground}`}>{model.id}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              theme={theme}
                              variant="text"
                              onClick={() => removeCustomModel(model.id)}
                              leftIcon={<FaTrash size={12} />}
                              size="sm"
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );

      case 'server':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`mb-2 font-medium ${theme.foreground}`}>API Endpoint</h3>
              <input
                type="text"
                value={settings.server}
                onChange={(e) => handleInputChange('server', e.target.value)}
                placeholder="https://api.openai.com/v1"
                className={`w-full px-3 py-2 rounded-md ${theme.inputBackground} focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              <p className={`mt-2 text-xs ${theme.descriptionForeground}`}>
                Use a custom API endpoint for self-hosted models or proxies
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="useProxy"
                className={`mr-2 ${theme.accentColor}`} 
                checked={settings.useProxy || false}
                onChange={(e) => handleInputChange('useProxy', e.target.checked)}
              />
              <label htmlFor="useProxy" className={theme.foreground}>
                Use MCP Server Proxy
              </label>
            </div>

            {settings.useProxy && (
              <>
                <div>
                  <h3 className={`mb-2 font-medium ${theme.foreground}`}>MCP Servers</h3>
                  <div className="mb-4 p-3 border border-gray-700 rounded">
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-xs mb-1 ${theme.foreground}`}>Server Name</label>
                        <input
                          type="text"
                          value={newServer.name}
                          onChange={(e) => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Primary Server"
                          className={`w-full px-3 py-2 rounded-md ${theme.inputBackground} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${theme.foreground}`}>Server URL</label>
                        <input
                          type="text"
                          value={newServer.url}
                          onChange={(e) => setNewServer(prev => ({ ...prev, url: e.target.value }))}
                          placeholder="http://localhost:3000/api/proxy"
                          className={`w-full px-3 py-2 rounded-md ${theme.inputBackground} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="serverEnabled"
                          className={`mr-2 ${theme.accentColor}`} 
                          checked={newServer.enabled}
                          onChange={(e) => setNewServer(prev => ({ ...prev, enabled: e.target.checked }))}
                        />
                        <label htmlFor="serverEnabled" className={theme.foreground}>
                          Enabled
                        </label>
                      </div>
                      <div className="flex justify-end">
                        {editingServerId && (
                          <Button
                            theme={theme}
                            variant="secondary"
                            onClick={() => {
                              setNewServer({ name: '', url: '', enabled: true });
                              setEditingServerId(null);
                            }}
                            className="mr-2"
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          theme={theme}
                          onClick={addOrUpdateServer}
                          disabled={!newServer.name || !newServer.url}
                          leftIcon={editingServerId ? <FaCheck size={12} /> : <FaPlus size={12} />}
                        >
                          {editingServerId ? 'Update Server' : 'Add Server'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded overflow-auto ${theme.terminalBackground}`}>
                    {settings.mcpServers.length === 0 ? (
                      <div className={`p-4 text-center ${theme.descriptionForeground}`}>
                        No MCP servers added yet
                      </div>
                    ) : (
                      <table className="w-full border-collapse overflow-auto">
                        <thead>
                          <tr className={`border-b border-gray-700 bg-opacity-30 ${theme.listActiveBackground}`}>
                            <th 
                              className={`px-4 py-2 text-left text-xs font-semibold ${theme.foreground} cursor-pointer`}
                              onClick={() => handleSort('name')}
                            >
                              <div className="flex items-center space-x-1">
                                <span>NAME</span>
                                {getSortIcon('name')}
                              </div>
                            </th>
                            <th 
                              className={`px-4 py-2 text-left text-xs font-semibold ${theme.foreground}`}
                            >
                              URL
                            </th>
                            <th 
                              className={`px-4 py-2 text-center text-xs font-semibold ${theme.foreground}`}
                            >
                              STATUS
                            </th>
                            <th className={`px-4 py-2 text-right text-xs font-semibold ${theme.foreground}`}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSortedItems(settings.mcpServers, sortConfig.key).map((server) => (
                            <tr key={server.id} className="border-b border-gray-700">
                              <td className={`px-4 py-3 min-w-16 max-w-28 h-8 overflow-hidden text-ellipsis ${theme.foreground}`}>{server.name}</td>
                              <td className={`px-4 py-3 text-xs min-w-32 max-w-48 h-6 overflow-hidden text-ellipsis ${theme.descriptionForeground}`}>{server.url}</td>
                              <td className="px-4 py-3 text-center flex items-center gap-1 w-24 mr-1">
                              <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`server-enabled-${server.id}`}
                                      className={`${theme.accentColor}`} 
                                      checked={server.enabled}
                                      onChange={() => toggleServerEnabled(server.id)}
                                    />
                                    {/* <label 
                                      htmlFor={`server-enabled-${server.id}`}
                                      className={`text-xs ${theme.foreground} cursor-pointer`}
                                    >
                                      {server.enabled ? 'Enabled' : 'Disabled'}
                                    </label> */}
                                  </div>
                                <div 
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                    server.enabled 
                                      ? 'bg-green-900 bg-opacity-20 text-green-400' 
                                      : 'bg-red-900 bg-opacity-20 text-red-400'
                                  }`}
                                >
                                  {server.enabled ? 'Enabled' : 'Disabled'}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-center space-x-1">
                                  <Button
                                    theme={theme}
                                    variant="text"
                                    onClick={() => editServer(server)}
                                    leftIcon={<FaPencilAlt size={12} />}
                                    size="sm"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    theme={theme}
                                    variant="text"
                                    onClick={() => removeServer(server.id)}
                                    leftIcon={<FaTrash size={12} />}
                                    size="sm"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <label htmlFor="saveHistory" className={`mr-2 ${theme.foreground}`}>
                  Save Conversation History
                </label>
              </div>
              <button
                onClick={() => handleNestedChange('history', 'saveHistory', !settings.history.saveHistory)}
                className="text-blue-500 focus:outline-none"
              >
                {settings.history.saveHistory ? (
                  <FaToggleOn size={24} className="text-blue-500" />
                ) : (
                  <FaToggleOff size={24} className={theme.descriptionForeground} />
                )}
              </button>
            </div>

            {settings.history.saveHistory && (
              <>
                <div>
                  <h3 className={`mb-2 font-medium ${theme.foreground}`}>Maximum Messages Per Conversation</h3>
                  <Dropdown
                    theme={theme}
                    options={[
                      { id: 50, label: '50 messages' },
                      { id: 100, label: '100 messages' },
                      { id: 200, label: '200 messages' },
                      { id: 500, label: '500 messages' },
                      { id: 0, label: 'Unlimited' }
                    ]}
                    value={settings.history.maxMessages}
                    onChange={(value) => handleNestedChange('history', 'maxMessages', value)}
                    fullWidth
                  />
                </div>

                <div>
                  <h3 className={`mb-2 font-medium ${theme.foreground}`}>Auto-Delete After</h3>
                  <Dropdown
                    theme={theme}
                    options={[
                      { id: 1, label: '1 day' },
                      { id: 7, label: '7 days' },
                      { id: 30, label: '30 days' },
                      { id: 90, label: '90 days' },
                      { id: 0, label: 'Never' }
                    ]}
                    value={settings.history.autoDeleteAfterDays}
                    onChange={(value) => handleNestedChange('history', 'autoDeleteAfterDays', value)}
                    fullWidth
                  />
                </div>

                <div className="mt-4">
                  <Button
                    theme={theme}
                    variant="secondary"
                    leftIcon={<FaTrash size={12} />}
                    onClick={() => {/* Would implement clear history function */}}
                    className="w-full"
                  >
                    Clear All Conversation History
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  // Create a portal element if it doesn't exist
  let portalElement = document.getElementById('modal-root');
  if (!portalElement) {
    portalElement = document.createElement('div');
    portalElement.id = 'modal-root';
    document.body.appendChild(portalElement);
  }

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={`w-full max-w-6xl rounded shadow-lg ${theme.background} border ${theme.menuBorder}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme.tabBorder}`}>
          <h2 className={`text-lg font-medium flex items-center ${theme.foreground}`}>
            <FaRobot className="mr-2" />
            AI Assistant Settings
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full hover:${theme.buttonHoverBackground}`}
          >
            <FaTimes className={theme.iconColor} />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[650px]">
          {/* Sidebar */}
          <div className={`w-48 border-r ${theme.tabBorder} ${theme.sidebarBackground}`}>
            <nav className="p-2">
              <ul className="space-y-1">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      className={`flex items-center w-full px-3 py-2 rounded-md text-sm ${
                        activeTab === tab.id ? 
                          `${theme.listActiveBackground} ${theme.foreground}` : 
                          `${theme.foreground} hover:${theme.listHoverBackground}`
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span className="mr-3">{tab.icon}</span>
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 p-4 border-t ${theme.tabBorder}`}>
          <Button
            theme={theme}
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            theme={theme}
            variant="primary"
            onClick={handleSave}
            leftIcon={<FaSave size={12} />}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>,
    portalElement
  );
};

export default AISettingsModal; 
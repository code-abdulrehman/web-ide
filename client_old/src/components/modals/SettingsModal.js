import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaTimes, 
  FaPalette, 
  FaTerminal, 
  FaCog, 
  FaCode,
  FaRegKeyboard 
} from 'react-icons/fa';

import Button from '../ui/Button';
import AppearanceTab from './tabs/settings/AppearanceTab';
import EditorTab from './tabs/settings/EditorTab';
import TerminalTab from './tabs/settings/TerminalTab';
import KeybindingsTab from './tabs/settings/KeybindingsTab';
import AdvancedTab from './tabs/settings/AdvancedTab';

// Default keybindings with common editor commands
export const DEFAULT_KEYBINDINGS = [
  { id: 'save', action: 'Save', keys: 'Ctrl+Alt+S', category: 'File' },
  { id: 'save-all', action: 'Save All', keys: 'Ctrl+Alt+A', category: 'File' },
  { id: 'open-file', action: 'Open File', keys: 'Ctrl+Alt+O', category: 'File' },
  { id: 'find', action: 'Find', keys: 'Ctrl+Alt+F', category: 'Edit' },
  { id: 'replace', action: 'Replace', keys: 'Ctrl+Alt+H', category: 'Edit' },
  { id: 'undo', action: 'Undo', keys: 'Ctrl+Alt+Z', category: 'Edit' },
  { id: 'redo', action: 'Redo', keys: 'Ctrl+Alt+Y', category: 'Edit' },
  { id: 'cut', action: 'Cut', keys: 'Ctrl+Alt+X', category: 'Edit' },
  { id: 'copy', action: 'Copy', keys: 'Ctrl+Alt+C', category: 'Edit' },
  { id: 'paste', action: 'Paste', keys: 'Ctrl+Alt+V', category: 'Edit' },
  { id: 'select-all', action: 'Select All', keys: 'Ctrl+Alt+A', category: 'Edit' },
  { id: 'toggle-sidebar', action: 'Toggle Sidebar', keys: 'Ctrl+Alt+B', category: 'View' },
  { id: 'toggle-terminal', action: 'Toggle Terminal', keys: 'Ctrl+Alt+T', category: 'View' },
  { id: 'new-file', action: 'New File', keys: 'Ctrl+Alt+N', category: 'File' },
  { id: 'close-editor', action: 'Close Editor', keys: 'Ctrl+Alt+W', category: 'File' },
  { id: 'format-document', action: 'Format Document', keys: 'Ctrl+Alt+L', category: 'Edit' },
  { id: 'toggle-comment', action: 'Toggle Comment', keys: 'Ctrl+Alt+/', category: 'Edit' },
  { id: 'indent', action: 'Indent', keys: 'Ctrl+Alt+]', category: 'Edit' },
  { id: 'outdent', action: 'Outdent', keys: 'Ctrl+Alt+[', category: 'Edit' },
  { id: 'ai-assist', action: 'AI Assistance', keys: 'Ctrl+Alt+I', category: 'AI' }
];

// List of all available categories
export const KEY_CATEGORIES = [
  'All',
  'File',
  'Edit',
  'View',
  'Selection',
  'Navigation',
  'Terminal',
  'AI'
];

// Theme options
export const THEME_OPTIONS = [
  { id: 'vs-dark', label: 'Dark (Default)', description: 'Visual Studio Dark Theme' },
  { id: 'light', label: 'Light', description: 'Light Theme' },
  { id: 'high-contrast', label: 'High Contrast', description: 'High Contrast Theme' }
];

// Font size options
export const FONT_SIZE_OPTIONS = [
  { id: 10, label: '10px' },
  { id: 12, label: '12px' },
  { id: 14, label: '14px' },
  { id: 16, label: '16px' },
  { id: 18, label: '18px' },
  { id: 20, label: '20px' }
];

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  theme, 
  onSaveSettings, 
  settings,
  defaultSettings 
}) => {
  // Tabs for the settings modal
  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: <FaPalette /> },
    { id: 'editor', label: 'Editor', icon: <FaCode /> },
    { id: 'terminal', label: 'Terminal', icon: <FaTerminal /> },
    { id: 'keybindings', label: 'Key Bindings', icon: <FaRegKeyboard /> },
    { id: 'advanced', label: 'Advanced', icon: <FaCog /> }
  ];

  // State for form values
  const [activeTab, setActiveTab] = useState('appearance');
  const [formSettings, setFormSettings] = useState(settings || {});

  // Update settings when props change
  useEffect(() => {
    if (settings) {
      setFormSettings(settings);
    }
  }, [settings]);

  // Handle input changes for top-level settings
  const handleInputChange = (field, value) => {
    setFormSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested changes (e.g., editor.fontFamily)
  const handleNestedChange = (section, field, value) => {
    setFormSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Save settings and close modal
  const handleSave = () => {
    if (typeof onSaveSettings === 'function') {
      onSaveSettings(formSettings);
    }
    onClose();
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return (
          <AppearanceTab 
            theme={theme} 
            formSettings={formSettings} 
            setFormSettings={setFormSettings}
            handleInputChange={handleInputChange}
          />
        );
      case 'editor':
        return (
          <EditorTab 
            theme={theme} 
            formSettings={formSettings} 
            handleNestedChange={handleNestedChange}
          />
        );
      case 'terminal':
        return (
          <TerminalTab 
            theme={theme} 
            formSettings={formSettings} 
            handleNestedChange={handleNestedChange}
          />
        );
      case 'keybindings':
        return (
          <KeybindingsTab 
            theme={theme} 
            formSettings={formSettings}
            setFormSettings={setFormSettings}
          />
        );
      case 'advanced':
        return (
          <AdvancedTab 
            theme={theme} 
            formSettings={formSettings} 
            handleInputChange={handleInputChange}
          />
        );
      default:
        return null;
    }
  };
  
  if (!isOpen) return null;
  
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={`w-full max-w-6xl rounded shadow-lg ${theme.background} border ${theme.menuBorder}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme.tabBorder}`}>
          <h2 className={`text-lg font-medium ${theme.foreground}`}>Settings</h2>
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
          <div className={`w-56 border-r ${theme.tabBorder} ${theme.sidebarBackground}`}>
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
          >
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsModal; 
import React, { useState } from 'react';
import { 
  FaPlus, 
  FaClone, 
  FaEdit, 
  FaTrash, 
  FaSave 
} from 'react-icons/fa';
import Dropdown from './../../../ui/Dropdown';
import Button from './../../../ui/Button';
import { THEME_OPTIONS, FONT_SIZE_OPTIONS } from './../../SettingsModal';

const AppearanceTab = ({ theme, formSettings, setFormSettings, handleInputChange }) => {
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const [currentThemeEdit, setCurrentThemeEdit] = useState({
    name: '',
    id: '',
    colors: {
      // Base colors
      primary: '#007acc', // blue
      secondary: '#444444', // darker gray
      background: '#1e1e1e', // dark gray
      foreground: '#d4d4d4', // light gray
      accent: '#007acc', // blue
      error: '#f14c4c', // red
      
      // UI specific colors
      'sidebar.background': '#252526',
      'activityBar.background': '#1f1f1f',
      'editor.background': '#1e1e1e',
      'terminal.background': '#1e1e1e',
      'statusBar.background': '#007acc',
      'titleBar.background': '#3c3c3c',
      
      // Text colors
      'foreground': '#d4d4d4',
      'descriptionForeground': '#858585',
    }
  });

  // Handle theme color changes
  const handleThemeColorChange = (colorKey, value) => {
    setCurrentThemeEdit(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  };

  // Create new theme based on selected theme or default
  const startNewTheme = (baseThemeId = 'vs-dark') => {
    // Find base theme from built-in themes (simplified for now)
    let baseTheme = {
      name: 'New Custom Theme',
      id: `custom-${Date.now()}`,
      colors: { ...currentThemeEdit.colors }
    };
    
    // If it's based on a light theme, adjust default colors
    if (baseThemeId === 'light') {
      baseTheme.colors = {
        ...baseTheme.colors,
        primary: '#007acc',
        background: '#ffffff',
        foreground: '#000000',
        'sidebar.background': '#f3f3f3',
        'editor.background': '#ffffff',
        'terminal.background': '#ffffff'
      };
    }
    
    setCurrentThemeEdit(baseTheme);
    setIsEditingTheme(true);
  };
  
  // Edit existing custom theme
  const editCustomTheme = (themeId) => {
    const themeToEdit = formSettings.customThemes?.find(t => t.id === themeId);
    if (themeToEdit) {
      setCurrentThemeEdit(themeToEdit);
      setIsEditingTheme(true);
    }
  };
  
  // Delete custom theme
  const deleteCustomTheme = (themeId) => {
    setFormSettings(prev => ({
      ...prev,
      customThemes: prev.customThemes?.filter(t => t.id !== themeId) || []
    }));
  };
  
  // Save theme being edited
  const saveThemeEdit = () => {
    if (!currentThemeEdit.name.trim() || !currentThemeEdit.id) {
      return; // Validation failed
    }
    
    const existingIndex = formSettings.customThemes?.findIndex(t => t.id === currentThemeEdit.id);
    
    if (existingIndex >= 0) {
      // Update existing theme
      setFormSettings(prev => {
        const updatedThemes = [...(prev.customThemes || [])];
        updatedThemes[existingIndex] = currentThemeEdit;
        return {
          ...prev,
          customThemes: updatedThemes
        };
      });
    } else {
      // Add new theme
      setFormSettings(prev => ({
        ...prev,
        customThemes: [...(prev.customThemes || []), currentThemeEdit]
      }));
    }
    
    setIsEditingTheme(false);
  };
  
  // Cancel theme editing
  const cancelThemeEdit = () => {
    setIsEditingTheme(false);
    setCurrentThemeEdit({
      name: '',
      id: '',
      colors: { ...currentThemeEdit.colors }
    });
  };

  if (isEditingTheme) {
    // Theme editor UI
    return (
      <div className="space-y-6">
        <div>
          <h3 className={`mb-2 font-medium ${theme.foreground}`}>Theme Name</h3>
          <input
            type="text"
            value={currentThemeEdit.name}
            onChange={(e) => setCurrentThemeEdit(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My Custom Theme"
            className={`w-full px-3 py-2 rounded-md ${theme.inputBackground} focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
        </div>
        
        <div>
          <h3 className={`mb-4 font-medium ${theme.foreground}`}>Color Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className={`mb-2 text-sm font-medium ${theme.foreground}`}>Base Colors</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs mb-1 ${theme.foreground}`}>
                    Primary
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-6 rounded mr-2" style={{ backgroundColor: currentThemeEdit.colors.primary }}></div>
                    <input
                      type="text"
                      value={currentThemeEdit.colors.primary}
                      onChange={(e) => handleThemeColorChange('primary', e.target.value)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${theme.inputBackground} focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${theme.foreground}`}>
                    Secondary
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-6 rounded mr-2" style={{ backgroundColor: currentThemeEdit.colors.secondary }}></div>
                    <input
                      type="text"
                      value={currentThemeEdit.colors.secondary}
                      onChange={(e) => handleThemeColorChange('secondary', e.target.value)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${theme.inputBackground} focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${theme.foreground}`}>
                    Background
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-6 rounded mr-2" style={{ backgroundColor: currentThemeEdit.colors.background }}></div>
                    <input
                      type="text"
                      value={currentThemeEdit.colors.background}
                      onChange={(e) => handleThemeColorChange('background', e.target.value)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${theme.inputBackground} focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${theme.foreground}`}>
                    Foreground
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-6 rounded mr-2" style={{ backgroundColor: currentThemeEdit.colors.foreground }}></div>
                    <input
                      type="text"
                      value={currentThemeEdit.colors.foreground}
                      onChange={(e) => handleThemeColorChange('foreground', e.target.value)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${theme.inputBackground} focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${theme.foreground}`}>
                    Accent
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-6 rounded mr-2" style={{ backgroundColor: currentThemeEdit.colors.accent }}></div>
                    <input
                      type="text"
                      value={currentThemeEdit.colors.accent}
                      onChange={(e) => handleThemeColorChange('accent', e.target.value)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${theme.inputBackground} focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${theme.foreground}`}>
                    Error
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-6 rounded mr-2" style={{ backgroundColor: currentThemeEdit.colors.error }}></div>
                    <input
                      type="text"
                      value={currentThemeEdit.colors.error}
                      onChange={(e) => handleThemeColorChange('error', e.target.value)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${theme.inputBackground} focus:outline-none`}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className={`mb-2 text-sm font-medium ${theme.foreground}`}>UI Element Colors</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs mb-1 ${theme.foreground}`}>
                    Sidebar Background
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-6 rounded mr-2" style={{ backgroundColor: currentThemeEdit.colors['sidebar.background'] }}></div>
                    <input
                      type="text"
                      value={currentThemeEdit.colors['sidebar.background']}
                      onChange={(e) => handleThemeColorChange('sidebar.background', e.target.value)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${theme.inputBackground} focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${theme.foreground}`}>
                    ActivityBar Background
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-6 rounded mr-2" style={{ backgroundColor: currentThemeEdit.colors['activityBar.background'] }}></div>
                    <input
                      type="text"
                      value={currentThemeEdit.colors['activityBar.background']}
                      onChange={(e) => handleThemeColorChange('activityBar.background', e.target.value)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${theme.inputBackground} focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${theme.foreground}`}>
                    Editor Background
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-6 rounded mr-2" style={{ backgroundColor: currentThemeEdit.colors['editor.background'] }}></div>
                    <input
                      type="text"
                      value={currentThemeEdit.colors['editor.background']}
                      onChange={(e) => handleThemeColorChange('editor.background', e.target.value)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${theme.inputBackground} focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${theme.foreground}`}>
                    Terminal Background
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-6 rounded mr-2" style={{ backgroundColor: currentThemeEdit.colors['terminal.background'] }}></div>
                    <input
                      type="text"
                      value={currentThemeEdit.colors['terminal.background']}
                      onChange={(e) => handleThemeColorChange('terminal.background', e.target.value)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${theme.inputBackground} focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${theme.foreground}`}>
                    StatusBar Background
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-6 rounded mr-2" style={{ backgroundColor: currentThemeEdit.colors['statusBar.background'] }}></div>
                    <input
                      type="text"
                      value={currentThemeEdit.colors['statusBar.background']}
                      onChange={(e) => handleThemeColorChange('statusBar.background', e.target.value)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${theme.inputBackground} focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${theme.foreground}`}>
                    TitleBar Background
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-6 rounded mr-2" style={{ backgroundColor: currentThemeEdit.colors['titleBar.background'] }}></div>
                    <input
                      type="text"
                      value={currentThemeEdit.colors['titleBar.background']}
                      onChange={(e) => handleThemeColorChange('titleBar.background', e.target.value)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${theme.inputBackground} focus:outline-none`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button
            theme={theme}
            variant="secondary"
            onClick={cancelThemeEdit}
          >
            Cancel
          </Button>
          <Button
            theme={theme}
            variant="primary"
            onClick={saveThemeEdit}
            leftIcon={<FaSave size={12} />}
            disabled={!currentThemeEdit.name.trim()}
          >
            Save Theme
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`mb-2 font-medium ${theme.foreground}`}>Theme</h3>
        <Dropdown
          theme={theme}
          options={[
            ...THEME_OPTIONS,
            ...(formSettings.customThemes || []).map(customTheme => ({
              id: customTheme.id,
              label: customTheme.name,
              description: 'Custom theme'
            }))
          ]}
          value={formSettings.theme || 'vs-dark'}
          onChange={(value) => handleInputChange('theme', value)}
          fullWidth
        />
      </div>

      <div>
        <h3 className={`mb-2 font-medium ${theme.foreground}`}>Font Size</h3>
        <Dropdown
          theme={theme}
          options={FONT_SIZE_OPTIONS}
          value={formSettings.fontSize || 14}
          onChange={(value) => handleInputChange('fontSize', value)}
          fullWidth
        />
      </div>

      <div>
        <h3 className={`mb-2 font-medium ${theme.foreground}`}>Font Family</h3>
        <Dropdown
          theme={theme}
          options={[
            { id: 'Menlo, Monaco, Courier New, monospace', label: 'Menlo' },
            { id: 'Fira Code, monospace', label: 'Fira Code' },
            { id: 'JetBrains Mono, monospace', label: 'JetBrains Mono' },
            { id: 'Source Code Pro, monospace', label: 'Source Code Pro' }
          ]}
          value={formSettings.fontFamily || 'Menlo, Monaco, Courier New, monospace'}
          onChange={(value) => handleInputChange('fontFamily', value)}
          fullWidth
        />
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-700">
        <h3 className={`font-medium ${theme.foreground}`}>Custom Themes</h3>
        <Button
          theme={theme}
          variant="secondary"
          onClick={() => startNewTheme()}
          leftIcon={<FaPlus size={12} />}
          size="sm"
        >
          Create New Theme
        </Button>
      </div>
      
      <div>
        <h4 className={`mb-2 text-sm font-medium ${theme.foreground}`}>Built-in Themes</h4>
        <div className={`rounded ${theme.terminalBackground}`}>
          <ul className="divide-y divide-gray-700">
            {THEME_OPTIONS.map((themeItem) => (
              <li key={themeItem.id} className="flex items-center justify-between p-3">
                <div>
                  <div className={theme.foreground}>{themeItem.label}</div>
                  <div className={`text-xs ${theme.descriptionForeground}`}>{themeItem.description}</div>
                </div>
                <Button
                  theme={theme}
                  variant="text"
                  onClick={() => startNewTheme(themeItem.id)}
                  leftIcon={<FaClone size={12} />}
                  size="sm"
                >
                  Clone
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div>
        <h4 className={`mb-2 text-sm font-medium ${theme.foreground}`}>Custom Themes</h4>
        <div className={`rounded ${theme.terminalBackground}`}>
          {!formSettings.customThemes || formSettings.customThemes.length === 0 ? (
            <div className={`p-4 text-center ${theme.descriptionForeground}`}>
              No custom themes yet. Create one to get started.
            </div>
          ) : (
            <ul className="divide-y divide-gray-700">
              {formSettings.customThemes.map((themeItem) => (
                <li key={themeItem.id} className="flex items-center justify-between p-3">
                  <div>
                    <div className={theme.foreground}>{themeItem.name}</div>
                    <div className={`text-xs ${theme.descriptionForeground}`}>Custom theme</div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      theme={theme}
                      variant="text"
                      onClick={() => editCustomTheme(themeItem.id)}
                      leftIcon={<FaEdit size={12} />}
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      theme={theme}
                      variant="text"
                      onClick={() => deleteCustomTheme(themeItem.id)}
                      leftIcon={<FaTrash size={12} />}
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppearanceTab; 
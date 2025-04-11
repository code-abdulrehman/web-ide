import React, { useState, useRef, useEffect } from 'react';
import { 
  FaSearch, 
  FaPlus, 
  FaPencilAlt, 
  FaTrash, 
  FaKeyboard 
} from 'react-icons/fa';
import Button from './../../../ui/Button';
import { DEFAULT_KEYBINDINGS, KEY_CATEGORIES } from './../../SettingsModal';

const KeybindingsTab = ({ theme, formSettings, setFormSettings }) => {
  const [keybindings, setKeybindings] = useState(
    (formSettings && formSettings.keybindings) || DEFAULT_KEYBINDINGS
  );
  const [keyFilter, setKeyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingKeybindId, setEditingKeybindId] = useState(null);
  const [isRecordingKeys, setIsRecordingKeys] = useState(false);
  const [newShortcut, setNewShortcut] = useState('');
  const keyRecordRef = useRef(null);

  // Add this after the existing state management
  const [newShortcutName, setNewShortcutName] = useState('');
  const [newShortcutCategory, setNewShortcutCategory] = useState('File');
  const [newShortcutKey, setNewShortcutKey] = useState('');

  // Update keybindings in form settings
  useEffect(() => {
    setFormSettings(prev => ({
      ...prev,
      keybindings
    }));
  }, [keybindings, setFormSettings]);

  // Function to start recording keyboard shortcut
  const startRecordingKeys = (id) => {
    setEditingKeybindId(id);
    setIsRecordingKeys(true);
    setNewShortcut('');
    
    // Focus the input element after setting state
    setTimeout(() => {
      if (keyRecordRef.current) {
        keyRecordRef.current.focus();
      }
    }, 50);
  };

  // Function to handle key recording
  const handleKeyDown = (e) => {
    e.preventDefault();
    
    // We only want to capture letters A-Z
    if (/^[a-zA-Z]$/.test(e.key)) {
      const key = e.key.toUpperCase();
      setNewShortcut(`Ctrl+Alt+${key}`);
    }
  };

  // Function to save the recorded keyboard shortcut
  const saveKeyboardShortcut = () => {
    if (newShortcut && editingKeybindId) {
      setKeybindings(prev => 
        prev.map(kb => 
          kb.id === editingKeybindId ? { ...kb, keys: newShortcut } : kb
        )
      );
      setIsRecordingKeys(false);
      setEditingKeybindId(null);
    }
  };

  // Function to cancel key recording
  const cancelKeyRecording = () => {
    setIsRecordingKeys(false);
    setEditingKeybindId(null);
    setNewShortcut('');
  };

  // Function to reset a keybinding to default
  const resetKeybindToDefault = (id) => {
    const defaultKeybind = DEFAULT_KEYBINDINGS.find(kb => kb.id === id);
    if (defaultKeybind) {
      setKeybindings(prev => 
        prev.map(kb => 
          kb.id === id ? { ...kb, keys: defaultKeybind.keys } : kb
        )
      );
    }
  };

  // Function to delete a shortcut
  const deleteShortcut = (id) => {
    // Only allow deletion if it's not one of the default shortcuts
    const isDefaultShortcut = DEFAULT_KEYBINDINGS.some(kb => kb.id === id);
    if (isDefaultShortcut) {
      return; // Don't allow deletion of default shortcuts
    }
    
    // Remove the shortcut from the keybindings array
    setKeybindings(prev => prev.filter(kb => kb.id !== id));
  };

  // Function to add a new shortcut
  const addNewShortcut = () => {
    if (!newShortcutName || !newShortcutKey) return;
    
    const newId = `custom-${Date.now()}`;
    const formattedKey = `Ctrl+Alt+${newShortcutKey.toUpperCase()}`;
    
    const newKeybind = {
      id: newId,
      action: newShortcutName,
      keys: formattedKey,
      category: newShortcutCategory
    };
    
    setKeybindings(prev => [...prev, newKeybind]);
    setNewShortcutName('');
    setNewShortcutKey('');
  };

  // Function to handle key input for new shortcut
  const handleNewShortcutKeyDown = (e) => {
    e.preventDefault();
    
    // We only want to capture letters A-Z
    if (/^[a-zA-Z]$/.test(e.key)) {
      setNewShortcutKey(e.key);
    }
  };

  // Filter keybindings based on search and category
  const filteredKeybindings = keybindings.filter(kb => {
    const matchesSearch = keyFilter === '' || 
      kb.action.toLowerCase().includes(keyFilter.toLowerCase()) ||
      kb.keys.toLowerCase().includes(keyFilter.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || kb.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`mb-4 font-medium ${theme.foreground}`}>Keyboard Shortcuts</h3>
        
        <div className="flex mb-4 gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search keyboard shortcuts..."
              className={`w-full pl-8 pr-3 py-2 rounded-md ${theme.inputBackground} focus:outline-none focus:ring-1 focus:ring-blue-500`}
              value={keyFilter || ''}
              onChange={(e) => setKeyFilter(e.target.value)}
            />
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.descriptionForeground}`} />
          </div>
          
          <select
            className={`px-3 py-2 rounded-md ${theme.inputBackground} focus:outline-none focus:ring-1 focus:ring-blue-500 border-none`}
            value={categoryFilter || 'All'}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {KEY_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        {/* Add new shortcut section */}
        <div className={`mb-4 p-3 rounded ${theme.terminalBackground}`}>
          <h4 className={`mb-3 font-medium ${theme.foreground}`}>Add New Shortcut</h4>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-5">
              <input
                type="text"
                placeholder="Command name"
                value={newShortcutName}
                onChange={(e) => setNewShortcutName(e.target.value)}
                className={`w-full px-3 py-2 rounded-md ${theme.inputBackground} focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>
            <div className="col-span-3">
              <select
                className={`w-full px-3 py-2 rounded-md ${theme.inputBackground} focus:outline-none focus:ring-1 focus:ring-blue-500 border-none`}
                value={newShortcutCategory}
                onChange={(e) => setNewShortcutCategory(e.target.value)}
              >
                {KEY_CATEGORIES.filter(cat => cat !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <div className={`flex items-center w-full px-3 py-2 rounded-md ${theme.inputBackground}`}>
                <span className={`${theme.descriptionForeground}`}>Ctrl+Alt+</span>
                <input
                  type="text"
                  placeholder="Key"
                  value={newShortcutKey}
                  onChange={(e) => {/* We handle this with onKeyDown */}}
                  onKeyDown={handleNewShortcutKeyDown}
                  className={`w-8 bg-transparent focus:outline-none ${theme.foreground}`}
                  maxLength={1}
                />
              </div>
            </div>
            <div className="col-span-2">
              <Button
                theme={theme}
                variant="primary"
                onClick={addNewShortcut}
                leftIcon={<FaPlus size={12} />}
                disabled={!newShortcutName || !newShortcutKey}
                className="w-full"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
        
        <div className={`rounded overflow-hidden ${theme.terminalBackground}`}>
          <table className="w-full border-collapse">
            <thead>
              <tr className={`border-b border-gray-700 bg-opacity-30 ${theme.listActiveBackground}`}>
                <th className={`px-4 py-2 text-left text-xs font-semibold ${theme.foreground}`}>COMMAND</th>
                <th className={`px-4 py-2 text-left text-xs font-semibold ${theme.foreground}`}>KEYBINDING</th>
                <th className={`px-4 py-2 text-left text-xs font-semibold ${theme.foreground}`}>CATEGORY</th>
                <th className={`px-4 py-2 text-right text-xs font-semibold ${theme.foreground}`}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeybindings.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`px-4 py-3 text-center ${theme.descriptionForeground}`}>
                    No keyboard shortcuts found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredKeybindings.map(kb => (
                  <tr key={kb.id} className="border-b border-gray-700">
                    <td className={`px-4 py-3 ${theme.foreground}`}>{kb.action}</td>
                    <td className={`px-4 py-3 ${theme.foreground}`}>
                      {editingKeybindId === kb.id ? (
                        <div className="flex items-center">
                          <input
                            type="text"
                            ref={keyRecordRef}
                            className={`bg-transparent border border-blue-500 rounded px-2 py-1 focus:outline-none ${theme.foreground}`}
                            value={newShortcut}
                            onChange={(e) => {/* We handle this with onKeyDown */}}
                            onKeyDown={handleKeyDown}
                            placeholder="Press a key"
                            autoFocus
                          />
                          
                          <Button
                            theme={theme}
                            variant="ghost"
                            onClick={saveKeyboardShortcut}
                            className="ml-2"
                            disabled={!newShortcut}
                          >
                            Save
                          </Button>
                          
                          <Button
                            theme={theme}
                            variant="ghost"
                            onClick={cancelKeyRecording}
                            className="ml-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="bg-gray-700 rounded px-2 py-1 text-sm">{kb.keys}</span>
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-xs ${theme.descriptionForeground}`}>{kb.category}</td>
                    <td className="px-4 py-3 text-right">
                      {editingKeybindId !== kb.id && (
                        <div className="flex justify-end space-x-1">
                          <Button
                            theme={theme}
                            variant="text"
                            leftIcon={<FaPencilAlt size={12} />}
                            size="sm"
                            onClick={() => startRecordingKeys(kb.id)}
                          >
                            Edit
                          </Button>
                          {DEFAULT_KEYBINDINGS.some(defaultKb => defaultKb.id === kb.id) ? (
                            <Button
                              theme={theme}
                              variant="text"
                              leftIcon={<FaTrash size={12} />}
                              size="sm"
                              onClick={() => resetKeybindToDefault(kb.id)}
                            >
                              Reset
                            </Button>
                          ) : (
                            <Button
                              theme={theme}
                              variant="text"
                              leftIcon={<FaTrash size={12} />}
                              size="sm"
                              onClick={() => deleteShortcut(kb.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className={`mt-4 p-3 rounded bg-opacity-20 ${theme.terminalBackground}`}>
          <div className="flex items-center gap-2">
            <FaKeyboard size={14} className={theme.descriptionForeground} />
            <p className={`text-xs ${theme.descriptionForeground}`}>
              All shortcuts use <span className="font-mono">Ctrl+Alt+[Key]</span> format. To edit, click the "Edit" button and press your desired keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeybindingsTab; 
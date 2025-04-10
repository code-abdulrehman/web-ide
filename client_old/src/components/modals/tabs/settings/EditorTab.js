import React from 'react';
import Dropdown from '../../../ui/Dropdown';

const EditorTab = ({ theme, formSettings, handleNestedChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className={`mb-2 font-medium ${theme.foreground}`}>Tab Size</h3>
        <Dropdown
          theme={theme}
          options={[
            { id: 2, label: '2 spaces' },
            { id: 4, label: '4 spaces' },
            { id: 8, label: '8 spaces' }
          ]}
          value={formSettings.editor?.tabSize || 2}
          onChange={(value) => handleNestedChange('editor', 'tabSize', value)}
          fullWidth
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="wordWrap"
          className={`mr-2 ${theme.accentColor}`} 
          checked={formSettings.editor?.wordWrap || false}
          onChange={(e) => handleNestedChange('editor', 'wordWrap', e.target.checked)}
        />
        <label htmlFor="wordWrap" className={theme.foreground}>
          Word Wrap
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="minimap"
          className={`mr-2 ${theme.accentColor}`} 
          checked={formSettings.editor?.minimap || true}
          onChange={(e) => handleNestedChange('editor', 'minimap', e.target.checked)}
        />
        <label htmlFor="minimap" className={theme.foreground}>
          Show Minimap
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="autoSave"
          className={`mr-2 ${theme.accentColor}`} 
          checked={formSettings.editor?.autoSave || false}
          onChange={(e) => handleNestedChange('editor', 'autoSave', e.target.checked)}
        />
        <label htmlFor="autoSave" className={theme.foreground}>
          Auto Save
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="formatOnSave"
          className={`mr-2 ${theme.accentColor}`} 
          checked={formSettings.editor?.formatOnSave || false}
          onChange={(e) => handleNestedChange('editor', 'formatOnSave', e.target.checked)}
        />
        <label htmlFor="formatOnSave" className={theme.foreground}>
          Format On Save
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="lineNumbers"
          className={`mr-2 ${theme.accentColor}`} 
          checked={formSettings.editor?.lineNumbers || true}
          onChange={(e) => handleNestedChange('editor', 'lineNumbers', e.target.checked)}
        />
        <label htmlFor="lineNumbers" className={theme.foreground}>
          Show Line Numbers
        </label>
      </div>
    </div>
  );
};

export default EditorTab; 
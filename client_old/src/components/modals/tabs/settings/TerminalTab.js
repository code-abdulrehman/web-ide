import React from 'react';
import Dropdown from '../../../ui/Dropdown';
import { FONT_SIZE_OPTIONS } from '../../SettingsModal';

const TerminalTab = ({ theme, formSettings, handleNestedChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className={`mb-2 font-medium ${theme.foreground}`}>Terminal Font Size</h3>
        <Dropdown
          theme={theme}
          options={FONT_SIZE_OPTIONS}
          value={formSettings.terminal?.fontSize || 14}
          onChange={(value) => handleNestedChange('terminal', 'fontSize', value)}
          fullWidth
        />
      </div>

      <div>
        <h3 className={`mb-2 font-medium ${theme.foreground}`}>Terminal Shell</h3>
        <Dropdown
          theme={theme}
          options={[
            { id: 'bash', label: 'Bash' },
            { id: 'powershell', label: 'PowerShell' },
            { id: 'cmd', label: 'Command Prompt' },
            { id: 'zsh', label: 'Zsh' }
          ]}
          value={formSettings.terminal?.shell || 'bash'}
          onChange={(value) => handleNestedChange('terminal', 'shell', value)}
          fullWidth
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="terminalCursor"
          className={`mr-2 ${theme.accentColor}`} 
          checked={formSettings.terminal?.cursorBlink || true}
          onChange={(e) => handleNestedChange('terminal', 'cursorBlink', e.target.checked)}
        />
        <label htmlFor="terminalCursor" className={theme.foreground}>
          Cursor Blinking
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="terminalLineHeight"
          className={`mr-2 ${theme.accentColor}`} 
          checked={formSettings.terminal?.lineHeight || 1.2}
          onChange={(e) => handleNestedChange('terminal', 'lineHeight', e.target.checked ? 1.2 : 1.0)}
        />
        <label htmlFor="terminalLineHeight" className={theme.foreground}>
          Increased Line Height
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="terminalLetterSpacing"
          className={`mr-2 ${theme.accentColor}`} 
          checked={formSettings.terminal?.letterSpacing || 0}
          onChange={(e) => handleNestedChange('terminal', 'letterSpacing', e.target.checked ? 1 : 0)}
        />
        <label htmlFor="terminalLetterSpacing" className={theme.foreground}>
          Increased Letter Spacing
        </label>
      </div>
    </div>
  );
};

export default TerminalTab; 
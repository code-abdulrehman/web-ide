
const AdvancedTab = ({ theme, formSettings, handleInputChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="telemetry"
          className={`mr-2 ${theme.accentColor}`} 
          checked={formSettings.telemetry !== false} // Default to true if undefined
          onChange={(e) => handleInputChange('telemetry', e.target.checked)}
        />
        <label htmlFor="telemetry" className={theme.foreground}>
          Enable Telemetry
        </label>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="updateCheck"
          className={`mr-2 ${theme.accentColor}`} 
          checked={formSettings.updateCheck !== false} // Default to true if undefined
          onChange={(e) => handleInputChange('updateCheck', e.target.checked)}
        />
        <label htmlFor="updateCheck" className={theme.foreground}>
          Check for Updates Automatically
        </label>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="crashReports"
          className={`mr-2 ${theme.accentColor}`} 
          checked={formSettings.crashReports !== false} // Default to true if undefined
          onChange={(e) => handleInputChange('crashReports', e.target.checked)}
        />
        <label htmlFor="crashReports" className={theme.foreground}>
          Send Crash Reports
        </label>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="autoUpdate"
          className={`mr-2 ${theme.accentColor}`} 
          checked={formSettings.autoUpdate !== false} // Default to true if undefined
          onChange={(e) => handleInputChange('autoUpdate', e.target.checked)}
        />
        <label htmlFor="autoUpdate" className={theme.foreground}>
          Auto-Update Extensions
        </label>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className={`mb-4 font-medium ${theme.foreground}`}>Data & Reset</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            className={`px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm ${theme.foreground}`}
            onClick={() => {
              // This would be implemented in the main application
              console.log('Clear local storage');
            }}
          >
            Clear Application Data
          </button>
          
          <button
            className={`px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm ${theme.foreground}`}
            onClick={() => {
              // This would be implemented in the main application
              console.log('Reset to default settings');
            }}
          >
            Reset All Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTab; 
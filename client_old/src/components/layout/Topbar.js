import React, { useState, useEffect, useRef } from 'react';
import { 
  FaChevronDown, 
  FaFile, 
  FaFolder, 
  FaSave, 
  FaCog, 
  FaWindowClose, 
  FaSearch, 
  FaTerminal,
  FaCode,
  FaBug,
  FaList,
  FaPalette,
  FaCheck
} from 'react-icons/fa';

import { GrHelpBook } from "react-icons/gr";
import { GoThreeBars } from 'react-icons/go';
import { VscLayoutSidebarLeft } from "react-icons/vsc";
import { VscLayoutSidebarRight } from "react-icons/vsc";
import { GiHamburgerMenu } from "react-icons/gi";
import ThemeService from '../../themes/ThemeService';

const Topbar = ({ 
  theme,
  toggleTheme,
  toggleGlobalSearch,
  toggleLeftSidebar,
  toggleRightSidebar,
  toggleTerminal,
  showSettings,
  leftSidebarOpen,
  rightSidebarOpen,
  terminalOpen,
  setLeftSidebarOpen,
  setRightSidebarOpen,
  setTerminalOpen
}) => {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [themeSubmenuOpen, setThemeSubmenuOpen] = useState(false);
  const [activeThemeOption, setActiveThemeOption] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const menuRef = useRef(null);
  
  // Detect if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkIfMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setFileMenuOpen(false);
        setEditMenuOpen(false);
        setViewMenuOpen(false);
        setHelpMenuOpen(false);
        setSettingsMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = (menu, event) => {
    // Stop event propagation to prevent immediate closing

    if (event) event.stopPropagation();
    
    switch (menu) {
      case 'file':
        setFileMenuOpen(!fileMenuOpen);
        setEditMenuOpen(false);
        setViewMenuOpen(false);
        setHelpMenuOpen(false);
        break;
      case 'edit':
        setFileMenuOpen(false);
        setEditMenuOpen(!editMenuOpen);
        setViewMenuOpen(false);
        setHelpMenuOpen(false);
        break;
      case 'view':
        setFileMenuOpen(false);
        setEditMenuOpen(false);
        setViewMenuOpen(!viewMenuOpen);
        setHelpMenuOpen(false);
        break;
      case 'help':
        setFileMenuOpen(false);
        setEditMenuOpen(false);
        setViewMenuOpen(false);
        setHelpMenuOpen(!helpMenuOpen);
        break;
      default:
        break;
    }
  };

  // Helper function for toggle functions to handle if setters aren't provided
  const handleToggleLeftSidebar = (e) => {
    if (e) e.stopPropagation(); // Stop event propagation
    
    if (typeof toggleLeftSidebar === 'function') {
      toggleLeftSidebar();
    } else if (typeof setLeftSidebarOpen === 'function') {
      setLeftSidebarOpen(prevState => !prevState);
    } else {
      console.warn('Neither toggleLeftSidebar nor setLeftSidebarOpen function is provided as a prop');
    }
  };

  const handleToggleRightSidebar = (e) => {
    if (e) e.stopPropagation(); // Stop event propagation
    
    if (typeof toggleRightSidebar === 'function') {
      toggleRightSidebar();
    } else if (typeof setRightSidebarOpen === 'function') {
      setRightSidebarOpen(prevState => !prevState);
    } else {
      console.warn('Neither toggleRightSidebar nor setRightSidebarOpen function is provided as a prop');
    }
  };
  
  const handleToggleTerminal = (e) => {
    if (e) e.stopPropagation(); // Stop event propagation
    
    if (typeof toggleTerminal === 'function') {
      toggleTerminal();
    } else if (typeof setTerminalOpen === 'function') {
      setTerminalOpen(prevState => !prevState);
    } else {
      console.warn('Neither toggleTerminal nor setTerminalOpen function is provided as a prop');
    }
  };

  // Helper function to render menus
  const renderMenuItems = (items, onItemClick) => {
    return items.map((item, index) => (
      <div 
        key={index} 
        className={`px-4 py-1 text-sm cursor-pointer flex items-center justify-between ${theme.menuItemBackground} hover:${theme.menuItemHoverBackground}`}
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          onItemClick(item);
        }}
      >
        <div className="flex items-center">
          {item.icon && <span className="mr-2">{item.icon}</span>}
          <span>{item.label}</span>
        </div>
        {item.shortcut && <span className="text-xs text-gray-500 ml-10">{item.shortcut}</span>}
      </div>
    ));
  };

  // File menu options
  const fileOptions = [
    { id: 'new', label: 'New File', shortcut: 'Ctrl+N', icon: <FaFile /> },
    { id: 'open', label: 'Open...', shortcut: 'Ctrl+O', icon: <FaFolder /> },
    { id: 'save', label: 'Save', shortcut: 'Ctrl+S', icon: <FaSave /> },
    { id: 'saveAs', label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
    { id: 'saveAll', label: 'Save All', shortcut: 'Ctrl+K S' },
    { id: 'exit', label: 'Exit', shortcut: 'Alt+F4' }
  ];

  // Edit menu options
  const editOptions = [
    { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z' },
    { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Y' },
    { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
    { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
    { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
    { id: 'find', label: 'Find', shortcut: 'Ctrl+F', icon: <FaSearch /> },
    { id: 'replace', label: 'Replace', shortcut: 'Ctrl+H' }
  ];

  // View menu options with updated action handlers
  const viewOptions = [
    { id: 'explorer', label: 'Explorer', shortcut: 'Ctrl+Shift+E', icon: <VscLayoutSidebarLeft />, action: handleToggleLeftSidebar },
    { id: 'search', label: 'Search', shortcut: 'Ctrl+Shift+F', icon: <FaSearch />, action: toggleGlobalSearch },
    { id: 'debug', label: 'Run and Debug', shortcut: 'Ctrl+Shift+D', icon: <FaBug /> },
    { id: 'output', label: 'Output', shortcut: 'Ctrl+Shift+U', icon: <FaList /> },
    { id: 'problems', label: 'Problems', shortcut: 'Ctrl+Shift+M', icon: <FaCode /> },
    { id: 'terminal', label: 'Terminal', shortcut: 'Ctrl+`', icon: <FaTerminal />, action: handleToggleTerminal },
    { id: 'settings', label: 'Settings', shortcut: 'Ctrl+,', icon: <FaCog className={theme.iconColor} />, action: showSettings }
  ];

  // Help menu options
  const helpOptions = [
    { id: 'welcome', label: 'Welcome', shortcut: '' },
    { id: 'documentation', label: 'Documentation', shortcut: 'Ctrl+Tab' },
    { id: 'about', label: 'About', shortcut: '' }
  ];

  // Handle menu item click
  const handleMenuItemClick = (item) => {
    // Close the menu
    setFileMenuOpen(false);
    setEditMenuOpen(false);
    setViewMenuOpen(false);
    setHelpMenuOpen(false);
    
    // Execute action if available
    if (item.action && typeof item.action === 'function') {
      item.action();
    } else {
      console.log(`Clicked: ${item.label}`);
    }
  };

  // search bar component with enhanced appearance
  const renderSearchBar = () => {
    return (
      <div className="hidden md:flex items-center justify-center absolute left-0 right-0 mx-auto my-1">
        <div 
          className={`pointer-events-auto text-sm w-64 lg:w-80 h-[22px] font-medium flex items-center gap-2 border ${theme.inputBorder} rounded-md px-3 py-1 ${theme.inputBackground} cursor-pointer hover:${theme.inputHoverBorder} transition-colors duration-150`} 
          onClick={(e) => {
            e.stopPropagation();
            if (typeof toggleGlobalSearch === 'function') {
              toggleGlobalSearch();
            } else {
              console.warn('toggleGlobalSearch function is not provided as a prop');
            }
          }}
        >
          <FaSearch className={theme.descriptionForeground} size={12} />
          <span className={`text-xs ${theme.descriptionForeground}`}>Search anything... (Ctrl+P)</span>
        </div>
      </div>
    );
  };

  // Toggle settings menu
  const toggleSettingsMenu = (e) => {
    if (e) e.stopPropagation();
    setSettingsMenuOpen(!settingsMenuOpen);
    // Close other menus
    setFileMenuOpen(false);
    setEditMenuOpen(false);
    setViewMenuOpen(false);
    setHelpMenuOpen(false);
  };

  // Define available themes
  const themeOptions = [
    { id: 'dark', label: 'Dark Theme' },
    { id: 'light', label: 'Light Theme' },
    { id: 'high-contrast', label: 'High Contrast' },
  ];

  // Get the current theme name based on theme object
  const getCurrentThemeName = () => {
    if (!theme) return 'Select';
    
    // If the theme has an id property, use it for identification
    if (theme.id) {
      // Map theme id to display name
      const themeMap = {
        'dark': 'Dark Theme',
        'light': 'Light Theme',
        'high-contrast': 'High Contrast',
      };
      return themeMap[theme.id] || theme.id;
    }
    
    // If the theme has a name property, use it directly
    if (theme.name) return theme.name;
    
    // Fallback detection based on background color
    if (theme.background && theme.background.includes('gray-900')) return 'Dark Theme';
    if (theme.background && theme.background.includes('gray-100')) return 'Light Theme';
    
    return 'Select';
  };

  // Check if a theme is the current active theme
  const isActiveTheme = (themeOption) => {
    if (!theme) return false;
    
    // Direct id comparison
    if (theme.id && theme.id === themeOption.id) return true;
    
    // Name comparison
    if (getCurrentThemeName() === themeOption.label) return true;
    
    return false;
  };

  // Handle theme selection
  const handleThemeSelect = (themeId) => {
    if (typeof toggleTheme === 'function') {
      toggleTheme(themeId);
    }
    setSettingsMenuOpen(false);
  };

  // Settings menu options 
  const settingsOptions = [
    { 
      id: 'theme', 
      label: 'Theme', 
      icon: <FaPalette className={theme.iconColor} />,
      submenu: true,
      currentValue: getCurrentThemeName()
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <FaCog className={theme.iconColor} />,
      action: showSettings 
    },
  ];
      
  return (
    <div className={`flex flex-col ${theme.titleBarBackground} ${theme.titleBarForeground}`} ref={menuRef}>
      {/* Main menu bar */}
      <div className="flex justify-between h-7 px-2">
        {/* Left side: App icon and menu */}
        <div className="flex items-center">
          {/* App icon + Mobile hamburger */}
          <div className="md:hidden mr-2">
            <button 
              className={`p-1 rounded focus:outline-none hover:${theme.buttonHoverBackground}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <GiHamburgerMenu className={theme.titleBarForeground} size={16} />
            </button>
          </div>

          {/* Application name for desktop */}
          <div className="hidden md:flex items-center mr-2">
            <FaCode className={`${theme.iconActiveColor} mr-1`} />
            <span className="text-sm font-medium">Web IDE</span>
          </div>
          
          {/* Menu items */}
          <div className="hidden md:flex md:z-50">
            <button 
              className={`px-3 py-1 text-sm ${fileMenuOpen ? `${theme.menuActiveBackground} ${theme.foreground}` : ''} hover:${theme.menuItemHoverBackground}`}
              onClick={(e) => {
                console.log('file menu clicked');
                e.stopPropagation();
                toggleMenu('file', e);
                console.log('file menu clicked');
              }}
            >
              File
            </button>
            <button 
              className={`px-3 py-1 text-sm ${editMenuOpen ? `${theme.menuActiveBackground} ${theme.foreground}` : ''} hover:${theme.menuItemHoverBackground}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu('edit', e);
              }}
            >
              Edit
            </button>
            <button 
              className={`px-3 py-1 text-sm ${viewMenuOpen ? `${theme.menuActiveBackground} ${theme.foreground}` : ''} hover:${theme.menuItemHoverBackground}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu('view', e);
              }}
            >
              View
            </button>
            <button 
              className={`px-3 py-1 text-sm ${helpMenuOpen ? `${theme.menuActiveBackground} ${theme.foreground}` : ''} hover:${theme.menuItemHoverBackground}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu('help', e);
              }}
            >
              Help
            </button>
          </div>
        </div>
        
        {/* search bar */}
        {renderSearchBar()}
        
        {/* Right side: Action buttons */}
        <div className="flex items-center space-x-2 md:z-50">
          {/* Right action buttons shown on desktop */}
          <div className="hidden md:flex items-center space-x-1">
            <button 
              className={`p-1 rounded-sm focus:outline-none hover:${theme.buttonHoverBackground} ${leftSidebarOpen ? theme.iconActiveColor : ''}`}
              onClick={(e) => handleToggleLeftSidebar(e)}
              title="Toggle Left Sidebar"
            >
              <VscLayoutSidebarLeft className={leftSidebarOpen ? theme.iconActiveColor : theme.titleBarForeground} size={16} />
            </button>
            <button 
              className={`p-1 rounded-sm focus:outline-none rotate-90 hover:${theme.buttonHoverBackground} ${terminalOpen ? theme.iconActiveColor : ''}`}
              onClick={(e) => handleToggleTerminal(e)}
              title="Toggle Terminal"
            >
              <VscLayoutSidebarRight className={terminalOpen ? theme.iconActiveColor : theme.titleBarForeground} size={16} />
            </button>
            <button 
              className={`p-1 rounded-sm focus:outline-none hover:${theme.buttonHoverBackground} ${rightSidebarOpen ? theme.iconActiveColor : ''}`}
              onClick={(e) => handleToggleRightSidebar(e)}
              title="Toggle Right Sidebar"
            >
              <VscLayoutSidebarRight className={rightSidebarOpen ? theme.iconActiveColor : theme.titleBarForeground} size={16} />
            </button>
            
            {/* Settings dropdown button */}
            <div className="relative">
              <button 
                className={`p-1 rounded-sm focus:outline-none hover:${theme.buttonHoverBackground} ${settingsMenuOpen ? theme.buttonHoverBackground : ''}`}
                onClick={(e) => toggleSettingsMenu(e)}
                title="Settings & Preferences"
              >
                <FaCog className={`${theme.titleBarForeground} ${settingsMenuOpen ? theme.iconActiveColor : ''}`} size={16} />
              </button>
              
              {/* Settings dropdown menu */}
              {settingsMenuOpen && (
                <div className={`absolute top-full right-0 mt-1 w-56 shadow-lg border ${theme.menuBorder} ${theme.menuBackground} z-50 rounded-md overflow-hidden`}>
                  {settingsOptions.map((option, idx) => (
                    <div key={idx}>
                      <button
                        className={`flex items-center w-full px-4 py-2 text-sm ${theme.foreground} hover:${theme.menuItemHoverBackground}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (option.submenu) {
                            setThemeSubmenuOpen(!themeSubmenuOpen);
                            setActiveThemeOption(option.id);
                          } else {
                            setSettingsMenuOpen(false);
                            if (option.action && typeof option.action === 'function') {
                              option.action();
                            }
                          }
                        }}
                      >
                        {option.icon && <span className="mr-2">{option.icon}</span>}
                        <span>{option.label}</span>
                        {option.currentValue && (
                          <span className={`ml-auto text-xs ${theme.descriptionForeground}`}>
                            {option.currentValue}
                          </span>
                        )}
                        {option.submenu && <FaChevronDown className={`ml-2 ${theme.descriptionForeground}`} size={10} />}
                      </button>
                      
                      {/* Theme submenu */}
                      {themeSubmenuOpen && option.id === activeThemeOption && option.id === 'theme' && (
                        <div className={`border-t ${theme.menuBorder}`}>
                          {themeOptions.map((themeOption, themeIdx) => (
                            <button
                              key={themeIdx}
                              className={`flex items-center w-full px-6 py-2 text-sm ${theme.foreground} ${isActiveTheme(themeOption) ? theme.menuActiveBackground : ''} hover:${theme.menuItemHoverBackground}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleThemeSelect(themeOption.id);
                              }}
                            >
                              {isActiveTheme(themeOption) && (
                                <span className="mr-2">✓</span>
                              )}
                              <span className={isActiveTheme(themeOption) ? "font-medium" : ""}>{themeOption.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className={`md:hidden absolute top-7 left-0 right-0 ${theme.menuBackground} z-50 border-b ${theme.menuBorder}`}>
          {/* Main menu items for mobile */}
          <div className="grid grid-cols-4 gap-1 p-2 border-b border-gray-700">
            <button 
              className={`flex flex-col items-center justify-center p-2 rounded text-center ${fileMenuOpen ? theme.menuActiveBackground : ''} hover:${theme.menuItemHoverBackground}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu('file', e);
              }}
            >
              <FaFile size={18} className={theme.iconColor} />
              <span className={`text-xs mt-1 ${theme.foreground}`}>File</span>
            </button>
            <button 
              className={`flex flex-col items-center justify-center p-2 rounded text-center ${editMenuOpen ? theme.menuActiveBackground : ''} hover:${theme.menuItemHoverBackground}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu('edit', e);
              }}
            >
              <FaCode size={18} className={theme.iconColor} />
              <span className={`text-xs mt-1 ${theme.foreground}`}>Edit</span>
            </button>
            <button 
              className={`flex flex-col items-center justify-center p-2 rounded text-center ${viewMenuOpen ? theme.menuActiveBackground : ''} hover:${theme.menuItemHoverBackground}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu('view', e);
              }}
            >
              <FaList size={18} className={theme.iconColor} />
              <span className={`text-xs mt-1 ${theme.foreground}`}>View</span>
            </button>
            <button 
              className={`flex flex-col items-center justify-center p-2 rounded text-center ${helpMenuOpen ? theme.menuActiveBackground : ''} hover:${theme.menuItemHoverBackground}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu('help', e);
              }}
            >
              <GrHelpBook size={18} className={theme.iconColor} />
              <span className={`text-xs mt-1 ${theme.foreground}`}>Help</span>
            </button>
          </div>
          
          {/* Quick action buttons */}
          <div className="p-2 grid grid-cols-4 gap-2">
            <button 
              className={`flex flex-col items-center justify-center p-2 rounded text-center hover:${theme.menuItemHoverBackground}`}
              onClick={(e) => handleToggleLeftSidebar(e)}
            >
              <VscLayoutSidebarLeft size={20} className={theme.iconColor} />
              <span className={`text-xs mt-1 ${theme.foreground}`}>Explorer</span>
            </button>
            <button 
              className={`flex flex-col items-center justify-center p-2 rounded text-center hover:${theme.menuItemHoverBackground}`}
              onClick={(e) => {
                e.stopPropagation();
                if (typeof toggleGlobalSearch === 'function') {
                  toggleGlobalSearch();
                }
              }}
            >
              <FaSearch size={18} className={theme.iconColor} />
              <span className={`text-xs mt-1 ${theme.foreground}`}>Search</span>
            </button>
            <button 
              className={`flex flex-col items-center justify-center p-2 rounded text-center hover:${theme.menuItemHoverBackground}`}
              onClick={(e) => handleToggleTerminal(e)}
            >
              <span className="rotate-90">
                <VscLayoutSidebarRight size={20} className={theme.iconColor} />
              </span>
              <span className={`text-xs mt-1 ${theme.foreground}`}>Terminal</span>
            </button>
            <button 
              className={`flex flex-col items-center justify-center p-2 rounded text-center hover:${theme.menuItemHoverBackground}`}
              onClick={(e) => handleToggleRightSidebar(e)}
            >
              <VscLayoutSidebarRight size={20} className={theme.iconColor} />
              <span className={`text-xs mt-1 ${theme.foreground}`}>Assistant</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Make sure menu dropdowns are visible on mobile too */}
      {fileMenuOpen && (
        <div className={`absolute ${isMobile ? 'top-[85px]' : 'top-7'} md:left-2 w-full md:w-56 shadow-lg border ${theme.menuBorder} ${theme.menuBackground} z-50`}>
          {renderMenuItems(fileOptions, handleMenuItemClick)}
        </div>
      )}
      
      {/* View menu dropdown */}
      {viewMenuOpen && (
        <div className={`absolute ${isMobile ? 'top-[85px]' : 'top-7'} ${isMobile ? 'left-0' : 'left-[108px]'} w-full md:w-56 shadow-lg border ${theme.menuBorder} ${theme.menuBackground} z-50`}>
          {renderMenuItems(viewOptions, handleMenuItemClick)}
        </div>
      )}
      
      {/* Edit menu dropdown */}
      {editMenuOpen && (
        <div className={`absolute ${isMobile ? 'top-[85px]' : 'top-7'} ${isMobile ? 'left-0' : 'left-[76px]'} w-full md:w-56 shadow-lg border ${theme.menuBorder} ${theme.menuBackground} z-50`}>
          {renderMenuItems(editOptions, handleMenuItemClick)}
        </div>
      )}
      
      {/* Help menu dropdown */}
      {helpMenuOpen && (
        <div className={`absolute ${isMobile ? 'top-[85px]' : 'top-7'} ${isMobile ? 'left-0' : 'left-[152px]'} w-full md:w-56 shadow-lg border ${theme.menuBorder} ${theme.menuBackground} z-50`}>
          {renderMenuItems(helpOptions, handleMenuItemClick)}
        </div>
      )}
    </div>
  );
};

export default Topbar; 
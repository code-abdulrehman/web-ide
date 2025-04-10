import React, { useState , useEffect} from 'react';
import { 
  FaTerminal, 
  FaCode, 
  FaGithub, 
  FaBell, 
  FaBug,
  FaCheckCircle,
  FaExclamationTriangle,
  FaWrench,
  FaPalette,
  FaColumns,
  FaRobot,
  FaSearch
} from 'react-icons/fa';
import { TbLayoutSidebarLeftCollapse } from 'react-icons/tb';

const Statusbar = ({ 
  terminalOpen, 
  setTerminalOpen, 
  leftSidebarOpen,
  setLeftSidebarOpen,
  rightSidebarOpen,
  setRightSidebarOpen,
  theme, 
  toggleTheme,
  toggleGlobalSearch
}) => {
  const handleTerminalToggle = () => {
    setTerminalOpen(!terminalOpen);
  };

const getConnectionStatus = () => {
  if (!navigator.onLine) {
    return {
      effectiveType: null,
      downlink: 0,
      rtt: null,
      saveData: false,
      online: false
    };
  }

  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const { effectiveType, downlink, rtt, saveData } = connection;
    return {
      effectiveType,
      downlink,
      rtt,
      saveData,
      online: true
    };
  } else {
    return {
      effectiveType: null,
      downlink: 0,
      rtt: null,
      saveData: false,
      online: true
    };
  }
};


const [connectionInfo, setConnectionInfo] = useState(getConnectionStatus());

useEffect(() => {
  const updateConnection = () => setConnectionInfo(getConnectionStatus());

  window.addEventListener('online', updateConnection);
  window.addEventListener('offline', updateConnection);

  const interval = setInterval(updateConnection, 1000); // optional, if you want to keep refreshing
  return () => {
    window.removeEventListener('online', updateConnection);
    window.removeEventListener('offline', updateConnection);
    clearInterval(interval);
  };
}, []);

  return (
    <div className={`h-6 text-xs flex items-center ${theme.statusBarBackground}`}>
      {/* Left section */}
        <div className="flex items-center w-[60px] bg-opacity-50 h-6 shadow-md flex justify-center cursor-default" title={connectionInfo?.downlink + " " + connectionInfo?.rtt + " ms"}>
          <span className={theme.statusBarForeground+ " uppercase text-xs"}>
            {(connectionInfo?.effectiveType ? (<div className="flex items-center gap-1">
            <div className="bg-green-500 animation-ping h-2 w-2 rounded-full"></div>  {connectionInfo?.effectiveType} </div>) : (<div className="flex items-center gap-1">
            <div className="bg-red-500 animation-ping h-2 w-2 rounded-full"></div>  off</div>))} 
            </span>
        </div>

      <div className="space-x-4 flex items-center px-2 w-full ">
        <div className="flex items-center gap-[1px]">
          <FaGithub className={`"mr-1 text-[10px] " + ${theme.statusBarForeground}`} />
          <span className={theme.statusBarForeground}>main</span>
        </div>
        <div className="flex items-center">
          <FaExclamationTriangle className="mr-1 text-yellow-500" />
          <span className={theme.statusBarForeground}>0</span>
          <FaCheckCircle className="mx-1 ml-2 text-green-500" />
          <span className={theme.statusBarForeground}>0</span>
        </div>
      </div>
      
      {/* Right section */}
      <div className="flex items-center space-x-4">
        <div 
          className={`flex items-center flex gap-[1.5px] cursor-pointer hover:${theme.statusBarItemHoverBackground} px-1`} 
          onClick={toggleTheme}
          title="Toggle Color Theme (Ctrl+K Ctrl+T)"
        >
          <FaPalette className={`"mr-1 text-[10px] " + ${theme.statusBarForeground}`} />
          <span className={theme.statusBarForeground}>Theme</span>
        </div>
        
        <div 
          className={`hidden md:flex items-center flex gap-[1.5px] cursor-pointer hover:${theme.statusBarItemHoverBackground} px-1`}
          title="Global Search (Ctrl+P)"
          onClick={toggleGlobalSearch}
        >
          <FaSearch className={`"mr-1 text-[10px] " + ${theme.statusBarForeground}`} />
          <span className={theme.statusBarForeground}>Search</span>
        </div>
        
        
        <div className={`flex items-center flex gap-[1.5px] cursor-pointer hover:${theme.statusBarItemHoverBackground} px-1`}>
          <FaBell className={`"mr-1 text-[10px] " + ${theme.statusBarForeground}`} />
        </div>
        
        <div 
          className={`hidden md:flex items-center flex gap-[1.5px] cursor-pointer hover:${theme.statusBarItemHoverBackground} px-1 ${leftSidebarOpen ? theme.statusBarItemActiveBackground : ''}`}
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          title="Toggle Explorer (Ctrl+B)"
        >
          <TbLayoutSidebarLeftCollapse className={`"mr-1 text-[10px] " + ${theme.statusBarForeground}`} />
          <span className={theme.statusBarForeground}>Explorer</span>
        </div>
        
        <div 
          className={`hidden md:flex items-center flex gap-[1.5px] cursor-pointer hover:${theme.statusBarItemHoverBackground} px-1 ${rightSidebarOpen ? theme.statusBarItemActiveBackground : ''}`}
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          title="Toggle Sidebar"
        >
          <FaRobot className={`"mr-1 text-[10px] " + ${theme.statusBarForeground}`} />
          <span className={theme.statusBarForeground}>AI</span>
        </div>
        
        <div 
          className={`flex items-center flex gap-[1.5px] cursor-pointer hover:${theme.statusBarItemHoverBackground} px-1 ${terminalOpen ? theme.statusBarItemActiveBackground : ''}`}
          onClick={handleTerminalToggle}
          title="Toggle Terminal (Ctrl+`)"
        >
          <FaTerminal className={`"mr-1 text-[10px] " + ${theme.statusBarForeground}`} />
          <span className={theme.statusBarForeground}>Terminal</span>
        </div>
      </div>
    </div>
  );
};

export default Statusbar; 
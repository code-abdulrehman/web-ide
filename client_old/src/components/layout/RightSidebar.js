import React, { useState, useEffect, useCallback } from 'react';
import { FaRobot, FaTimes } from 'react-icons/fa';
import Chatbot from './Chatbot';

const RightSidebar = ({ isOpen, setIsOpen, theme, width = 280, onWidthChange, minWidth }) => {
  const [isResizing, setIsResizing] = useState(false);
  
  if (!isOpen) return null;
  
  // Resize handler for the sidebar
  const startResize = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    // Calculate new width based on mouse position
    // For right sidebar, we want to resize from right to left
    const windowWidth = window.innerWidth;
    const newWidth = Math.max(minWidth, Math.min(450, windowWidth - e.clientX));
    
    if (onWidthChange) {
      onWidthChange(newWidth);
    }
  }, [isResizing, onWidthChange]);

  const stopResize = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResize);
  }, [handleMouseMove]);

  // Cleanup resize event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [handleMouseMove, stopResize]);
  
  return (
    <div className={`h-full flex flex-col overflow-hidden relative ${theme.sidebarBackground} border-l-[1px] ${theme.tabBorder}`} style={{ width: `${width}px`, minWidth: '200px', maxWidth: '450px' }}>
      {/* Resize handle */}
      <div 
        className={`h-full cursor-col-resize hover:opacity-80 active:border-blue-600 active:opacity-100 absolute left-0 top-0 z-10 ${isResizing ? 'border-blue-500' : ''}`}
        onMouseDown={startResize}
        title="Drag to resize sidebar"
      ></div>
      
      {/* Chatbot content */}
      <div className="flex-1 h-full overflow-hidden">
        <Chatbot theme={theme} onClose={() => setIsOpen(false)} />
      </div>
    </div>
  );
};

export default RightSidebar; 
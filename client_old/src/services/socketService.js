import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

// Create a singleton socket instance
let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Initialize socket connection
export const initSocket = () => {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    
    // Setup global socket error handlers
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      reconnectAttempts++;
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached, giving up');
        socket.disconnect();
      }
    });
    
    socket.on('connect', () => {
      console.log('Socket connected successfully');
      reconnectAttempts = 0; // Reset counter on successful connection
    });
    
    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  }
  
  return socket;
};

// Connect to socket
export const connectSocket = () => {
  const socket = initSocket();
  if (!socket.connected) {
    socket.connect();
    console.log('Socket connection initiated');
  }
  return socket;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
    console.log('Socket disconnected');
  }
};

// Join a file editing room
export const joinFileEditingRoom = (filePath) => {
  const roomId = `file:${filePath}`;
  if (socket && socket.connected) {
    socket.emit('join-room', roomId);
    console.log(`Joined editing room for ${filePath}`);
    return roomId;
  } else {
    console.warn('Cannot join room - socket not connected');
    // Try to reconnect
    connectSocket();
    return null;
  }
};

// Send code changes through socket
export const sendCodeChanges = (filePath, code, language = 'javascript') => {
  const roomId = `file:${filePath}`;
  if (socket && socket.connected) {
    try {
      socket.emit('code-change', {
        roomId,
        code,
        language,
        timestamp: Date.now(),
      });
      return true;
    } catch (error) {
      console.error('Error sending code changes:', error);
      return false;
    }
  } else {
    console.warn('Cannot send changes - socket not connected');
    return false;
  }
};

// Send patch of changes (more efficient than sending entire file)
export const sendCodePatch = (filePath, patches, language = 'javascript') => {
  const roomId = `file:${filePath}`;
  if (socket && socket.connected) {
    try {
      socket.emit('code-patch', {
        roomId,
        patches,
        language,
        timestamp: Date.now(),
      });
      return true;
    } catch (error) {
      console.error('Error sending code patches:', error);
      return false;
    }
  } else {
    console.warn('Cannot send patches - socket not connected');
    return false;
  }
};

// Save file changes to server
export const saveFileChanges = (filePath) => {
  if (socket && socket.connected) {
    try {
      socket.emit('save-file', { path: filePath });
      console.log(`Save request sent for ${filePath}`);
      return true;
    } catch (error) {
      console.error('Error sending save request:', error);
      return false;
    }
  } else {
    console.warn('Cannot save file - socket not connected');
    // Try to reconnect and schedule a retry
    const socketInstance = connectSocket();
    if (socketInstance) {
      setTimeout(() => {
        if (socketInstance.connected) {
          socketInstance.emit('save-file', { path: filePath });
          console.log(`Retry save request sent for ${filePath}`);
        }
      }, 1000);
    }
    return false;
  }
};

// Hook to manage socket connection for a file
export const useFileEditingSocket = (filePath) => {
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [lastError, setLastError] = useState(null);
  
  useEffect(() => {
    if (!filePath) return;
    
    // Initialize and connect socket
    const socket = connectSocket();
    
    // Handle connection events
    const handleConnect = () => {
      setIsConnected(true);
      setLastError(null);
      joinFileEditingRoom(filePath);
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
      setCollaborators([]);
    };
    
    const handleError = (err) => {
      setLastError(err);
      console.error('Socket error in hook:', err);
    };
    
    // Handle collaborator joined
    const handleUserJoined = ({ socketId }) => {
      setCollaborators(prev => [...prev, socketId]);
    };
    
    // Handle user left
    const handleUserLeft = ({ socketId }) => {
      setCollaborators(prev => prev.filter(id => id !== socketId));
    };
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    
    // If already connected when hook mounts, join the room
    if (socket.connected) {
      handleConnect();
    }
    
    // Cleanup on unmount
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [filePath]);
  
  return { isConnected, collaborators, lastError };
};

export default {
  initSocket,
  connectSocket,
  disconnectSocket,
  joinFileEditingRoom,
  sendCodeChanges,
  sendCodePatch,
  saveFileChanges,
  useFileEditingSocket,
}; 
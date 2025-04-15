/**
 * Handle code editing socket events
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 */
import fs from 'fs';
import path from 'path';
import { applyPatches, ensureDirectoryExists } from '../utils/fileUtils.js';
import CodeSnippet from '../code-store/codeRepository.js';

// Cache to store ongoing edits before saving to disk
const fileEditCache = new Map();

// File lock mechanism to prevent race conditions
const fileLocks = new Map();

// Debounce timers for code repository updates
const codeUpdateTimers = new Map();
const CODE_UPDATE_DEBOUNCE = 5000; // 5 seconds debounce

// Clean up stale cached files periodically (older than 1 hour)
setInterval(() => {
  const now = Date.now();
  for (const [filePath, data] of fileEditCache.entries()) {
    if (now - data.lastModified > 3600000) { // 1 hour
      console.log(`Removing stale cache for: ${filePath}`);
      fileEditCache.delete(filePath);
      
      // Clear any pending update timers
      if (codeUpdateTimers.has(filePath)) {
        clearTimeout(codeUpdateTimers.get(filePath));
        codeUpdateTimers.delete(filePath);
      }
    }
  }
}, 300000); // Check every 5 minutes

// Function to update code in MongoDB and file system
const updateCodeRepository = async (filePath, content, language) => {
  try {
    // First handle the filesystem save which is more critical
    try {
      // Determine appropriate path in code-store/code directory
      const codeStorePath = path.join(process.cwd(), 'code-store', 'code');
      
      // Handle paths - determine whether to use user project or keep original structure
      const parts = filePath.split('/');
      const projectIndex = parts.findIndex(part => 
        part === 'projects' || 
        part === 'workspace'
      );
      
      let storeFilePath;
      if (projectIndex >= 0) {
        // Use original structure
        storeFilePath = path.join(codeStorePath, parts.slice(projectIndex).join('/'));
      } else {
        // Default to user project directory
        const fileName = path.basename(filePath);
        storeFilePath = path.join(codeStorePath, 'user project', fileName);
      }
      
      // Create directory if it doesn't exist
      const dir = path.dirname(storeFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write file to the code store
      await fs.promises.writeFile(storeFilePath, content, 'utf8');
      console.log(`File saved to code store: ${storeFilePath}`);
    } catch (fsError) {
      console.error(`Error saving to filesystem in code store: ${fsError.message}`);
      // Don't throw here - we want to continue with MongoDB if possible
    }

    // Now try to save to MongoDB but don't let it block the function if it fails
    try {
      // Extract file name without path
      const fileName = path.basename(filePath);
      
      // Find existing code snippet or create new one
      let codeSnippet = await CodeSnippet.findOne({ title: fileName });
      
      if (codeSnippet) {
        // Update existing snippet
        codeSnippet.content = content;
        codeSnippet.language = language || codeSnippet.language;
        codeSnippet.updatedAt = new Date();
      } else {
        // Create new code snippet
        codeSnippet = new CodeSnippet({
          title: fileName,
          content: content,
          language: language || 'text',
          isPublic: false // Default to private
        });
      }
      
      await codeSnippet.save();
      console.log(`Code repository updated for: ${fileName}`);
    } catch (dbError) {
      console.error(`MongoDB error updating code repository for ${filePath}:`, dbError);
      // Don't throw - we already saved to filesystem
    }
    
    return true;
  } catch (error) {
    console.error(`Unhandled error in updateCodeRepository for ${filePath}:`, error);
    return false;
  }
};

export const handleCodeEditing = (socket, io) => {
  // Track files being edited by this socket
  const editingSessions = new Set();
  
  // Join a code editing room
  socket.on('join-room', (roomId) => {
    try {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
      
      // Track this file as being edited
      if (roomId.startsWith('file:')) {
        const filePath = roomId.substring(5); // Remove 'file:' prefix
        editingSessions.add(filePath);
        
        // If file is not in cache yet, load it
        if (!fileEditCache.has(filePath) && fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            fileEditCache.set(filePath, {
              content,
              lastModified: Date.now(),
              language: filePath.split('.').pop() || 'text'
            });
          } catch (err) {
            console.error(`Error loading file into cache: ${filePath}`, err);
          }
        }
      }
      
      // Notify others that someone joined
      socket.to(roomId).emit('user-joined', { socketId: socket.id });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { 
        message: `Failed to join room: ${error.message}`,
      });
    }
  });
  
  // Handle code changes
  socket.on('code-change', (data) => {
    try {
      // Store the latest code in memory cache
      if (data.roomId.startsWith('file:')) {
        const filePath = data.roomId.substring(5); // Remove 'file:' prefix
        const language = data.language || filePath.split('.').pop() || 'text';
        
        fileEditCache.set(filePath, {
          content: data.code,
          lastModified: Date.now(),
          language
        });
        
        // Clear any existing timer for this file
        if (codeUpdateTimers.has(filePath)) {
          clearTimeout(codeUpdateTimers.get(filePath));
        }
        
        // Set a new timer to update code repository after 5 seconds of inactivity
        const timerId = setTimeout(async () => {
          await updateCodeRepository(filePath, data.code, language);
          codeUpdateTimers.delete(filePath);
        }, CODE_UPDATE_DEBOUNCE);
        
        codeUpdateTimers.set(filePath, timerId);
      }
      
      // Broadcast code changes to others in the same room
      socket.to(data.roomId).emit('code-update', {
        code: data.code,
        language: data.language,
        changeBy: socket.id
      });
    } catch (error) {
      console.error('Error handling code change:', error);
      socket.emit('error', { 
        message: `Failed to process code change: ${error.message}`,
      });
    }
  });
  
  // Handle efficient code patches
  socket.on('code-patch', (data) => {
    try {
      if (data.roomId.startsWith('file:')) {
        const filePath = data.roomId.substring(5); // Remove 'file:' prefix
        
        // Get current content from cache or load from file
        let currentContent;
        if (fileEditCache.has(filePath)) {
          currentContent = fileEditCache.get(filePath).content;
        } else {
          try {
            currentContent = fs.readFileSync(filePath, 'utf8');
          } catch (err) {
            console.error(`Error reading file for patches: ${filePath}`, err);
            socket.emit('error', { 
              message: `Failed to apply patches: ${err.message}`,
              filePath
            });
            return;
          }
        }
        
        // Apply patches to current content
        try {
          const newContent = applyPatches(currentContent, data.patches);
          const language = data.language || filePath.split('.').pop() || 'text';
          
          // Update cache
          fileEditCache.set(filePath, {
            content: newContent,
            lastModified: Date.now(),
            language
          });
          
          // Clear any existing timer for this file
          if (codeUpdateTimers.has(filePath)) {
            clearTimeout(codeUpdateTimers.get(filePath));
          }
          
          // Set a new timer to update code repository after 5 seconds of inactivity
          const timerId = setTimeout(async () => {
            await updateCodeRepository(filePath, newContent, language);
            codeUpdateTimers.delete(filePath);
          }, CODE_UPDATE_DEBOUNCE);
          
          codeUpdateTimers.set(filePath, timerId);
          
          // Broadcast patches to others in the room
          socket.to(data.roomId).emit('code-patches', {
            patches: data.patches,
            language: data.language,
            changeBy: socket.id
          });
        } catch (err) {
          console.error(`Error applying patches to ${filePath}`, err);
          socket.emit('error', { 
            message: `Failed to apply patches: ${err.message}`,
            filePath
          });
        }
      }
    } catch (error) {
      console.error('Error in patch processing:', error);
      socket.emit('error', { 
        message: `General error in patch processing: ${error.message}`,
      });
    }
  });
  
  // Handle saving file to disk
  socket.on('save-file', async (data) => {
    const { path: filePath } = data;
    
    // Check if file is locked
    if (fileLocks.has(filePath)) {
      socket.emit('file-saved', {
        path: filePath,
        success: false,
        error: 'File is currently being saved by another operation',
        timestamp: Date.now()
      });
      return;
    }
    
    // Set file lock
    fileLocks.set(filePath, socket.id);
    
    try {
      if (fileEditCache.has(filePath)) {
        const { content, language } = fileEditCache.get(filePath);
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        ensureDirectoryExists(dir);
        
        // Write file to disk
        try {
          await fs.promises.writeFile(filePath, content, 'utf8');
          console.log(`File saved: ${filePath}`);
          
          // Also update code repository immediately on explicit save
          await updateCodeRepository(filePath, content, language);
          
          // Clear any pending debounce timer
          if (codeUpdateTimers.has(filePath)) {
            clearTimeout(codeUpdateTimers.get(filePath));
            codeUpdateTimers.delete(filePath);
          }
          
          // Notify client that save was successful
          socket.emit('file-saved', {
            path: filePath,
            success: true,
            timestamp: Date.now()
          });
          
          // Also notify any other clients in the same room
          const roomId = `file:${filePath}`;
          socket.to(roomId).emit('file-externally-saved', {
            path: filePath,
            timestamp: Date.now()
          });
        } catch (err) {
          console.error(`Error saving file ${filePath}:`, err);
          socket.emit('file-saved', {
            path: filePath,
            success: false,
            error: err.message,
            timestamp: Date.now()
          });
        }
      } else {
        socket.emit('file-saved', {
          path: filePath,
          success: false,
          error: 'No cached content to save',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error(`Unexpected error saving file ${filePath}:`, error);
      socket.emit('file-saved', {
        path: filePath,
        success: false,
        error: error.message || 'Unknown error during save operation',
        timestamp: Date.now()
      });
    } finally {
      // Release the file lock
      fileLocks.delete(filePath);
    }
  });
  
  // Handle cursor position updates
  socket.on('cursor-update', (data) => {
    socket.to(data.roomId).emit('remote-cursor', {
      position: data.position,
      userId: socket.id
    });
  });
  
  // Cleanup when socket disconnects
  socket.on('disconnect', () => {
    // Get all rooms this socket was in
    const rooms = Array.from(socket.rooms || []);
    
    // Notify other users in those rooms
    rooms.forEach(room => {
      if (room.startsWith('file:')) {
        socket.to(room).emit('user-left', { socketId: socket.id });
      }
    });
    
    // Clean up editing sessions and force save any pending changes
    editingSessions.forEach(async (filePath) => {
      console.log(`User ${socket.id} disconnected while editing: ${filePath}`);
      
      // If there are unsaved changes and a pending timer, save them to the repository
      if (fileEditCache.has(filePath) && codeUpdateTimers.has(filePath)) {
        clearTimeout(codeUpdateTimers.get(filePath));
        codeUpdateTimers.delete(filePath);
        
        const { content, language } = fileEditCache.get(filePath);
        await updateCodeRepository(filePath, content, language);
      }
    });
  });
};

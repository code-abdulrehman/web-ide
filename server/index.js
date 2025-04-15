import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import pty from 'node-pty';
import os from 'os';
import fs from 'fs/promises';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
var shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

// Get current directory path properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use @/code-store/code folder for storing code files
const codeStorePath = path.join(__dirname, '/code-store/code');

// Cache to store ongoing edits before saving to disk
const fileEditCache = new Map();

// File lock mechanism to prevent race conditions
const fileLocks = new Map();

// Debounce timers for code updates
const codeUpdateTimers = new Map();
const CODE_UPDATE_DEBOUNCE = 5000; // 5 seconds debounce

// Make sure code-store directory exists
async function ensureDirectoryExists(directoryPath) {
  try {
    await fs.mkdir(directoryPath, { recursive: true });
    console.log(`Directory created or already exists at: ${directoryPath}`);
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`);
  }
}

// Synchronous version for use in middleware
function ensureDirSync(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

// Apply code patches
function applyPatches(text, patches) {
  if (!patches || !Array.isArray(patches) || patches.length === 0) {
    return text;
  }

  // Sort patches in reverse order to avoid offset issues when applying
  patches.sort((a, b) => b.offset - a.offset);

  let result = text;
  for (const patch of patches) {
    const { offset, length, content } = patch;
    
    // Apply the patch
    const before = result.substring(0, offset);
    const after = result.substring(offset + length);
    result = before + content + after;
  }

  return result;
}

// Ensure code store directory exists
await ensureDirectoryExists(codeStorePath);

// Set up terminal
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: codeStorePath,
  env: { ...process.env, TERM: 'xterm-color' }
});

// Send initial directory information
setTimeout(() => {
  ptyProcess.write('pwd\r');
}, 1000);

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

// Setup express app
const app = express();
const PORT = process.env.PORT || 9000;
const httpServer = http.createServer(app);
const io = new SocketServer({
  cors: '*'
});

io.attach(httpServer);  

// Function to save code to disk
async function saveCodeToDisk(filePath, content) {
  try {
    // Handle paths - determine whether to use user project or keep original structure
    const parts = filePath.split('/');
    const projectIndex = parts.findIndex(part => 
      part === 'projects' || 
      part === 'workspace' ||
      part === 'user project'
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
    ensureDirSync(dir);
    
    // Write file to the code store
    await fs.writeFile(storeFilePath, content, 'utf8');
    console.log(`File saved to code store: ${storeFilePath}`);
    return storeFilePath;
  } catch (error) {
    console.error(`Error saving to filesystem: ${error.message}`);
    throw error;
  }
}

// Handle socket connections for code editing
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  
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
        
        // If file is not in cache yet, try to load it
        if (!fileEditCache.has(filePath)) {
          try {
            // Try to find the file in the code store
            const parts = filePath.split('/');
            const projectIndex = parts.findIndex(part => 
              part === 'projects' || 
              part === 'workspace' ||
              part === 'user project'
            );
            
            let storeFilePath;
            if (projectIndex >= 0) {
              storeFilePath = path.join(codeStorePath, parts.slice(projectIndex).join('/'));
            } else {
              const fileName = path.basename(filePath);
              storeFilePath = path.join(codeStorePath, 'user project', fileName);
            }
            
            if (existsSync(storeFilePath)) {
              const content = readFileSync(storeFilePath, 'utf8');
              fileEditCache.set(filePath, {
                content,
                lastModified: Date.now(),
                language: filePath.split('.').pop() || 'text'
              });
            }
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
  socket.on('code-change', async (data) => {
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
        
        // Set a new timer to save code after 5 seconds of inactivity
        const timerId = setTimeout(async () => {
          try {
            // Auto-save changes to disk
            await saveCodeToDisk(filePath, data.code);
            codeUpdateTimers.delete(filePath);
          } catch (error) {
            console.error(`Error auto-saving file: ${error.message}`);
          }
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
            // Try to find the file in the code store
            const parts = filePath.split('/');
            const projectIndex = parts.findIndex(part => 
              part === 'projects' || 
              part === 'workspace' ||
              part === 'user project'
            );
            
            let storeFilePath;
            if (projectIndex >= 0) {
              storeFilePath = path.join(codeStorePath, parts.slice(projectIndex).join('/'));
            } else {
              const fileName = path.basename(filePath);
              storeFilePath = path.join(codeStorePath, 'user project', fileName);
            }
            
            if (existsSync(storeFilePath)) {
              currentContent = readFileSync(storeFilePath, 'utf8');
            } else {
              currentContent = '';
            }
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
          
          // Set a new timer to save after 5 seconds of inactivity
          const timerId = setTimeout(async () => {
            try {
              await saveCodeToDisk(filePath, newContent);
              codeUpdateTimers.delete(filePath);
            } catch (error) {
              console.error(`Error auto-saving file after patches: ${error.message}`);
            }
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
        
        try {
          // Save file to disk
          await saveCodeToDisk(filePath, content);
          
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
          
          console.log(`File saved: ${filePath}`);
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
  
  // Terminal command handling
  socket.on('terminal:write', (data)=> {
    if (typeof data === 'string') {
      // Strip any existing newlines and add a proper carriage return
      data = data.trim() + '\r';
      ptyProcess.write(data);
      
      // For debugging - check the result of the command
      setTimeout(() => {
        ptyProcess.write('echo $?\r');
      }, 500);
    } else {
      console.error('Invalid data type received:', typeof data);
    }
  });
  
  // Cleanup when socket disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
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
        
        try {
          const { content } = fileEditCache.get(filePath);
          await saveCodeToDisk(filePath, content);
        } catch (error) {
          console.error(`Error saving file on disconnect: ${error.message}`);
        }
      }
    });
  });
});

// Terminal data handler
ptyProcess.onData(data => {
  io.emit('terminal:data', data);
});

// Basic middlewares
app.use(cors());
app.use(express.json());

// Simple ping route for connection testing
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get file tree
app.get('/api/files', async (req, res) => {
  const files = await generateFileTree(codeStorePath);
  res.json({tree: files});
});

// Read file content
app.get('/api/files/read', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    // Clean up the file path - remove any leading '/' or './'
    const cleanPath = filePath.replace(/^[\.\/\\]+/, '');
    
    // Ensure the file path is within the code store path for security
    const absoluteFilePath = path.join(codeStorePath, cleanPath);
    
    console.log('Requested file path:', filePath);
    console.log('Absolute file path:', absoluteFilePath);
    
    if (!absoluteFilePath.startsWith(codeStorePath)) {
      return res.status(403).json({ error: 'Access denied: Path outside of allowed directory' });
    }
    
    // Check if file exists
    try {
      await fs.access(absoluteFilePath);
    } catch (err) {
      console.log(`File not found: ${absoluteFilePath}`);
      return res.status(404).json({ error: `File not found: ${cleanPath}` });
    }
    
    // Read the file
    const content = await fs.readFile(absoluteFilePath, 'utf8');
    res.json({ content });
  } catch (error) {
    console.error('Error reading file:', error);
    // Send a consistent error format
    res.status(500).json({ 
      error: 'Failed to read file', 
      details: error.message 
    });
  }
});

// Generate file tree recursively
async function generateFileTree(dir) {
  async function buildTree(currentPath, relativePath = '') {
    const tree = {};
    const files = await fs.readdir(currentPath);

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const fileRelativePath = path.join(relativePath, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        tree[file] = {
          id: file,
          name: file,
          path: fileRelativePath,
          isFolder: true,
          isOpen: true,
          children: await buildTree(filePath, fileRelativePath)
        }
      } else {
        tree[file] = {
          id: file,
          name: file,
          path: fileRelativePath,
          isFolder: false,
          isOpen: false,
          children: null
        }
      }
    }

    return tree;
  }

  return await buildTree(dir);
}

// Create file or folder
app.post('/api/files/create', async (req, res) => {
  try {
    const { path: filePath, type, content = '' } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    // Clean up the file path - normalize slashes and remove any leading or trailing slashes
    let cleanPath = filePath.replace(/^[\.\/\\]+/, '').replace(/\/+$/, '');
    
    // Normalize slashes for proper path handling
    cleanPath = cleanPath.replace(/\\/g, '/');
    
    const absolutePath = path.join(codeStorePath, cleanPath);
    
    console.log(`Attempting to create ${type} at path: ${filePath}`);
    console.log(`Cleaned path: ${cleanPath}`);
    console.log(`Absolute path: ${absolutePath}`);
    
    // Security check
    if (!absolutePath.startsWith(codeStorePath)) {
      return res.status(403).json({ error: 'Access denied: Path outside of allowed directory' });
    }
    
    // Handle creation based on type
    if (type === 'file') {
      // Check if parent directory exists
      const parentDir = path.dirname(absolutePath);
      try {
        await fs.access(parentDir);
      } catch (err) {
        // Create parent directories if they don't exist
        console.log(`Parent directory doesn't exist, creating: ${parentDir}`);
        await fs.mkdir(parentDir, { recursive: true });
      }
      
      await fs.writeFile(absolutePath, content);
      console.log(`File created successfully: ${absolutePath}`);
      res.status(201).json({ message: 'File created successfully', path: cleanPath });
    } else if (type === 'folder') {
      await fs.mkdir(absolutePath, { recursive: true });
      console.log(`Folder created successfully: ${absolutePath}`);
      res.status(201).json({ message: 'Folder created successfully', path: cleanPath });
    } else {
      res.status(400).json({ error: 'Invalid type. Must be "file" or "folder"' });
    }
  } catch (error) {
    console.error('Error creating file/folder:', error);
    res.status(500).json({ 
      error: 'Failed to create file/folder', 
      details: error.message,
      path: req.body.path,
      type: req.body.type
    });
  }
});

// Save file content via HTTP API
app.post('/api/files/save', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    if (content === undefined) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Clean up the file path
    const cleanPath = filePath.replace(/^[\.\/\\]+/, '');
    const absolutePath = path.join(codeStorePath, cleanPath);
    
    // Security check
    if (!absolutePath.startsWith(codeStorePath)) {
      return res.status(403).json({ error: 'Access denied: Path outside of allowed directory' });
    }
    
    // Make sure directory exists
    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Save the file
    await fs.writeFile(absolutePath, content);
    console.log(`File saved via API: ${absolutePath}`);
    res.status(200).json({ message: 'File saved successfully', path: cleanPath });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file', details: error.message });
  }
});

// Delete file or folder
app.delete('/api/files/delete', async (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    // Clean up the file path
    const cleanPath = filePath.replace(/^[\.\/\\]+/, '');
    const absolutePath = path.join(codeStorePath, cleanPath);
    
    // Security check
    if (!absolutePath.startsWith(codeStorePath)) {
      return res.status(403).json({ error: 'Access denied: Path outside of allowed directory' });
    }
    
    // Check if path exists and get stats
    const stats = await fs.stat(absolutePath);
    
    if (stats.isDirectory()) {
      await fs.rm(absolutePath, { recursive: true });
      res.status(200).json({ message: 'Folder deleted successfully', path: cleanPath });
    } else {
      await fs.unlink(absolutePath);
      res.status(200).json({ message: 'File deleted successfully', path: cleanPath });
    }
  } catch (error) {
    console.error('Error deleting file/folder:', error);
    res.status(500).json({ error: 'Failed to delete file/folder', details: error.message });
  }
});

// Rename file or folder
app.put('/api/files/rename', async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    
    if (!oldPath || !newPath) {
      return res.status(400).json({ error: 'Both oldPath and newPath are required' });
    }
    
    // Clean up the paths
    const cleanOldPath = oldPath.replace(/^[\.\/\\]+/, '');
    const cleanNewPath = newPath.replace(/^[\.\/\\]+/, '');
    
    const absoluteOldPath = path.join(codeStorePath, cleanOldPath);
    const absoluteNewPath = path.join(codeStorePath, cleanNewPath);
    
    // Security check
    if (!absoluteOldPath.startsWith(codeStorePath) || !absoluteNewPath.startsWith(codeStorePath)) {
      return res.status(403).json({ error: 'Access denied: Path outside of allowed directory' });
    }
    
    // Perform the rename
    await fs.rename(absoluteOldPath, absoluteNewPath);
    res.status(200).json({ 
      message: 'File/folder renamed successfully', 
      oldPath: cleanOldPath, 
      newPath: cleanNewPath 
    });
  } catch (error) {
    console.error('Error renaming file/folder:', error);
    res.status(500).json({ error: 'Failed to rename file/folder', details: error.message });
  }
});

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Code files will be stored in: ${codeStorePath}`);
});

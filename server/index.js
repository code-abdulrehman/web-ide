import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import pty from 'node-pty';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
var shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

// Get current directory path properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const codeStorePath = path.join(__dirname, 'code-store', 'code');

// Make sure code-store directory exists
async function ensureDirectoryExists(directoryPath) {
  try {
    await fs.mkdir(directoryPath, { recursive: true });
    console.log(`Directory created or already exists at: ${directoryPath}`);
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`);
  }
}

// Ensure code store directory exists
await ensureDirectoryExists(codeStorePath);

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

const app = express();
const PORT = process.env.PORT || 9000;
const httpServer = http.createServer(app);
const io = new SocketServer({
  cors: '*'
});

io.attach(httpServer);  

ptyProcess.onData(data => {
  io.emit('terminal:data', data);
})

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

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

});

app.use(cors());

// Simple ping route for connection testing
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/files', async (req, res) => {
  const files = await generateFileTree(codeStorePath);
  res.json({tree: files});
});

// New route to read file content
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

httpServer.listen(PORT, () => {
  console.log(`Docker Terminal Server running on port ${PORT}`);
});

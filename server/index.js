import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import pty from 'node-pty';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();
var shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
const codeStorePath = process.env.INIT_CWD + '/code-store/code/';

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
app.get('/api/files', async (req, res) => {
  const files = await generateFileTree(codeStorePath);
  res.json({tree: files});
});


async function generateFileTree(dir) {
  async function buildTree(currentPath) {
    const tree = {};
    const files = await fs.readdir(currentPath);

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        tree[file] = {
          id: file,
          name: file,
          isFolder: true,
          isOpen: true,
          children: await buildTree(filePath)
        }
      } else {
        tree[file] = {
          id: file,
          name: file,
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

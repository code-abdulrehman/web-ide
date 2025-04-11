import { handleCodeEditing } from './handlers.js';

const initSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Set up event handlers
    handleCodeEditing(socket, io);
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

export default initSocketHandlers;

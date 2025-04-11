/**
 * Handle code editing socket events
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 */
export const handleCodeEditing = (socket, io) => {
  // Join a code editing room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
    
    // Notify others that someone joined
    socket.to(roomId).emit('user-joined', { socketId: socket.id });
  });
  
  // Handle code changes
  socket.on('code-change', (data) => {
    // Broadcast code changes to others in the same room
    socket.to(data.roomId).emit('code-update', {
      code: data.code,
      language: data.language,
      changeBy: socket.id
    });
  });
  
  // Handle cursor position updates
  socket.on('cursor-update', (data) => {
    socket.to(data.roomId).emit('remote-cursor', {
      position: data.position,
      userId: socket.id
    });
  });
};

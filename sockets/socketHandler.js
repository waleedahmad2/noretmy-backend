const socketHandler = (io) => {
    io.on('connection', (socket) => {
      console.log('A user connected');
  
      // Handle user joining a room
      socket.on('joinRoom', (conversationId) => {
        socket.join(conversationId);
        console.log(`User joined room: ${conversationId}`);
      });
  
      // Handle receiving a message and emitting it to the room
      socket.on('sendMessage', (messageData) => {
        const { conversationId, message } = messageData;
        io.to(conversationId).emit('receiveMessage', message);
        console.log(`Message sent to room ${conversationId}:`, message);
      });
  
      // Handle user disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
  
      // Handle errors
      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
    });
  };
  
  module.exports = socketHandler;
  
// Quick test to verify Socket.io is working
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const nsp = io.of('/watch-together');

nsp.on('connection', (socket) => {
  console.log('✅ TEST: Client connected:', socket.id);
  socket.emit('test', { message: 'Connection successful!' });
  
  socket.on('disconnect', () => {
    console.log('❌ TEST: Client disconnected:', socket.id);
  });
});

httpServer.listen(3001, () => {
  console.log('✅ TEST SERVER running on http://localhost:3001');
  console.log('✅ Socket.io namespace /watch-together is active');
  console.log('\n👉 If you see this, Socket.io is working!');
  console.log('👉 Now restart your main backend server (port 3000)\n');
});

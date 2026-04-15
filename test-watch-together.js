// Quick test script to verify Watch Together backend setup
// Run: node test-watch-together.js

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
  console.log('✅ Client connected:', socket.id);
  
  socket.on('room:create', (data, cb) => {
    console.log('📝 Room create request:', data);
    cb?.({ ok: true, roomId: 'test123', isHost: true });
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

httpServer.listen(3000, () => {
  console.log('✅ Test server running on http://localhost:3000');
  console.log('✅ Socket.io namespace /watch-together is active');
  console.log('\n👉 Open http://localhost:5173 and test Watch Together feature');
  console.log('👉 Check browser console for connection logs\n');
});

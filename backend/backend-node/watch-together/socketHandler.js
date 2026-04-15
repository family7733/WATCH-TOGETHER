// backend/backend-node/watch-together/socketHandler.js
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  updatePlaybackState
} from './roomController.js';

function registerWatchTogether(io) {
  const nsp = io.of('/watch-together'); // namespace

  console.log('[WatchTogether] ✅ Namespace /watch-together registered');
  console.log('[WatchTogether] ✅ Ready to accept connections');

  nsp.on('connection', (socket) => {
    console.log('[WatchTogether] ✅✅✅ CLIENT CONNECTED:', socket.id);
    console.log('[WatchTogether] Socket transport:', socket.conn.transport.name);
    let currentRoomId = null;

    // Create private room
    socket.on('room:create', ({ movieId, name }, cb) => {
      console.log('[WatchTogether] Room create request:', { movieId, name, socketId: socket.id });
      try {
        const room = createRoom({ movieId, hostSocketId: socket.id });
        joinRoom(room.roomId, { socketId: socket.id, name });
        socket.join(room.roomId);
        currentRoomId = room.roomId;

        console.log('[WatchTogether] Room created:', room.roomId);
        cb?.({ ok: true, roomId: room.roomId, isHost: true });
      } catch (e) {
        console.error('[WatchTogether] Room creation error:', e);
        cb?.({ ok: false, error: 'Failed to create room' });
      }
    });

    // Join room
    socket.on('room:join', ({ roomId, name }, cb) => {
      console.log('[WatchTogether] Room join request:', { roomId, name, socketId: socket.id });
      const room = getRoom(roomId);
      if (!room || !room.isActive) {
        console.log('[WatchTogether] Room not found or expired:', roomId);
        return cb?.({ ok: false, error: 'Room not found or expired' });
      }

      if (room.users.length >= 10) {
        return cb?.({ ok: false, error: 'Room is full (max 10 users)' });
      }

      joinRoom(roomId, { socketId: socket.id, name });
      socket.join(roomId);
      currentRoomId = roomId;

      // send current playback state so new user syncs
      cb?.({
        ok: true,
        roomId,
        movieId: room.movieId,
        isHost: room.hostId === socket.id,
        playbackState: room.playbackState,
        users: room.users.map(u => ({ socketId: u.socketId, name: u.name }))
      });

      // notify others
      nsp.to(roomId).emit('room:user-joined', {
        socketId: socket.id,
        name
      });
    });

    // Host controls playback
    socket.on('player:state-change', ({ roomId, action, currentTime, isPlaying }) => {
      const room = getRoom(roomId);
      if (!room || room.hostId !== socket.id) return;

      if (action === 'play' || action === 'pause' || action === 'seek') {
        updatePlaybackState(roomId, { isPlaying, currentTime });
        // broadcast to all except host
        socket.to(roomId).emit('player:sync', {
          action,
          currentTime,
          isPlaying,
          ts: Date.now()
        });
      }
    });

    // Client requests sync if out of sync
    socket.on('player:request-sync', ({ roomId }) => {
      const room = getRoom(roomId);
      if (!room) return;
      // Ask host for current state; host will respond with player:sync-full
      nsp.to(room.hostId).emit('player:sync-request', { requesterId: socket.id, roomId });
    });

    // Host sends full state to a specific client
    socket.on('player:sync-full', ({ roomId, targetSocketId, state }) => {
      const room = getRoom(roomId);
      if (!room || room.hostId !== socket.id) return;

      updatePlaybackState(roomId, state);
      nsp.to(targetSocketId).emit('player:sync-full', state);
    });

    // Chat
    socket.on('chat:message', ({ roomId, text, name }) => {
      if (!text || !roomId) return;
      nsp.to(roomId).emit('chat:message', {
        socketId: socket.id,
        name: name || 'Guest',
        text,
        at: Date.now()
      });
    });

    // Get room users list
    socket.on('room:get-users', ({ roomId }, cb) => {
      const room = getRoom(roomId);
      if (!room) return cb?.({ ok: false });
      cb?.({ ok: true, users: room.users.map(u => ({ socketId: u.socketId, name: u.name })) });
    });

    // Disconnect / leave
    socket.on('disconnect', () => {
      console.log('[WatchTogether] Client disconnected:', socket.id);
      if (currentRoomId) {
        const room = getRoom(currentRoomId);
        leaveRoom(currentRoomId, socket.id);
        if (room) {
          nsp.to(currentRoomId).emit('room:user-left', { socketId: socket.id });
        }
      }
    });

    socket.on('room:leave', () => {
      if (!currentRoomId) return;
      leaveRoom(currentRoomId, socket.id);
      socket.leave(currentRoomId);
      nsp.to(currentRoomId).emit('room:user-left', { socketId: socket.id });
      currentRoomId = null;
    });
  });
}

export { registerWatchTogether };

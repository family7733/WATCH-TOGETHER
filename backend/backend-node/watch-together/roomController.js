// backend/backend-node/watch-together/roomController.js
import { randomBytes } from 'crypto';

const rooms = new Map(); // roomId -> room object
const ROOM_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function generateRoomId() {
  return randomBytes(4).toString('hex'); // e.g. "b9fe71a4"
}

function createRoom({ movieId, hostSocketId }) {
  const roomId = generateRoomId();
  const now = Date.now();

  const room = {
    roomId,
    movieId,
    hostId: hostSocketId,
    users: [],
    createdAt: now,
    lastActivity: now,
    isActive: true,
    playbackState: {
      isPlaying: false,
      currentTime: 0,
      lastUpdate: now
    }
  };

  rooms.set(roomId, room);
  return room;
}

function getRoom(roomId) {
  return rooms.get(roomId);
}

function joinRoom(roomId, { socketId, name }) {
  const room = rooms.get(roomId);
  if (!room || !room.isActive) return null;

  if (!room.users.find(u => u.socketId === socketId)) {
    room.users.push({ socketId, name: name || 'Guest' });
  }
  room.lastActivity = Date.now();
  return room;
}

function leaveRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.users = room.users.filter(u => u.socketId !== socketId);
  room.lastActivity = Date.now();

  // if host leaves, promote another user or close room
  if (room.hostId === socketId) {
    if (room.users.length > 0) {
      room.hostId = room.users[0].socketId;
    } else {
      room.isActive = false;
      rooms.delete(roomId);
    }
  }
}

function updatePlaybackState(roomId, state) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.playbackState = {
    ...room.playbackState,
    ...state,
    lastUpdate: Date.now()
  };
  room.lastActivity = Date.now();
}

function cleanupExpiredRooms() {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (!room.isActive) {
      rooms.delete(roomId);
      continue;
    }
    if (now - room.lastActivity > ROOM_TTL_MS) {
      rooms.delete(roomId);
    }
  }
}

setInterval(cleanupExpiredRooms, 10 * 60 * 1000); // every 10 min

export {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  updatePlaybackState
};

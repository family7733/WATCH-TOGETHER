// Simple Watch Room - HTTP Polling Based (More Reliable)
// No WebSockets needed - uses simple HTTP endpoints

const rooms = new Map() // roomId -> room data
const ROOM_TTL = 2 * 60 * 60 * 1000 // 2 hours

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function createRoom(movieId, hostId, hostName) {
  const roomId = generateRoomId()
  const room = {
    roomId,
    movieId,
    hostId,
    users: [{ id: hostId, name: hostName }],
    playback: {
      currentTime: 0,
      isPlaying: false,
      lastUpdate: Date.now()
    },
    chat: [],
    createdAt: Date.now(),
    lastActivity: Date.now()
  }
  
  rooms.set(roomId, room)
  return room
}

function getRoom(roomId) {
  const room = rooms.get(roomId)
  if (!room) return null
  
  // Check if expired
  if (Date.now() - room.lastActivity > ROOM_TTL) {
    rooms.delete(roomId)
    return null
  }
  
  room.lastActivity = Date.now()
  return room
}

function joinRoom(roomId, userId, userName) {
  const room = getRoom(roomId)
  if (!room) return { success: false, error: 'Room not found' }
  
  if (room.users.length >= 10) {
    return { success: false, error: 'Room is full' }
  }
  
  // Check if user already in room
  if (!room.users.find(u => u.id === userId)) {
    room.users.push({ id: userId, name: userName })
  }
  
  return {
    success: true,
    room,
    isHost: room.hostId === userId
  }
}

function leaveRoom(roomId, userId) {
  const room = getRoom(roomId)
  if (!room) return
  
  room.users = room.users.filter(u => u.id !== userId)
  
  // If host left, delete room
  if (room.hostId === userId) {
    rooms.delete(roomId)
  }
}

function updatePlayback(roomId, currentTime, isPlaying) {
  const room = getRoom(roomId)
  if (!room) return { success: false }
  
  room.playback = {
    currentTime,
    isPlaying,
    lastUpdate: Date.now()
  }
  
  return { success: true }
}

function addChatMessage(roomId, userId, userName, text) {
  const room = getRoom(roomId)
  if (!room) return { success: false }
  
  room.chat.push({
    userId,
    userName,
    text,
    time: Date.now()
  })
  
  // Keep only last 100 messages
  if (room.chat.length > 100) {
    room.chat = room.chat.slice(-100)
  }
  
  return { success: true }
}

// Cleanup expired rooms periodically
setInterval(() => {
  const now = Date.now()
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.lastActivity > ROOM_TTL) {
      rooms.delete(roomId)
      console.log(`[SimpleWatchRoom] Cleaned up expired room: ${roomId}`)
    }
  }
}, 5 * 60 * 1000) // Every 5 minutes

export function setupSimpleWatchRoom(app) {
  // Create room
  app.post('/watch-room/create', (req, res) => {
    try {
      const { movieId, hostId, hostName } = req.body
      if (!movieId || !hostId || !hostName) {
        return res.status(400).json({ error: 'Missing required fields' })
      }
      
      const room = createRoom(movieId, hostId, hostName)
      console.log(`[SimpleWatchRoom] Room created: ${room.roomId} by ${hostName}`)
      res.json(room)
    } catch (err) {
      console.error('[SimpleWatchRoom] Create error:', err)
      res.status(500).json({ error: 'Failed to create room' })
    }
  })

  // Get room
  app.get('/watch-room/:roomId', (req, res) => {
    try {
      const { roomId } = req.params
      const room = getRoom(roomId)
      
      if (!room) {
        return res.status(404).json({ error: 'Room not found' })
      }
      
      res.json({ room })
    } catch (err) {
      console.error('[SimpleWatchRoom] Get error:', err)
      res.status(500).json({ error: 'Failed to get room' })
    }
  })

  // Join room
  app.post('/watch-room/:roomId/join', (req, res) => {
    try {
      const { roomId } = req.params
      const { userId, userName } = req.body
      
      if (!userId || !userName) {
        return res.status(400).json({ success: false, error: 'Missing userId or userName' })
      }
      
      const result = joinRoom(roomId, userId, userName)
      
      if (result.success) {
        console.log(`[SimpleWatchRoom] User ${userName} joined room ${roomId}`)
        res.json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (err) {
      console.error('[SimpleWatchRoom] Join error:', err)
      res.status(500).json({ success: false, error: 'Failed to join room' })
    }
  })

  // Leave room
  app.post('/watch-room/:roomId/leave', (req, res) => {
    try {
      const { roomId } = req.params
      const { userId } = req.body
      
      leaveRoom(roomId, userId)
      console.log(`[SimpleWatchRoom] User left room ${roomId}`)
      res.json({ success: true })
    } catch (err) {
      console.error('[SimpleWatchRoom] Leave error:', err)
      res.status(500).json({ success: false })
    }
  })

  // Update playback
  app.post('/watch-room/:roomId/playback', (req, res) => {
    try {
      const { roomId } = req.params
      const { currentTime, isPlaying } = req.body
      
      const result = updatePlayback(roomId, currentTime, isPlaying)
      res.json(result)
    } catch (err) {
      console.error('[SimpleWatchRoom] Playback error:', err)
      res.status(500).json({ success: false })
    }
  })

  // Send chat message
  app.post('/watch-room/:roomId/chat', (req, res) => {
    try {
      const { roomId } = req.params
      const { userId, userName, text } = req.body
      
      if (!userId || !userName || !text) {
        return res.status(400).json({ success: false })
      }
      
      const result = addChatMessage(roomId, userId, userName, text)
      res.json(result)
    } catch (err) {
      console.error('[SimpleWatchRoom] Chat error:', err)
      res.status(500).json({ success: false })
    }
  })

  console.log('[SimpleWatchRoom] ✅ HTTP endpoints registered')
}

// Ultra Simple Watch Room - Minimal HTTP endpoints
// No complex setup needed

const rooms = {}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase()
}

// Create room
export function createRoom(req, res) {
  try {
    const { movieId, hostName } = req.body
    
    if (!movieId || !hostName) {
      return res.status(400).json({ error: 'Movie ID and host name required' })
    }
    
    const roomId = generateRoomId()
    const room = {
      roomId,
      movieId,
      hostName,
      users: [hostName],
      playback: { currentTime: 0, isPlaying: false },
      chat: [],
      createdAt: Date.now()
    }
    
    rooms[roomId] = room
    console.log(`[WatchRoom] Created room ${roomId} by ${hostName}`)
    
    res.json({ roomId, ...room })
  } catch (err) {
    console.error('[WatchRoom] Create error:', err)
    res.status(500).json({ error: 'Failed to create room' })
  }
}

// Get room
export function getRoom(req, res) {
  try {
    const { roomId } = req.params
    const room = rooms[roomId]
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }
    
    res.json({ room })
  } catch (err) {
    console.error('[WatchRoom] Get error:', err)
    res.status(500).json({ error: 'Failed to get room' })
  }
}

// Join room
export function joinRoom(req, res) {
  try {
    const { roomId } = req.params
    const { userName } = req.body
    
    if (!userName) {
      return res.status(400).json({ error: 'User name required' })
    }
    
    const room = rooms[roomId]
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }
    
    if (room.users.length >= 10) {
      return res.status(400).json({ error: 'Room is full' })
    }
    
    if (!room.users.includes(userName)) {
      room.users.push(userName)
    }
    
    console.log(`[WatchRoom] ${userName} joined room ${roomId}`)
    res.json({ success: true, room })
  } catch (err) {
    console.error('[WatchRoom] Join error:', err)
    res.status(500).json({ error: 'Failed to join room' })
  }
}

// Update playback
export function updatePlayback(req, res) {
  try {
    const { roomId } = req.params
    const { currentTime, isPlaying } = req.body
    
    const room = rooms[roomId]
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }
    
    room.playback = { currentTime, isPlaying, updated: Date.now() }
    res.json({ success: true })
  } catch (err) {
    console.error('[WatchRoom] Playback error:', err)
    res.status(500).json({ error: 'Failed to update playback' })
  }
}

// Send chat
export function sendChat(req, res) {
  try {
    const { roomId } = req.params
    const { userName, text } = req.body
    
    const room = rooms[roomId]
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }
    
    room.chat.push({ userName, text, time: Date.now() })
    if (room.chat.length > 100) {
      room.chat = room.chat.slice(-100)
    }
    
    res.json({ success: true })
  } catch (err) {
    console.error('[WatchRoom] Chat error:', err)
    res.status(500).json({ error: 'Failed to send chat' })
  }
}

// Cleanup old rooms (every 10 minutes)
setInterval(() => {
  const now = Date.now()
  const maxAge = 2 * 60 * 60 * 1000 // 2 hours
  for (const roomId in rooms) {
    if (now - rooms[roomId].createdAt > maxAge) {
      delete rooms[roomId]
      console.log(`[WatchRoom] Cleaned up room ${roomId}`)
    }
  }
}, 10 * 60 * 1000)

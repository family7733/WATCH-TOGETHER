// Simple Watch Together - Using HTTP Polling (More Reliable)
import { useEffect, useState, useRef } from 'react'

type Props = {
  movieId: string
  videoId: string | null
}

type RoomState = {
  roomId: string
  movieId: string
  hostId: string
  users: { id: string; name: string }[]
  playback: {
    currentTime: number
    isPlaying: boolean
    lastUpdate: number
  }
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000'
const PUBLIC_APP_URL = (import.meta as any).env?.VITE_PUBLIC_APP_URL || ''
const SHARE_BASE = PUBLIC_APP_URL.trim().replace(/\/$/, '')
const WATCH_API = `${API_BASE}/api/watch-room`
const isValidVideoId = (v: string) => /^[a-zA-Z0-9_-]{11}$/.test(v)

export default function SimpleWatchTogether({ movieId, videoId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'active'>('select')
  const [roomId, setRoomId] = useState<string>('')
  const [userName, setUserName] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [chatMessages, setChatMessages] = useState<{ name: string; text: string; time: number }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [userId] = useState(() => Math.random().toString(36).substring(7))
  
  const pollIntervalRef = useRef<number | null>(null)
  const playerRef = useRef<any>(null)

  // Check URL for room ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlRoomId = params.get('room')
    if (urlRoomId) {
      setIsOpen(true)
      setMode('join')
      setJoinRoomId(urlRoomId)
    }
  }, [])

  // Create room
  const createRoom = async () => {
    if (!userName.trim()) {
      setError('Please enter your name')
      return
    }

    try {
      const response = await fetch(`${WATCH_API}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, hostName: userName })
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('Create room error response:', text)
        throw new Error(`Server error: ${response.status} - ${text.substring(0, 100)}`)
      }

      const data = await response.json()
      if (data.roomId) {
        setRoomId(data.roomId)
        setIsHost(true)
        setMode('active')
        setRoomState(data)
        setError(null)
        
        // Update URL
        const url = new URL(window.location.href)
        url.searchParams.set('room', data.roomId)
        if (videoId && isValidVideoId(videoId)) url.searchParams.set('v', videoId)
        window.history.pushState({}, '', url)
        
        startPolling(data.roomId)
      } else {
        setError(data.error || 'Failed to create room')
      }
    } catch (err: any) {
      setError('Failed to create room: ' + err.message)
    }
  }

  // Join room
  const joinRoom = async () => {
    if (!userName.trim() || !joinRoomId.trim()) {
      setError('Please enter your name and room ID')
      return
    }

    try {
      const response = await fetch(`${WATCH_API}/${joinRoomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName })
      })

      const data = await response.json()
      if (data.success) {
        setRoomId(joinRoomId)
        setIsHost(data.isHost)
        setMode('active')
        setRoomState(data.room)
        setError(null)
        
        // Update URL
        const url = new URL(window.location.href)
        url.searchParams.set('room', joinRoomId)
        if (videoId && isValidVideoId(videoId)) url.searchParams.set('v', videoId)
        window.history.pushState({}, '', url)
        
        startPolling(joinRoomId)
      } else {
        setError(data.error || 'Failed to join room')
      }
    } catch (err: any) {
      setError('Failed to join room: ' + err.message)
    }
  }

  // Start polling for room updates
  const startPolling = (roomIdToPoll: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const response = await fetch(`${WATCH_API}/${roomIdToPoll}`)
        const data = await response.json()
        
        if (data.room) {
          setRoomState({
            roomId: data.room.roomId,
            movieId: data.room.movieId,
            hostId: data.room.hostName,
            users: data.room.users.map((name: string) => ({ id: name, name })),
            playback: data.room.playback
          })
          
          // Update chat messages
          if (data.room.chat) {
            setChatMessages(data.room.chat.map((msg: any) => ({
              name: msg.userName,
              text: msg.text,
              time: msg.time
            })))
          }
          
          // Sync playback if not host
          if (!isHost && data.room.playback && playerRef.current) {
            const playback = data.room.playback
            const currentTime = playerRef.current.getCurrentTime()
            const diff = Math.abs(currentTime - playback.currentTime)
            
            if (diff > 1) {
              playerRef.current.seekTo(playback.currentTime, true)
            }
            
            if (playback.isPlaying && playerRef.current.getPlayerState() !== 1) {
              playerRef.current.playVideo()
            } else if (!playback.isPlaying && playerRef.current.getPlayerState() !== 2) {
              playerRef.current.pauseVideo()
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000) // Poll every 2 seconds
  }

  // Update playback state (host only)
  const updatePlayback = async (currentTime: number, isPlaying: boolean) => {
    if (!isHost || !roomId) return

    try {
      await fetch(`${WATCH_API}/${roomId}/playback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTime, isPlaying })
      })
    } catch (err) {
      console.error('Update playback error:', err)
    }
  }

  // Send chat message
  const sendChat = async () => {
    if (!chatInput.trim() || !roomId) return

    try {
      await fetch(`${WATCH_API}/${roomId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, text: chatInput })
      })
      setChatInput('')
    } catch (err) {
      console.error('Send chat error:', err)
    }
  }

  // Leave room
  const leaveRoom = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    // Note: Leave is handled by just stopping polling
    // Room will auto-cleanup after 2 hours

    setMode('select')
    setRoomId('')
    setIsHost(false)
    setRoomState(null)
    setChatMessages([])
    setError(null)

    const url = new URL(window.location.href)
    url.searchParams.delete('room')
    window.history.pushState({}, '', url)
  }

  // Initialize YouTube player
  useEffect(() => {
    if (!videoId || mode !== 'active' || !isHost) return

    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const initPlayer = () => {
      const iframeId = `youtube-iframe-${videoId}`
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement
      if (!iframe || playerRef.current) return

      try {
        const player = new window.YT.Player(iframeId, {
          events: {
            onReady: (e: any) => {
              playerRef.current = e.target
            },
            onStateChange: (e: any) => {
              if (isHost && playerRef.current) {
                const isPlaying = e.data === 1
                const currentTime = e.target.getCurrentTime()
                updatePlayback(currentTime, isPlaying)
              }
            }
          }
        })
      } catch (err) {
        console.error('Player init error:', err)
      }
    }

    if (window.YT?.Player) {
      setTimeout(initPlayer, 1000)
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }
  }, [videoId, mode, isHost])

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const shareLink = roomId
    ? `${(SHARE_BASE || window.location.origin)}${window.location.pathname}?${new URLSearchParams({
        ...(videoId && isValidVideoId(videoId) ? { v: videoId } : {}),
        room: roomId,
      }).toString()}`
    : ''

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-lg hover:from-red-500 hover:to-red-400 transition-all duration-300"
      >
        {isOpen ? 'Close Watch Together' : 'Watch Together'}
      </button>

      {isOpen && (
        <div className="mt-4 border-2 border-gray-800 rounded-xl bg-black/90 p-6">
          {mode === 'select' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setMode('create')}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
                >
                  Create Room
                </button>
                <button
                  onClick={() => setMode('join')}
                  className="px-6 py-3 border-2 border-gray-700 hover:border-gray-600 rounded-lg font-semibold transition-colors"
                >
                  Join Room
                </button>
              </div>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2 bg-black border-2 border-gray-800 rounded-lg text-white"
              />
              <button
                onClick={createRoom}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold"
              >
                Create Room
              </button>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2 bg-black border-2 border-gray-800 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="w-full px-4 py-2 bg-black border-2 border-gray-800 rounded-lg text-white"
              />
              <button
                onClick={joinRoom}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold"
              >
                Join Room
              </button>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}

          {mode === 'active' && roomState && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Room ID: <span className="font-bold text-white">{roomId}</span></p>
                  {isHost && <p className="text-xs text-red-400 mt-1">You are the host</p>}
                </div>
                <button
                  onClick={leaveRoom}
                  className="px-4 py-2 border border-gray-700 hover:border-gray-600 rounded-lg text-sm"
                >
                  Leave Room
                </button>
              </div>

              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-4 border-2 border-red-600/30">
                <p className="text-sm font-semibold text-white mb-3">🔗 Share Room Link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 px-4 py-2 bg-black border-2 border-gray-700 rounded-lg text-sm text-white font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink).then(() => {
                        setError('✓ Link copied!')
                        setTimeout(() => setError(null), 2000)
                      })
                    }}
                    className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Users ({roomState.users.length}/10):</p>
                <div className="flex flex-wrap gap-2">
                  {roomState.users.map((u) => (
                    <span
                      key={u.id}
                      className={`px-2 py-1 rounded text-xs ${
                        u.id === userId ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {u.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <p className="text-sm font-semibold mb-2">Chat:</p>
                <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto mb-2">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No messages yet</p>
                  ) : (
                    <div className="space-y-2">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-semibold text-red-400">{msg.name}:</span>
                          <span className="text-gray-300 ml-2">{msg.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                    className="flex-1 px-3 py-2 bg-black border-2 border-gray-800 rounded-lg text-white text-sm"
                  />
                  <button
                    onClick={sendChat}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold text-sm"
                  >
                    Send
                  </button>
                </div>
              </div>

              {error && <p className="text-green-400 text-sm">{error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

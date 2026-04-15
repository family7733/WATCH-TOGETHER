// frontend/src/components/WatchTogether.tsx
import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

type Props = {
  movieId: string
  videoId: string | null // YouTube video ID
}

type PlaybackState = {
  isPlaying: boolean
  currentTime: number
  lastUpdate: number
}

type ChatMessage = {
  socketId: string
  name: string
  text: string
  at: number
}

type RoomUser = {
  socketId: string
  name: string
}

export default function WatchTogether({ movieId, videoId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'active'>('select')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [userName, setUserName] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<RoomUser[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const youtubePlayerRef = useRef<any>(null)
  const syncIntervalRef = useRef<number | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)

  const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000'
  const PUBLIC_APP_URL = (import.meta as any).env?.VITE_PUBLIC_APP_URL || ''
  const shareBase = PUBLIC_APP_URL.trim().replace(/\/$/, '') || window.location.origin
  const videoParam = videoId ? String(videoId).trim() : ''
  
  // Debug: Log API base
  useEffect(() => {
    console.log('[WatchTogether] API_BASE:', API_BASE)
  }, [])

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        // API ready
      }
    }

    // Check if room ID in URL and auto-join
    const params = new URLSearchParams(window.location.search)
    const urlRoomId = params.get('room')
    if (urlRoomId) {
      setIsOpen(true)
      setMode('join')
      setJoinRoomId(urlRoomId)
      // Auto-join when socket connects
      const autoJoin = () => {
        if (socketRef.current?.connected && urlRoomId && !roomId) {
          // Prompt for name if not set
          const name = userName || prompt('Enter your name to join the room:')
          if (name && name.trim()) {
            setUserName(name.trim())
            setTimeout(() => {
              const socket = socketRef.current
              if (socket?.connected) {
                socket.emit('room:join', { roomId: urlRoomId, name: name.trim() }, (res: any) => {
                  if (res?.ok) {
                    setRoomId(res.roomId)
                    setIsHost(res.isHost)
                    setMode('active')
                    setError(null)
                    setUsers(res.users || [])
                    if (res.playbackState) {
                      setPlaybackState(res.playbackState)
                      handleFullSync(res.playbackState)
                    }
                  } else {
                    setError(res?.error || 'Failed to join room')
                  }
                })
              }
            }, 500)
          }
        }
      }
      
      // Try auto-join when socket connects
      const checkSocket = setInterval(() => {
        if (socketRef.current?.connected) {
          clearInterval(checkSocket)
          autoJoin()
        }
      }, 500)
      
      // Cleanup after 10 seconds
      setTimeout(() => clearInterval(checkSocket), 10000)
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [])

  const connectSocket = () => {
    if (socketRef.current?.connected) {
      console.log('[WatchTogether] Already connected')
      return socketRef.current
    }

    console.log('[WatchTogether] Connecting to:', `${API_BASE}/watch-together`)
    const socket = io(`${API_BASE}/watch-together`, {
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      timeout: 20000,
      forceNew: true, // Force new connection
      autoConnect: true
    })

    socket.on('connect', () => {
      console.log('[WatchTogether] ✅ Connected to server:', socket.id)
      setSocketConnected(true)
      setError(null)
    })

    socket.on('connect_error', (err) => {
      console.error('[WatchTogether] ❌ Connection error:', err.message)
      console.error('[WatchTogether] Error details:', err)
      setError(`Connection error: ${err.message}. Make sure backend is running on ${API_BASE}.`)
      setSocketConnected(false)
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log('[WatchTogether] ✅ Reconnected after', attemptNumber, 'attempts')
      setSocketConnected(true)
      setError(null)
    })

    socket.on('reconnect_error', (err) => {
      console.error('[WatchTogether] Reconnection error:', err.message)
      setError('Reconnecting...')
    })

    socket.on('reconnect_failed', () => {
      console.error('[WatchTogether] Failed to reconnect')
      setError('Connection failed. Please refresh the page.')
      setSocketConnected(false)
    })

    socket.on('disconnect', (reason) => {
      console.log('[WatchTogether] Disconnected:', reason)
      setSocketConnected(false)
      if (reason === 'io server disconnect') {
        setError('Disconnected by server. Please refresh.')
      }
    })

    socket.on('player:sync', handleSync)
    socket.on('player:sync-full', handleFullSync)
    socket.on('chat:message', handleChatMessage)
    socket.on('room:user-joined', ({ socketId, name }) => {
      console.log('[WatchTogether] User joined:', name)
      setUsers(prev => [...prev.filter(u => u.socketId !== socketId), { socketId, name }])
    })
    socket.on('room:user-left', ({ socketId }) => {
      console.log('[WatchTogether] User left:', socketId)
      setUsers(prev => prev.filter(u => u.socketId !== socketId))
    })

    socketRef.current = socket
    return socket
  }

  // Test backend connection first
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch(`${API_BASE}/socket-test`)
        const data = await response.json()
        console.log('[WatchTogether] Backend test:', data)
        if (data.socketio === 'enabled') {
          console.log('[WatchTogether] ✅ Backend has Socket.io enabled')
          connectSocket()
        } else {
          setError('Backend Socket.io not enabled. Please restart backend server.')
        }
      } catch (err) {
        console.error('[WatchTogether] Backend test failed:', err)
        setError(`Cannot reach backend server at ${API_BASE}.`)
      }
    }
    
    console.log('[WatchTogether] Component mounted, testing backend...')
    testConnection()

    return () => {
      if (socketRef.current) {
        console.log('[WatchTogether] Cleaning up socket connection')
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  const handleSync = ({ action, currentTime, isPlaying }: { action: string, currentTime: number, isPlaying: boolean }) => {
    if (isHost) return // Host doesn't sync to others

    const player = youtubePlayerRef.current
    if (!player) {
      console.warn('[WatchTogether] Player not initialized yet')
      return
    }

    try {
      const diff = Math.abs(player.getCurrentTime() - currentTime)
      
      if (diff > 0.5) {
        player.seekTo(currentTime, true)
      }

      if (action === 'play' && player.getPlayerState() !== 1) {
        player.playVideo()
      } else if (action === 'pause' && player.getPlayerState() !== 2) {
        player.pauseVideo()
      }
    } catch (err) {
      console.error('[WatchTogether] Sync error:', err)
    }
  }

  const handleFullSync = (state: PlaybackState) => {
    if (isHost) return

    const player = youtubePlayerRef.current
    if (!player) {
      console.warn('[WatchTogether] Player not initialized yet, will sync when ready')
      return
    }

    try {
      player.seekTo(state.currentTime, true)
      if (state.isPlaying) {
        player.playVideo()
      } else {
        player.pauseVideo()
      }
    } catch (err) {
      console.error('[WatchTogether] Full sync error:', err)
    }
  }

  const handleChatMessage = (msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg])
  }

  const createRoom = () => {
    if (!userName.trim()) {
      setError('Please enter your name')
      return
    }

    const socket = connectSocket()
    if (!socket || !socket.connected) {
      setError('Connecting to server... Please wait a moment and try again.')
      // Try to connect if not connected
      if (!socket) {
        setTimeout(() => {
          const newSocket = connectSocket()
          if (newSocket?.connected) {
            createRoom() // Retry
          }
        }, 2000)
      }
      return
    }

    setError(null)

    socket.emit('room:create', { movieId, name: userName }, (res: any) => {
      if (!res?.ok) {
        setError(res?.error || 'Failed to create room')
        return
      }

      setRoomId(res.roomId)
      setIsHost(true)
      setMode('active')
      setError(null)
      setUsers([{ socketId: socket.id!, name: userName }])
      
      // Update URL
      const url = new URL(window.location.href)
      url.searchParams.set('room', res.roomId)
      if (videoParam) url.searchParams.set('v', videoParam)
      window.history.pushState({}, '', url)
    })
  }

  const joinRoom = () => {
    if (!userName.trim() || !joinRoomId.trim()) {
      setError('Please enter your name and room ID')
      return
    }

    const socket = connectSocket()
    if (!socket || !socket.connected) {
      setError('Connecting to server... Please wait a moment and try again.')
      // Try to connect if not connected
      if (!socket) {
        setTimeout(() => {
          const newSocket = connectSocket()
          if (newSocket?.connected) {
            joinRoom() // Retry
          }
        }, 2000)
      }
      return
    }

    setError(null)

    socket.emit('room:join', { roomId: joinRoomId, name: userName }, (res: any) => {
      if (!res?.ok) {
        setError(res?.error || 'Failed to join room')
        return
      }

      setRoomId(res.roomId)
      setIsHost(res.isHost)
      setMode('active')
      setError(null)
      setUsers(res.users || [])

      if (res.playbackState) {
        setPlaybackState(res.playbackState)
        handleFullSync(res.playbackState)
      } else {
        socket.emit('player:request-sync', { roomId: res.roomId })
      }

      // Start periodic sync requests (non-hosts)
      if (!res.isHost) {
        syncIntervalRef.current = window.setInterval(() => {
          socket.emit('player:request-sync', { roomId: res.roomId })
        }, 15000)
      }

      // Ensure URL also includes the video id for cross-device opens
      const url = new URL(window.location.href)
      url.searchParams.set('room', res.roomId)
      if (videoParam) url.searchParams.set('v', videoParam)
      window.history.pushState({}, '', url)
    })
  }

  const leaveRoom = () => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('room:leave')
      socketRef.current.disconnect()
      socketRef.current = null
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = null
    }

    setMode('select')
    setRoomId(null)
    setIsHost(false)
    setUsers([])
    setChatMessages([])
    setError(null)

    // Remove room from URL
    const url = new URL(window.location.href)
    url.searchParams.delete('room')
    window.history.pushState({}, '', url)
  }

  const sendChatMessage = () => {
    if (!chatInput.trim() || !socketRef.current || !roomId) return

    socketRef.current.emit('chat:message', {
      roomId,
      text: chatInput,
      name: userName
    })

    setChatInput('')
  }

  // Initialize YouTube IFrame API and hook into existing iframe
  useEffect(() => {
    if (!videoId || mode !== 'active') return

    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const initPlayer = () => {
      const iframeId = `youtube-iframe-${videoId}`
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement
      if (!iframe || youtubePlayerRef.current) return

      try {
        const player = new window.YT.Player(iframeId, {
          events: {
            onReady: (e: any) => {
              youtubePlayerRef.current = e.target
              console.log('[WatchTogether] YouTube player ready')
              
              // If joining as non-host, sync immediately
              if (!isHost && playbackState) {
                handleFullSync(playbackState)
              }
            },
            onStateChange: (e: any) => {
              // Only host emits state changes
              if (!isHost || !socketRef.current || !roomId) return

              const state = e.data
              const isPlaying = state === 1 // YT.PlayerState.PLAYING
              
              // Only emit on play/pause, not buffering
              if (state === 1 || state === 2) {
                const currentTime = e.target.getCurrentTime()
                socketRef.current.emit('player:state-change', {
                  roomId,
                  action: isPlaying ? 'play' : 'pause',
                  currentTime,
                  isPlaying
                })
              }
            }
          }
        })
      } catch (err) {
        console.error('[WatchTogether] Failed to initialize YouTube player:', err)
      }
    }

    const tryInit = () => {
      if (window.YT?.Player) {
        // Small delay to ensure iframe is ready
        setTimeout(initPlayer, 1000)
      } else {
        window.onYouTubeIframeAPIReady = () => {
          setTimeout(initPlayer, 1000)
        }
      }
    }

    // Try immediately, or wait for API
    tryInit()
  }, [videoId, mode, isHost, roomId, playbackState])

  // Generate shareable link - make it more robust
  const shareLink = roomId
    ? `${shareBase}${window.location.pathname}?${new URLSearchParams({
        ...(videoParam ? { v: videoParam } : {}),
        room: roomId,
      }).toString()}`
    : ''
  
  // Copy link to clipboard with better feedback
  const copyShareLink = async () => {
    if (!shareLink) return
    
    try {
      await navigator.clipboard.writeText(shareLink)
      setError('✓ Link copied! Share this link with friends via WhatsApp, Email, or any app.')
      setTimeout(() => setError(null), 4000)
    } catch (err) {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = shareLink
      document.body.appendChild(input)
      input.select()
      try {
        document.execCommand('copy')
        setError('✓ Link copied! Share this link with friends.')
        setTimeout(() => setError(null), 4000)
      } catch (e) {
        setError('Please copy the link manually from the text box above.')
      }
      document.body.removeChild(input)
    }
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-lg hover:from-red-500 hover:to-red-400 transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
      >
        {isOpen ? 'Close Watch Together' : 'Watch Together'}
      </button>

      {isOpen && (
        <div className="mt-4 border-2 border-gray-800 rounded-xl bg-black/90 p-6">
          {mode === 'select' && (
            <div className="space-y-4">
              <div className="text-sm">
                {socketConnected ? (
                  <span className="text-green-400">● Connected - Ready to watch together!</span>
                ) : (
                  <span className="text-yellow-400">● Connecting to server...</span>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setMode('create')}
                  disabled={!socketConnected}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Room
                </button>
                <button
                  onClick={() => setMode('join')}
                  disabled={!socketConnected}
                  className="px-6 py-3 border-2 border-gray-700 hover:border-gray-600 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full px-4 py-2 bg-black border-2 border-gray-800 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
              <button
                onClick={createRoom}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
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
                className="w-full px-4 py-2 bg-black border-2 border-gray-800 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
              <input
                type="text"
                placeholder="Room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="w-full px-4 py-2 bg-black border-2 border-gray-800 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
              <button
                onClick={joinRoom}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
              >
                Join Room
              </button>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}

          {mode === 'active' && roomId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Room ID: <span className="font-bold text-white">{roomId}</span></p>
                  {isHost && <p className="text-xs text-red-400 mt-1">You are the host</p>}
                </div>
                <button
                  onClick={leaveRoom}
                  className="px-4 py-2 border border-gray-700 hover:border-gray-600 rounded-lg text-sm transition-colors"
                >
                  Leave Room
                </button>
              </div>

              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-4 border-2 border-red-600/30">
                <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span>🔗</span> Share Room Link
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 px-4 py-2 bg-black border-2 border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-red-500 cursor-text"
                  />
                  <button
                    onClick={copyShareLink}
                    className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    📋 Copy Link
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Anyone with this link can join your room. Share via WhatsApp, Email, or any messaging app!
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Users in room ({users.length}/10):</p>
                <div className="flex flex-wrap gap-2">
                  {users.map((u) => (
                    <span
                      key={u.socketId}
                      className={`px-2 py-1 rounded text-xs ${
                        u.socketId === socketRef.current?.id
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {u.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Connection Status */}
              <div className="text-xs mb-2">
                {socketConnected ? (
                  <span className="text-green-400">● Connected</span>
                ) : (
                  <span className="text-yellow-400">● Connecting...</span>
                )}
              </div>

              {/* Chat */}
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
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    className="flex-1 px-3 py-2 bg-black border-2 border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-red-600"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold text-sm transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

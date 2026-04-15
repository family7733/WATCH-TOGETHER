# Watch Together - Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to connect to server" Error

**Problem:** The frontend cannot connect to the Socket.io server.

**Solutions:**
- Make sure the backend server is running on `http://localhost:3000`
- Check the browser console for connection errors
- Verify that Socket.io is installed: `cd backend/backend-node && npm list socket.io`
- Check that the backend server shows: `Watch Together Socket.io enabled` when starting

**To verify backend is running:**
```powershell
# Check if backend is running
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

### 2. YouTube Player Not Syncing

**Problem:** Playback controls (play/pause/seek) are not syncing between users.

**Solutions:**
- Make sure the YouTube iframe has `enablejsapi=1` in the URL (already added in App.tsx)
- Check browser console for YouTube API errors
- Verify that the YouTube IFrame API script is loading (check Network tab)
- The player needs a moment to initialize - wait 1-2 seconds after joining a room

**To check YouTube API:**
- Open browser console
- Type: `window.YT` - should show the YouTube API object
- Type: `window.YT.Player` - should show the Player constructor

### 3. Room Creation/Join Fails

**Problem:** Cannot create or join a room.

**Solutions:**
- Check that Socket.io client is installed: `cd frontend && npm list socket.io-client`
- Verify socket connection status (shown in the UI)
- Check backend console for errors
- Make sure you've entered a name before creating/joining

### 4. Chat Not Working

**Problem:** Chat messages are not appearing.

**Solutions:**
- Verify socket connection is active (green dot in UI)
- Check browser console for socket errors
- Make sure you're in an active room (not just selected create/join mode)
- Refresh the page and try again

### 5. Users Not Showing Up

**Problem:** Other users don't appear in the room.

**Solutions:**
- Both users must be in the same room (same Room ID)
- Check that both users have active socket connections
- Verify the backend is receiving join events (check backend console)

## Step-by-Step Debugging

### Step 1: Verify Backend Setup

```powershell
cd C:\Users\dhana\Downloads\AI\AI\smart-film-platform\backend\backend-node

# Check if socket.io is installed
npm list socket.io

# If not installed:
npm install socket.io

# Start backend server
node server.js
```

**Expected output:**
```
Backend running on http://localhost:3000
Watch Together Socket.io enabled
```

### Step 2: Verify Frontend Setup

```powershell
cd C:\Users\dhana\Downloads\AI\AI\smart-film-platform\frontend

# Check if socket.io-client is installed
npm list socket.io-client

# If not installed:
npm install socket.io-client

# Start frontend server
npm run dev
```

### Step 3: Test Connection

1. Open browser to `http://localhost:5173`
2. Navigate to any movie detail page
3. Click "Watch Together" button
4. Open browser console (F12)
5. Look for: `[WatchTogether] Connected to server`

### Step 4: Test Room Creation

1. Enter your name
2. Click "Create Room"
3. Check console for: `[WatchTogether] YouTube player ready`
4. Check that Room ID appears
5. Check connection status shows "● Connected" (green)

### Step 5: Test Room Joining

1. Copy the Room ID or share link
2. Open in a new browser tab/window (or incognito)
3. Navigate to the same movie page
4. Click "Watch Together"
5. Enter name and Room ID
6. Click "Join Room"
7. Both users should see each other in the "Users in room" section

## Browser Console Commands

Open browser console (F12) and try these:

```javascript
// Check Socket.io connection
// Should see socket object in React DevTools or check network tab

// Check YouTube API
console.log(window.YT) // Should show YouTube API object
console.log(window.YT.Player) // Should show Player constructor

// Check if player is initialized (after joining room)
// Look for: [WatchTogether] YouTube player ready
```

## Network Tab Debugging

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for connection to `ws://localhost:3000/socket.io/`
4. Should show status "101 Switching Protocols" (connected)

## Backend Console Debugging

When backend is running, you should see:
- `Backend running on http://localhost:3000`
- `Watch Together Socket.io enabled`
- When users connect: Socket connection logs
- When rooms are created: Room creation logs
- When playback changes: State change logs

## Still Not Working?

1. **Restart both servers:**
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Restart both

2. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R
   - Or clear cache and reload

3. **Check firewall/antivirus:**
   - Make sure localhost connections aren't blocked

4. **Check port conflicts:**
   - Backend should use port 3000
   - Frontend should use port 5173
   - If ports are in use, change them in the respective config files

5. **Verify all dependencies:**
   ```powershell
   # Backend
   cd backend\backend-node
   npm install

   # Frontend
   cd frontend
   npm install
   ```

## Quick Test Checklist

- [ ] Backend server running on port 3000
- [ ] Frontend server running on port 5173
- [ ] Socket.io installed in backend
- [ ] socket.io-client installed in frontend
- [ ] Browser console shows no errors
- [ ] Socket connection shows "Connected" (green dot)
- [ ] YouTube API loads (check Network tab)
- [ ] Room ID appears after creating room
- [ ] Can see other users when joining same room
- [ ] Chat messages appear
- [ ] Playback syncs (test with two browsers)

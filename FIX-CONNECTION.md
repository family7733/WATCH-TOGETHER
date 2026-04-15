# Fix: "Failed to connect to server" Error

## Problem
The frontend shows "Failed to connect to server. Make sure backend is running" when trying to use Watch Together.

## Solution: Restart Backend Server

The backend server needs to be restarted to load the Socket.io code.

### Step 1: Stop Current Backend Server

1. Find the terminal window where the backend is running
2. Press `Ctrl+C` to stop it
3. Or close that terminal window

### Step 2: Restart Backend Server

**Option A: Using PowerShell Script**
```powershell
cd C:\Users\dhana\Downloads\AI\AI\smart-film-platform
.\restart-backend.ps1
```

**Option B: Manual Restart**
```powershell
cd C:\Users\dhana\Downloads\AI\AI\smart-film-platform\backend\backend-node
node server.js
```

### Step 3: Verify Backend Started Correctly

You should see these messages:
```
Backend running on http://localhost:3000
Watch Together Socket.io enabled
[WatchTogether] Namespace /watch-together registered
```

### Step 4: Test Connection

1. Open your browser to `http://localhost:5173`
2. Navigate to any movie detail page
3. Click "Watch Together"
4. Open browser console (F12)
5. Look for: `[WatchTogether] Connected to server`
6. You should see a green "● Connected" indicator

## If Still Not Working

### Check Backend Logs

When you try to create/join a room, you should see logs like:
```
[WatchTogether] Client connected: <socket-id>
[WatchTogether] Room create request: { movieId: '...', name: '...' }
[WatchTogether] Room created: <room-id>
```

### Check Browser Console

Look for these messages:
- `[WatchTogether] Connected to server` ✅ Good
- `[WatchTogether] Connection error: ...` ❌ Problem

### Verify Ports

Make sure:
- Backend is running on port **3000**
- Frontend is running on port **5173**
- No firewall is blocking localhost connections

### Check Socket.io Installation

```powershell
# Backend
cd backend\backend-node
npm list socket.io

# Frontend  
cd frontend
npm list socket.io-client
```

Both should show version 4.8.x

## Quick Test

1. **Backend terminal** should show:
   ```
   Backend running on http://localhost:3000
   Watch Together Socket.io enabled
   ```

2. **Browser console** should show:
   ```
   [WatchTogether] Connected to server
   ```

3. **When creating a room**, backend should show:
   ```
   [WatchTogether] Client connected: ...
   [WatchTogether] Room create request: ...
   [WatchTogether] Room created: ...
   ```

If you see all of these, the connection is working! ✅

# 🎬 Watch Together - Quick Start Guide

## ✅ Everything is Ready!

Watch Together is now configured to work automatically. Just follow these steps:

## Step 1: Start Backend Server

Open a terminal and run:

```powershell
cd C:\Users\dhana\Downloads\AI\AI\smart-film-platform\backend\backend-node
node server.js
```

**You should see:**
```
Backend running on http://localhost:3000
Watch Together Socket.io enabled
[WatchTogether] Namespace /watch-together registered
```

**Keep this terminal open!** The backend must keep running.

## Step 2: Start Frontend Server

Open a **NEW** terminal window and run:

```powershell
cd C:\Users\dhana\Downloads\AI\AI\smart-film-platform\frontend
npm run dev
```

**You should see:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

## Step 3: Use Watch Together

1. **Open your browser** to `http://localhost:5173`
2. **Navigate to any movie** (click on a movie card)
3. **Click "Watch Together"** button (top right, near "Watch Trailer")
4. **Wait for connection** - You'll see "● Connected" when ready (usually 1-2 seconds)
5. **Enter your name** and click "Create Room" or "Join Room"

## How It Works

### Create a Room (Host)
1. Click "Watch Together"
2. Wait for "● Connected" (green)
3. Click "Create Room"
4. Enter your name
5. Click "Create Room"
6. Share the Room ID or link with friends

### Join a Room (Guest)
1. Click "Watch Together"
2. Wait for "● Connected" (green)
3. Click "Join Room"
4. Enter your name and Room ID
5. Click "Join Room"

## Features

✅ **Real-time sync** - Play, pause, and seek are synchronized
✅ **Live chat** - Chat with others while watching
✅ **User list** - See who's in the room
✅ **Share link** - Easy room sharing

## Troubleshooting

### "Connecting to server..." won't go away

**Solution:** Make sure backend is running on port 3000
- Check backend terminal for errors
- Restart backend: Stop (Ctrl+C) and run `node server.js` again

### "Failed to connect" error

**Solution:** 
1. Check backend is running: `http://localhost:3000/health` should return `{"status":"ok"}`
2. Check browser console (F12) for errors
3. Make sure both servers are running

### Buttons are disabled

**Solution:** Wait a few seconds for connection. You'll see "● Connected" when ready.

## Quick Test

1. ✅ Backend running? Check terminal shows "Watch Together Socket.io enabled"
2. ✅ Frontend running? Check browser shows `http://localhost:5173`
3. ✅ Connection? Click "Watch Together" and wait for "● Connected"
4. ✅ Create room? Enter name and click "Create Room"
5. ✅ See Room ID? You're ready to share!

## That's It! 🎉

Watch Together is now ready to use. Just make sure both servers are running and you'll see "● Connected" when ready.

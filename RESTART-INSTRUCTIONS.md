# 🔄 Restart Both Servers - Quick Guide

## ✅ Servers Are Restarting!

I've started the restart process. Two new terminal windows should open:

1. **Backend Server** - Running on port 3000
2. **Frontend Server** - Running on port 5173

## What to Look For

### Backend Terminal Should Show:
```
=== BACKEND SERVER ===
Port: 3000 | Socket.io: Enabled

Backend running on http://localhost:3000
Watch Together Socket.io enabled
Socket.io namespace: /watch-together
CORS enabled for: http://localhost:5173
[WatchTogether] ✅ Namespace /watch-together registered
[WatchTogether] ✅ Ready to accept connections
```

### Frontend Terminal Should Show:
```
=== FRONTEND SERVER ===
Port: 5173 | Vite Dev Server

VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

## After Servers Start (Wait 5-10 seconds)

1. **Open your browser** to: `http://localhost:5173`
2. **Navigate to any movie** page
3. **Click "Watch Together"** button
4. **Wait 3-5 seconds**
5. **You should see:** "● Connected" (green) ✅

## If Servers Didn't Start Automatically

### Manual Restart:

**Backend:**
```powershell
cd C:\Users\dhana\Downloads\AI\AI\smart-film-platform\backend\backend-node
node server.js
```

**Frontend (in a NEW terminal):**
```powershell
cd C:\Users\dhana\Downloads\AI\AI\smart-film-platform\frontend
npm run dev
```

## Quick Test

After both servers are running:

1. **Test Backend:** Open `http://localhost:3000/socket-test`
   - Should show: `{"status":"ok","socketio":"enabled"}`

2. **Test Frontend:** Open `http://localhost:5173`
   - Should load the website

3. **Test Watch Together:**
   - Click "Watch Together" on any movie page
   - Should connect within 3-5 seconds

---

**Both servers are restarting now!** 🚀

Wait a few seconds, then refresh your browser and try Watch Together again!

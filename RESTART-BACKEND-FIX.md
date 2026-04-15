# 🔧 Fix: "Unexpected token '<'" Error

## The Problem
The backend is returning HTML instead of JSON, which means the endpoint isn't registered or the server needs to be restarted.

## Solution: Restart Backend Server

### Step 1: Stop Current Backend
1. Find the terminal where backend is running
2. Press **Ctrl+C** to stop it

### Step 2: Start Backend Again
```powershell
cd C:\Users\dhana\Downloads\AI\AI\smart-film-platform\backend\backend-node
node server.js
```

### Step 3: Verify Endpoints Are Registered

You should see these messages:
```
Backend running on http://localhost:3000
Watch Together Socket.io enabled
Socket.io namespace: /watch-together
CORS enabled for: http://localhost:5173
[Server] Simple Watch Room endpoints registered
[SimpleWatchRoom] ✅ HTTP endpoints registered
```

**If you DON'T see the last 2 lines, the endpoints aren't registered!**

### Step 4: Test the Endpoint

Open browser and go to:
```
http://localhost:3000/watch-room/create
```

Should return JSON error (not HTML):
```json
{"error": "Missing required fields"}
```

If you see HTML, the endpoint isn't registered.

## Quick Test

After restarting backend, test in browser console:
```javascript
fetch('http://localhost:3000/watch-room/create', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({movieId: 'test', hostId: 'test', hostName: 'test'})
}).then(r => r.json()).then(console.log)
```

Should return a room object, not HTML.

---

**Restart the backend server and the endpoints will be registered!** 🚀

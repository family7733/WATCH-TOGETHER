# How to Start the Backend Server

## Quick Start

1. **Open a new PowerShell or Command Prompt window**

2. **Navigate to this directory:**
   ```powershell
   cd C:\Users\dhana\Downloads\AI\AI\smart-film-platform\backend\backend-node
   ```

3. **Start the server:**
   ```powershell
   node server.js
   ```

   You should see:
   ```
   Backend running on http://localhost:3000
   ```

4. **Keep this window open** - the server needs to keep running

5. **Refresh your browser** - the movies should now load!

## Alternative: Use the Startup Script

Double-click `start-backend.ps1` or run:
```powershell
.\start-backend.ps1
```

## Troubleshooting

- **Port 3000 already in use?** 
  - Close any other applications using port 3000
  - Or change the port in `server.js` (line 145)

- **"Cannot find module" error?**
  - Run: `npm install`

- **Server starts but movies don't load?**
  - Check the server console for error messages
  - Verify the OMDB API key is valid


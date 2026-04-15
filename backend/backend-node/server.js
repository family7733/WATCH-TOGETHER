import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { registerWatchTogether } from "./watch-together/socketHandler.js";
import * as watchRoom from "./watch-room.js";
import { setupSimpleWatchRoom } from "./simple-watch-room.js";

const app = express();
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];
const ENV_ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...ENV_ALLOWED_ORIGINS])];
const PRIVATE_NETWORK_ORIGIN = /^https?:\/\/(?:localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(?::\d+)?$/;
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/[\w.-]+\.vercel\.app$/;
const corsOriginValidator = (origin, callback) => {
  if (
    !origin ||
    ALLOWED_ORIGINS.includes(origin) ||
    PRIVATE_NETWORK_ORIGIN.test(origin) ||
    VERCEL_PREVIEW_ORIGIN.test(origin)
  ) {
    callback(null, true);
    return;
  }
  callback(null, false);
};

app.use(cors({
  origin: corsOriginValidator,
  credentials: true
}));
app.use(express.json());

const OMDB_API_KEY = process.env.OMDB_API_KEY || "b9fe71a4";
const OMDB_BASE = "https://www.omdbapi.com/";

// Popular movie search terms for when no query is provided
const POPULAR_SEARCH_TERMS = ["movie", "action", "comedy", "drama", "thriller", "adventure"];

// Get popular movies or search
app.get("/movies", async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    
    // OMDB search query - use query if provided, otherwise use a popular search term
    const searchQuery = query || POPULAR_SEARCH_TERMS[(page - 1) % POPULAR_SEARCH_TERMS.length];
    const fullUrl = `${OMDB_BASE}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(searchQuery)}&type=movie&page=${page}`;

    console.log(`Fetching from OMDB: ${fullUrl.substring(0, 150)}...`);
    
    // Use native fetch (Node 18+)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    const response = await fetch(fullUrl, {
      method: "GET",
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OMDB API error ${response.status}: ${errorText.substring(0, 200)}`);
      throw new Error(`OMDB API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    
    // Check if OMDB returned an error
    if (data.Response === "False") {
      throw new Error(data.Error || "OMDB API returned an error");
    }
    
    // Transform OMDB response to our format
    const movies = (data.Search || []).map((m) => ({
      id: m.imdbID, // Use imdbID as id
      title: m.Title || "",
      overview: "", // OMDB search doesn't provide overview
      genres: "", // OMDB search doesn't provide genres
      rating: m.imdbRating ? parseFloat(m.imdbRating) : undefined,
      poster: m.Poster && m.Poster !== "N/A" ? m.Poster : null,
      year: m.Year || null,
    }));

    // OMDB pagination - estimate total pages (OMDB returns totalResults as string)
    const totalResults = parseInt(data.totalResults) || movies.length;
    const totalPages = Math.ceil(totalResults / 10); // OMDB returns 10 results per page

    // Return movies with pagination info
    res.json({
      movies: movies,
      page: page,
      totalPages: totalPages,
      totalResults: totalResults
    });
  } catch (error) {
    console.error("Backend request failed:", error);
    const errorMessage = error.message || "Unknown error";
    const isTimeout = errorMessage.includes("timeout") || errorMessage.includes("Timeout") || errorMessage.includes("aborted");
    
    res.status(500).json({ 
      message: "Backend request failed", 
      error: errorMessage,
      suggestion: isTimeout ? "OMDB API connection timed out. Please check your internet connection or try again later." : "Please check the server logs for more details."
    });
  }
});

// Get movie details by ID (IMDB ID)
app.get("/movies/:id", async (req, res) => {
  try {
    const movieId = req.params.id; // This should be an IMDB ID (e.g., tt3896198)
    const fullUrl = `${OMDB_BASE}?apikey=${OMDB_API_KEY}&i=${encodeURIComponent(movieId)}`;

    console.log(`Fetching movie details from OMDB: ${fullUrl.substring(0, 150)}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    const response = await fetch(fullUrl, {
      method: "GET",
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ message: "Movie not found" });
      }
      throw new Error(`OMDB API error: ${response.status}`);
    }

    const m = await response.json();
    
    // Check if OMDB returned an error
    if (m.Response === "False") {
      return res.status(404).json({ message: m.Error || "Movie not found" });
    }
    
    // Transform OMDB response to our format
    const movie = {
      id: m.imdbID,
      title: m.Title || "",
      overview: m.Plot || "",
      genres: m.Genre || "",
      rating: m.imdbRating ? parseFloat(m.imdbRating) : undefined,
      poster: m.Poster && m.Poster !== "N/A" ? m.Poster : null,
      year: m.Year || null,
      runtime: m.Runtime && m.Runtime !== "N/A" ? parseInt(m.Runtime.replace(" min", "")) : undefined,
    };

    res.json(movie);
  } catch (error) {
    console.error("Backend request failed:", error);
    res.status(500).json({ message: "Backend request failed", error: error.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Socket.io connection test endpoint
app.get("/socket-test", (req, res) => {
  res.json({ 
    status: "ok", 
    socketio: "enabled",
    namespace: "/watch-together",
    message: "Socket.io is running. Check backend console for connection logs."
  });
});

// Register Watch Room endpoints (Ultra Simple)
app.post('/api/watch-room/create', watchRoom.createRoom);
app.get('/api/watch-room/:roomId', watchRoom.getRoom);
app.post('/api/watch-room/:roomId/join', watchRoom.joinRoom);
app.post('/api/watch-room/:roomId/playback', watchRoom.updatePlayback);
app.post('/api/watch-room/:roomId/chat', watchRoom.sendChat);
console.log('[Server] ✅ Watch Room endpoints registered at /api/watch-room/*');

const PORT = process.env.PORT || 3000;

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: corsOriginValidator,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['*']
  },
  allowEIO3: true, // Allow Engine.IO v3 clients
  transports: ['websocket', 'polling']
});

// Register Watch Together namespace (WebSocket version)
registerWatchTogether(io);

// Register Simple Watch Room (HTTP Polling version - More Reliable)
// Must be called BEFORE httpServer.listen()
try {
  setupSimpleWatchRoom(app);
  console.log('[Server] ✅ Simple Watch Room endpoints registered');
} catch (err) {
  console.error('[Server] ❌ Failed to register Simple Watch Room:', err);
  console.error('[Server] Error details:', err.message);
  console.error('[Server] Stack:', err.stack);
}

httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Watch Together Socket.io enabled`);
  console.log(`Socket.io namespace: /watch-together`);
  console.log(`CORS enabled for:`, ALLOWED_ORIGINS.join(", "));
});


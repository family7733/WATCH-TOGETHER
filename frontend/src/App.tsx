import { BrowserRouter, Routes, Route, Link, useParams, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getPopularMovies, searchMovies, getMovieById, type MovieLite, type MovieFull } from './lib/api'
import { findTrailerVideoId } from './lib/youtube'
import MovieCard from './components/MovieCard'
import Carousel from './components/Carousel'
import SimpleWatchTogether from './components/SimpleWatchTogether'

function extractYouTubeVideoId(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  try {
    const url = new URL(s)
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '')
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
    }
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v')
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
    }
  } catch {
    // not a URL
  }
  return null
}

function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-gray-900/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent hover:from-red-500 hover:to-red-300 transition-all duration-300">
          PAWAR FILMS
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/movies" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium">Movies</Link>
          <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium">Dashboard</Link>
          <Link to="/about" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium">About</Link>
      </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-900/50 bg-gradient-to-b from-transparent to-black/50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} <span className="font-bold text-white">PAWAR FILMS</span> • Powered by <span className="text-red-500">Dhananjay Pawar</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
            <Link to="/movies" className="text-gray-400 hover:text-white transition-colors">Movies</Link>
            <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function HomePage() {
  const [trending, setTrending] = useState<MovieLite[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [ytInput, setYtInput] = useState('')
  const [ytVideoId, setYtVideoId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    // Only get first page of trending movies
    getPopularMovies(1)
      .then((response) => {
        console.log('Trending movies loaded:', response.movies.length)
        // Limit to first 20 movies for trending
        const movies = response.movies.slice(0, 20)
        setTrending(movies)
        console.log('Trending movies set:', movies.length)
      })
      .catch((err) => {
        console.error('Failed to load movies:', err)
        setError(err.message || 'Failed to load movies')
      })
      .finally(() => setLoading(false))
  }, [])
  return (
    <div>
      {/* Watch Together */}
      <section className="mt-6 mb-8 border border-gray-900/60 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-950 via-black to-black">
        <div className="px-6 md:px-10 py-8 md:py-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-xs font-semibold text-red-300 mb-3">
                Watch Together (Hosted)
              </div>
              <h2 className="text-2xl md:text-3xl font-black">Start a room from Home</h2>
              <p className="text-sm text-gray-400 mt-2 max-w-2xl">
                Paste a YouTube link (or video ID), create a room, then share the link with friends.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="rounded-xl border border-gray-900 bg-black/40 p-4 md:p-5">
              <label className="text-sm font-semibold text-gray-200 block mb-2">YouTube link or video ID</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={ytInput}
                  onChange={(e) => {
                    const v = e.target.value
                    setYtInput(v)
                    setYtVideoId(extractYouTubeVideoId(v))
                  }}
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="flex-1 px-4 py-3 bg-black border-2 border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                />
                <button
                  type="button"
                  onClick={() => setYtVideoId(extractYouTubeVideoId(ytInput))}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm hover:from-red-500 hover:to-red-400 transition-all"
                >
                  Use Video
                </button>
              </div>
              {!ytVideoId && ytInput.trim().length > 0 && (
                <div className="mt-3 text-xs text-yellow-300/90">
                  Paste a valid YouTube link (or a 11‑character video id).
                </div>
              )}

              {ytVideoId && (
                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="text-sm font-semibold">Trailer Player</div>
                    <SimpleWatchTogether movieId="home" videoId={ytVideoId} />
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden border-2 border-gray-800 shadow-2xl" id={`youtube-player-${ytVideoId}`}>
                    <iframe
                      id={`youtube-iframe-${ytVideoId}`}
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${ytVideoId}?enablejsapi=1`}
                      title="YouTube video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-900 bg-black/40 p-4 md:p-5">
              <div className="text-sm font-semibold mb-2">How to use</div>
              <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                <li>Paste a YouTube link and click “Use Video”.</li>
                <li>Click “Watch Together” → “Create Room”.</li>
                <li>Copy the share link and send it to friends.</li>
              </ol>
              <div className="mt-4 text-xs text-gray-400">
                Note: Render free tier can sleep. If first load is slow, refresh once.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl mt-6 mb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-black"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.3),transparent_50%)]"></div>
        <div className="relative px-8 md:px-16 py-20 md:py-28 text-white">
          <div className="max-w-4xl">
            <div className="inline-block px-4 py-2 mb-6 rounded-full bg-red-600/20 border border-red-500/30 text-sm font-semibold text-red-300">
              🎬 Your Ultimate Movie Discovery Platform
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              Discover Movies
              <span className="block bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">You'll Love</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              Explore thousands of movies, find your next favorite film, and build your personal watchlist. 
              Powered by cutting-edge technology and curated for movie enthusiasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/movies" 
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg hover:from-red-500 hover:to-red-400 transition-all duration-300 shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 flex items-center justify-center gap-2"
              >
                Explore Movies
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link 
                to="/auth/signup" 
                className="px-8 py-4 rounded-xl border-2 border-white/20 text-white font-semibold text-lg hover:bg-white/10 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black mb-2">Trending Now</h2>
            <p className="text-gray-400">Movies everyone's talking about</p>
          </div>
          <Link 
            to="/movies" 
            className="hidden md:flex items-center gap-2 text-red-500 hover:text-red-400 font-semibold transition-colors"
          >
            View All
            <span>→</span>
          </Link>
        </div>
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 font-medium">Loading amazing movies...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 font-semibold mb-1">Oops! Something went wrong</p>
                <p className="text-sm text-gray-400">{error}</p>
              </div>
            <button 
              onClick={() => window.location.reload()} 
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
            >
              Retry
            </button>
            </div>
          </div>
        )}
        {!loading && !error && trending.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-xl">
            <p className="text-gray-400 text-lg mb-2">No movies found</p>
            <p className="text-sm text-gray-500">Try refreshing the page</p>
          </div>
        )}
        {trending.length > 0 && (
          <div className="mt-4">
          <Carousel>
            {trending.map(m => (
              <div key={m.id} className="w-40 shrink-0">
                <MovieCard id={String(m.id)} title={m.title} year={m.year} poster={m.poster} />
              </div>
            ))}
          </Carousel>
          </div>
        )}
      </section>
    </div>
  )
}

function MoviesPage() {
  const [q, setQ] = useState('')
  const [movies, setMovies] = useState<MovieLite[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)

  // Load popular movies on mount
  useEffect(() => {
    setLoading(true)
    setError(null)
    getPopularMovies(1)
      .then((response) => {
        setMovies(response.movies)
        setPage(response.page)
        setTotalPages(response.totalPages)
      })
      .catch((err) => {
        console.error('Failed to load movies:', err)
        setError(err.message || 'Failed to load movies')
      })
      .finally(() => setLoading(false))
  }, [])

  // Handle genre filter from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const genre = params.get('genre')
    if (genre) {
      setSelectedGenre(genre)
      setQ(genre) // Use genre as search query
    }
  }, [])

  // Handle search
  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim().length >= 2) {
        setLoading(true)
        setError(null)
        setPage(1)
        searchMovies(q.trim(), 1)
          .then((response) => {
            setMovies(response.movies)
            setPage(response.page)
            setTotalPages(response.totalPages)
          })
          .catch((err) => {
            console.error('Search failed:', err)
            setError(err.message || 'Search failed')
          })
          .finally(() => setLoading(false))
      } else if (q.trim().length === 0) {
        // Reset to popular movies when search is cleared
        setLoading(true)
        getPopularMovies(1)
          .then((response) => {
            setMovies(response.movies)
            setPage(response.page)
            setTotalPages(response.totalPages)
          })
          .catch(console.error)
          .finally(() => setLoading(false))
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const loadMore = () => {
    if (page < totalPages && !loading) {
      setLoading(true)
      const nextPage = page + 1
      const fetchFn = q.trim().length >= 2 
        ? searchMovies(q.trim(), nextPage)
        : getPopularMovies(nextPage)
      
      fetchFn
        .then((response) => {
          setMovies([...movies, ...response.movies])
          setPage(response.page)
          setTotalPages(response.totalPages)
        })
        .catch((err) => {
          console.error('Failed to load more:', err)
          setError(err.message || 'Failed to load more movies')
        })
        .finally(() => setLoading(false))
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black mb-3">Browse Movies</h1>
        <p className="text-gray-400 text-lg">Discover your next favorite film from thousands of titles</p>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-8">
      <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </div>
          <input 
            value={q} 
            onChange={e=>setQ(e.target.value)} 
              placeholder="Search movies by title, genre, or keyword..." 
              className="w-full pl-12 pr-4 py-4 bg-black/50 border-2 border-gray-800 text-white rounded-xl placeholder-gray-500 focus:outline-none focus:border-red-600 focus:bg-black/70 transition-all duration-300 backdrop-blur-sm" 
          />
          </div>
          {selectedGenre && (
            <button
              onClick={() => {
                setSelectedGenre(null)
                setQ('')
                window.history.pushState({}, '', '/movies')
                getPopularMovies(1)
                  .then((response) => {
                    setMovies(response.movies)
                    setPage(response.page)
                    setTotalPages(response.totalPages)
                  })
                  .catch(console.error)
              }}
              className="px-4 py-2 border border-gray-700 rounded text-sm hover:bg-gray-900"
            >
              Clear Filter: {selectedGenre} ×
            </button>
          )}
        </div>
        
        {/* Genre Filters */}
        <div className="mb-6">
          <div className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Browse by Genre</div>
          <div className="flex flex-wrap gap-3">
            {["Action","Adventure","Comedy","Drama","Horror","Romance","Sci-Fi","Thriller","Documentary","Animation","Crime","Fantasy","Mystery","Family","War","Music"].map(g => (
              <button
                key={g}
                onClick={() => {
                  setSelectedGenre(g)
                  setQ(g)
                  setPage(1)
                }}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all duration-300 ${
                  selectedGenre === g 
                    ? 'bg-gradient-to-r from-red-600 to-red-500 border-red-500 text-white shadow-lg shadow-red-500/30 scale-105' 
                    : 'border-gray-800 bg-black/50 text-gray-300 hover:border-gray-700 hover:bg-gray-900/50 hover:scale-105'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading && movies.length === 0 && <div className="text-sm opacity-70 mb-4">Loading movies...</div>}
      {error && <div className="text-red-400 text-sm mb-4">Error: {error}</div>}
      {!loading && !error && movies.length === 0 && (
        <div className="text-center py-12 border border-gray-800 rounded-lg">
          <div className="text-lg mb-2">No movies found</div>
          <div className="text-sm opacity-70">Try a different search term or browse by genre</div>
        </div>
      )}
      
      {movies.length > 0 && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing <span className="font-semibold text-white">{movies.length}</span> {q ? 'search results' : 'movies'} 
              {totalPages > 1 && <span className="ml-2">(Page {page} of {totalPages})</span>}
            </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {movies.map(m => (
          <MovieCard key={m.id} id={String(m.id)} title={m.title} year={m.year} poster={m.poster} />
        ))}
      </div>
          {page < totalPages && (
            <div className="mt-12 text-center">
              <button 
                onClick={loadMore}
                disabled={loading}
                className="group px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl hover:from-red-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 disabled:hover:scale-100 flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    Load More (Page {page + 1} of {totalPages})
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MovieDetailsPage() {
  const { id } = useParams()
  const [movie, setMovie] = useState<MovieFull | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => { 
    if (id) {
      setLoading(true)
      getMovieById(id).then((m) => {
        setMovie(m)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [id])
  
  useEffect(() => {
    if (movie?.title) findTrailerVideoId(movie.title).then(setVideoId)
  }, [movie?.title])
  
  if (loading) {
    return (
      <div className="mt-6 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Loading movie details...</p>
        </div>
      </div>
    )
  }
  
  if (!movie) {
    return (
      <div className="mt-6 text-center py-20">
        <p className="text-2xl font-bold mb-2">Movie not found</p>
        <p className="text-gray-400 mb-6">The movie you're looking for doesn't exist.</p>
        <Link to="/movies" className="inline-block px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors">
          Browse Movies
        </Link>
      </div>
    )
  }
  
  return (
    <div className="mt-6">
      {/* Hero Section */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
      {movie.poster && (
          <div className="absolute inset-0">
            <img 
              src={movie.poster} 
              alt={movie.title} 
              className="w-full h-full object-cover opacity-20 blur-3xl scale-110" 
            />
          </div>
        )}
        <div className="relative bg-gradient-to-b from-black/80 via-black/60 to-black p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-[280px_1fr] max-w-6xl">
            {movie.poster && (
              <div className="relative group">
                <img 
                  src={movie.poster} 
                  alt={movie.title} 
                  className="w-full rounded-xl shadow-2xl border-2 border-gray-800 group-hover:border-red-600 transition-all duration-300" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
              </div>
            )}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-300">
                {movie.year && <span className="px-3 py-1 bg-red-600/20 border border-red-600/30 rounded-lg font-semibold">{movie.year}</span>}
                {movie.runtime && <span className="text-sm">⏱ {movie.runtime} min</span>}
                {movie.genres && <span className="text-sm">🎭 {movie.genres}</span>}
              </div>
        {typeof movie.rating === 'number' && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-lg">
                    <span className="text-2xl font-black text-black">⭐</span>
                  </div>
                  <div>
                    <div className="text-3xl font-black">{movie.rating.toFixed(1)}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Rating</div>
                  </div>
                </div>
              )}
              {movie.overview && (
                <p className="text-lg text-gray-300 leading-relaxed mb-6">{movie.overview}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Section */}
        {videoId && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black">Watch Trailer</h2>
            <SimpleWatchTogether movieId={String(movie.id)} videoId={videoId} />
          </div>
          <div className="aspect-video rounded-xl overflow-hidden border-2 border-gray-800 shadow-2xl" id={`youtube-player-${videoId}`}>
            <iframe
              id={`youtube-iframe-${videoId}`}
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
              title="YouTube trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          </div>
        )}
    </div>
  )
}

function DashboardPage() {
  const [favorites, setFavorites] = useState<MovieLite[]>([])
  const [watchlist, setWatchlist] = useState<MovieLite[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<MovieLite[]>([])

  // Load user data from localStorage (in a real app, this would come from an API)
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites')
    const savedWatchlist = localStorage.getItem('watchlist')
    const savedRecent = localStorage.getItem('recentlyViewed')
    
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites))
    if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist))
    if (savedRecent) setRecentlyViewed(JSON.parse(savedRecent))
  }, [])

  return (
    <div className="mt-6">
      <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-black border border-gray-800 rounded-lg p-6">
          <div className="text-2xl font-bold">{favorites.length}</div>
          <div className="text-sm opacity-70 mt-1">Favorite Movies</div>
        </div>
        <div className="bg-black border border-gray-800 rounded-lg p-6">
          <div className="text-2xl font-bold">{watchlist.length}</div>
          <div className="text-sm opacity-70 mt-1">Watchlist</div>
        </div>
        <div className="bg-black border border-gray-800 rounded-lg p-6">
          <div className="text-2xl font-bold">{recentlyViewed.length}</div>
          <div className="text-sm opacity-70 mt-1">Recently Viewed</div>
        </div>
      </div>

      {/* Favorites Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Favorites</h2>
          {favorites.length > 0 && (
            <Link to="/movies" className="text-sm opacity-70 hover:opacity-100">View All</Link>
          )}
        </div>
        {favorites.length === 0 ? (
          <div className="text-sm opacity-70 py-8 text-center border border-gray-800 rounded-lg">
            No favorite movies yet. <Link to="/movies" className="text-red-500 hover:underline">Browse movies</Link> to add favorites.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {favorites.slice(0, 6).map(m => (
              <MovieCard key={m.id} id={String(m.id)} title={m.title} year={m.year} poster={m.poster} />
            ))}
          </div>
        )}
      </section>

      {/* Watchlist Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Watchlist</h2>
          {watchlist.length > 0 && (
            <Link to="/movies" className="text-sm opacity-70 hover:opacity-100">View All</Link>
          )}
        </div>
        {watchlist.length === 0 ? (
          <div className="text-sm opacity-70 py-8 text-center border border-gray-800 rounded-lg">
            Your watchlist is empty. <Link to="/movies" className="text-red-500 hover:underline">Discover movies</Link> to add to your watchlist.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {watchlist.slice(0, 6).map(m => (
              <MovieCard key={m.id} id={String(m.id)} title={m.title} year={m.year} poster={m.poster} />
            ))}
          </div>
        )}
      </section>

      {/* Recently Viewed Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recently Viewed</h2>
          {recentlyViewed.length > 0 && (
            <Link to="/movies" className="text-sm opacity-70 hover:opacity-100">View All</Link>
          )}
        </div>
        {recentlyViewed.length === 0 ? (
          <div className="text-sm opacity-70 py-8 text-center border border-gray-800 rounded-lg">
            No recently viewed movies. Start browsing to see your history here.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyViewed.slice(0, 6).map(m => (
              <MovieCard key={m.id} id={String(m.id)} title={m.title} year={m.year} poster={m.poster} />
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/movies" className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition">
            <div className="font-semibold mb-1">Browse All Movies</div>
            <div className="text-sm opacity-70">Search and discover new movies</div>
          </Link>
          <Link to="/movies" className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition">
            <div className="font-semibold mb-1">Explore Genres</div>
            <div className="text-sm opacity-70">Find movies by genre</div>
          </Link>
        </div>
      </section>
    </div>
  )
}
function AboutPage() {
  return (
    <div className="mt-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">About PAWAR FILMS</h1>
      
      {/* Mission Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
        <p className="text-opacity-90 leading-relaxed mb-4">
          PAWAR FILMS is a modern movie discovery platform designed to help you find and explore movies you'll love. 
          We combine the power of AI recommendations with an intuitive interface to make movie discovery effortless and enjoyable.
        </p>
        <p className="text-opacity-90 leading-relaxed">
          Our platform provides access to thousands of movies with detailed information, ratings, and trailers, 
          making it easy to discover your next favorite film.
        </p>
      </section>

      {/* Tech Stack Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Frontend</h3>
            <ul className="text-sm opacity-80 space-y-1">
              <li>• React with TypeScript</li>
              <li>• Vite for fast development</li>
              <li>• Tailwind CSS for styling</li>
              <li>• React Router for navigation</li>
            </ul>
          </div>
          <div className="border border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Backend</h3>
            <ul className="text-sm opacity-80 space-y-1">
              <li>• Node.js with Express</li>
              <li>• OMDB API integration</li>
              <li>• RESTful API architecture</li>
              <li>• CORS enabled for cross-origin requests</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">🎬 Movie Discovery</h3>
            <p className="text-sm opacity-80">
              Browse trending movies, search by title, or explore by genre to find your next watch.
            </p>
          </div>
          <div className="border border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">⭐ Personal Dashboard</h3>
            <p className="text-sm opacity-80">
              Keep track of your favorites, watchlist, and recently viewed movies all in one place.
            </p>
          </div>
          <div className="border border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">🔍 Advanced Search</h3>
            <p className="text-sm opacity-80">
              Search through thousands of movies with our powerful search functionality and genre filters.
            </p>
          </div>
          <div className="border border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">📊 Movie Details</h3>
            <p className="text-sm opacity-80">
              Get detailed information including ratings, plot summaries, trailers, and more for each movie.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <div className="border border-gray-800 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Get in Touch</h3>
              <p className="text-sm opacity-80 mb-4">
                Have questions, suggestions, or feedback? We'd love to hear from you!
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">📧</span>
                <div>
                  <div className="font-semibold text-sm">Email</div>
                  <div className="text-sm opacity-80">contact@pawarfilms.com</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-lg">👤</span>
                <div>
                  <div className="font-semibold text-sm">Developer</div>
                  <div className="text-sm opacity-80">Dhananjay Pawar</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-lg">🌐</span>
                <div>
                  <div className="font-semibold text-sm">Website</div>
                  <div className="text-sm opacity-80">www.pawarfilms.com</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800">
              <p className="text-sm opacity-70">
                We typically respond within 24-48 hours. For urgent matters, please include "URGENT" in your subject line.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="text-center text-sm opacity-70">
        <p>© {new Date().getFullYear()} PAWAR FILMS • Powered by Dhananjay Pawar</p>
      </section>
    </div>
  )
}
function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const featuredGenres = ["Sci-Fi", "Thriller", "Drama", "Anime", "Superhero", "Mystery"]

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }
    setError(null)
    // Placeholder action – replace with real auth workflow
    alert(`Welcome back, ${email}!`)
  }

  return (
    <div className="mt-6">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] bg-[#050505] border border-gray-900 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Mood board / inspiration panel */}
        <div className="relative px-10 py-12 bg-gradient-to-br from-red-700/40 via-black to-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.25),rgba(0,0,0,0))]" />
          <div className="relative z-10">
            <div className="text-sm uppercase tracking-[0.3em] text-red-300 mb-4">Pawar Films Studio</div>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
              Step into your
              <span className="text-red-400"> cinematic universe</span>
            </h1>
            <p className="text-base opacity-80 max-w-xl mb-10">
              Log in to continue building your watchlists, track favorites, and get hyper-personalized movie drops.
              We design experiences where storytelling meets stunning UI.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <div className="border border-white/10 rounded-xl p-4 bg-black/30 backdrop-blur">
                <div className="text-2xl font-bold text-white">2.4k+</div>
                <div className="text-xs uppercase tracking-wide opacity-70">Curated titles</div>
              </div>
              <div className="border border-white/10 rounded-xl p-4 bg-black/30 backdrop-blur">
                <div className="text-2xl font-bold text-white">98%</div>
                <div className="text-xs uppercase tracking-wide opacity-70">User satisfaction</div>
              </div>
              <div className="border border-white/10 rounded-xl p-4 bg-black/30 backdrop-blur">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-xs uppercase tracking-wide opacity-70">Curation studio</div>
              </div>
            </div>

            <div className="mb-4 text-sm uppercase tracking-[0.3em] opacity-60">Trending universes</div>
            <div className="flex flex-wrap gap-2">
              {featuredGenres.map((genre) => (
                <div
                  key={genre}
                  className="px-3 py-1 rounded-full border border-white/20 text-xs uppercase tracking-wide text-white/90"
                >
                  {genre}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-black px-8 py-10 lg:px-10">
          <div className="mb-8">
            <div className="text-sm uppercase tracking-widest text-red-500 mb-2">Sign in</div>
            <h2 className="text-3xl font-semibold mb-2">Welcome back, creator</h2>
            <p className="text-sm opacity-70">
              Craft your next movie night, manage watchlists, collaborate with friends, and explore cinematic stories.
            </p>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-gray-800 rounded-lg py-3 text-sm font-medium hover:bg-gray-900 transition mb-5"
          >
            <span className="text-lg">🔐</span>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-gray-800 flex-1" />
            <div className="text-xs uppercase tracking-[0.4em] opacity-60">or</div>
            <div className="h-px bg-gray-800 flex-1" />
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium mb-2 block">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@pawarstudio.com"
                className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-red-600"
                />
                Remember me
              </label>
              <button type="button" className="text-red-400 hover:text-red-300">Forgot password?</button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-200 text-sm px-4 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 transition rounded-lg py-3 font-semibold tracking-wide uppercase"
            >
              Sign in to Pawar Films
            </button>
          </form>

          <div className="mt-6 text-sm text-center opacity-80">
            New to the studio?{' '}
            <Link to="/auth/signup" className="text-red-400 hover:text-red-300 font-semibold">Create a profile</Link>
          </div>

          <div className="mt-10 border border-gray-800 rounded-xl p-4 text-xs opacity-60 leading-relaxed">
            Secure login powered by our cinematic auth stack. By continuing you agree to our Terms and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  )
}
function SignupPage() { return <div className="mt-6">Signup</div> }

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-black">
        <Header />
        <main className="flex-1 px-6 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/movies/:id" element={<MovieDetailsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<Navigate to="/about" replace />} />
            <Route path="/admin" element={<Navigate to="/" replace />} />
            <Route path="/auth/login" element={<Navigate to="/" replace />} />
            <Route path="/auth/signup" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}



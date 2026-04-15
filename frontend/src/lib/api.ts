const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000'

export type MovieLite = {
  id: number | string  // Support both numeric and string IDs (IMDB IDs)
  title: string
  year?: string
  poster?: string
  rating?: number
}

export type MovieFull = {
  id: number
  title: string
  year?: string
  runtime?: number
  genres?: string
  overview?: string
  poster?: string
  rating?: number
}

export type MoviesResponse = {
  movies: MovieLite[]
  page: number
  totalPages: number
  totalResults: number
}

export async function getPopularMovies(page: number = 1): Promise<MoviesResponse> {
  try {
    const response = await fetch(`${API_BASE}/movies?page=${page}`)

    if (!response.ok) {
      throw new Error("API failed")
    }

    const data = await response.json()
    console.log('Backend movies response:', data)
    
    // Handle both old format (array) and new format (object with movies array)
    if (Array.isArray(data)) {
      return {
        movies: data.map((m: any) => ({
          id: m.id,
          title: m.title,
          year: m.year,
          poster: m.poster,
          rating: m.rating,
        })),
        page: 1,
        totalPages: 1,
        totalResults: data.length
      }
    }
    
    return {
      movies: (data.movies || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        year: m.year,
        poster: m.poster,
        rating: m.rating,
      })),
      page: data.page || page,
      totalPages: data.totalPages || 1,
      totalResults: data.totalResults || 0
    }
  } catch (error: any) {
    console.error("Backend API error:", error)
    // Provide more detailed error message
    if (error.message === "Failed to fetch" || error.name === "TypeError") {
      throw new Error("Cannot connect to backend server. Make sure the backend is running on http://localhost:3000")
    }
    if (error.message) {
      throw new Error(error.message)
    }
    throw new Error("Failed to fetch movies")
  }
}

export async function searchMovies(query: string, page: number = 1): Promise<MoviesResponse> {
  try {
    const response = await fetch(`${API_BASE}/movies?q=${encodeURIComponent(query)}&page=${page}`)

    if (!response.ok) {
      throw new Error("API failed")
    }

    const data = await response.json()
    console.log('Backend search response:', data)
    
    // Handle both old format (array) and new format (object with movies array)
    if (Array.isArray(data)) {
      return {
        movies: data.map((m: any) => ({
          id: m.id,
          title: m.title,
          year: m.year,
          poster: m.poster,
          rating: m.rating,
        })),
        page: 1,
        totalPages: 1,
        totalResults: data.length
      }
    }
    
    return {
      movies: (data.movies || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        year: m.year,
        poster: m.poster,
        rating: m.rating,
      })),
      page: data.page || page,
      totalPages: data.totalPages || 1,
      totalResults: data.totalResults || 0
    }
  } catch (error: any) {
    console.error("Backend API error:", error)
    // Provide more detailed error message
    if (error.message === "Failed to fetch" || error.name === "TypeError") {
      throw new Error("Cannot connect to backend server. Make sure the backend is running on http://localhost:3000")
    }
    if (error.message) {
      throw new Error(error.message)
    }
    throw new Error("Failed to search movies")
  }
}

export async function getMovieById(id: string | number): Promise<MovieFull | null> {
  try {
    const response = await fetch(`${API_BASE}/movies/${id}`)

    if (!response.ok) {
      throw new Error("API failed")
    }

    const data = await response.json()
    return {
      id: data.id,
      title: data.title,
      year: data.year,
      runtime: undefined, // Backend doesn't return runtime yet
      genres: Array.isArray(data.genres) ? data.genres.join(', ') : data.genres,
      overview: data.overview,
      poster: data.poster,
      rating: data.rating,
    }
  } catch (error: any) {
    console.error("Backend API error:", error)
    return null
  }
}


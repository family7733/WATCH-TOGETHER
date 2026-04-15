import axios from 'axios'

const TMDB_API_KEY = (import.meta as any).env?.VITE_TMDB_API_KEY || '28ad717f54f5cf84820b45205b4521df'
const TMDB_READ_TOKEN = (import.meta as any).env?.VITE_TMDB_READ_TOKEN
const TMDB_BASE = 'https://api.themoviedb.org/3'
export const TMDB_IMG = 'https://image.tmdb.org/t/p'

// Use API key in URL params (more reliable than Bearer token for browser)
const client = axios.create({
  baseURL: TMDB_BASE,
  params: { api_key: TMDB_API_KEY },
  headers: { Accept: 'application/json' }
})

// Debug: log which auth method is being used
console.log('TMDB Auth: API Key', `(${TMDB_API_KEY.substring(0, 8)}...)`)

export type TmdbMovieLite = {
  id: number
  title: string
  year?: string
  poster?: string
}

export type TmdbMovieFull = {
  id: number
  title: string
  year?: string
  runtime?: number
  genres?: string
  overview?: string
  poster?: string
  rating?: number
}

export async function getTrendingMovies(): Promise<TmdbMovieLite[]> {
  try {
    // Use /movie/popular endpoint (same as user's working example)
    const { data } = await client.get('/movie/popular')
    console.log('TMDB popular response:', data)
    if (!data || !data.results) {
      throw new Error('Invalid response from TMDB API')
    }
    return data.results.map((m: any) => ({
      id: m.id,
      title: m.title ?? m.name ?? '',
      year: m.release_date ? String(m.release_date).slice(0, 4) : undefined,
      poster: m.poster_path ? `${TMDB_IMG}/w500${m.poster_path}` : undefined,
    }))
  } catch (error: any) {
    console.error('TMDB popular error:', error.response?.data || error.message)
    const errorMsg = error.response?.data?.status_message || error.message || 'Failed to fetch movies'
    throw new Error(errorMsg)
  }
}

export async function searchMoviesTmdb(query: string): Promise<TmdbMovieLite[]> {
  try {
    const { data } = await client.get('/search/movie', { params: { query, language: 'en-US', include_adult: false } })
    console.log('TMDB search response:', data)
    return (data?.results ?? []).map((m: any) => ({
      id: m.id,
      title: m.title ?? m.name ?? '',
      year: m.release_date ? String(m.release_date).slice(0, 4) : undefined,
      poster: m.poster_path ? `${TMDB_IMG}/w342${m.poster_path}` : undefined,
    }))
  } catch (error: any) {
    console.error('TMDB search error:', error.response?.data || error.message)
    return []
  }
}

export async function getMovieByIdTmdb(id: string | number): Promise<TmdbMovieFull | null> {
  try {
    const { data } = await client.get(`/movie/${id}`, { params: { language: 'en-US' } })
    if (!data) return null
    return {
      id: data.id,
      title: data.title,
      year: data.release_date ? String(data.release_date).slice(0, 4) : undefined,
      runtime: data.runtime,
      genres: Array.isArray(data.genres) ? data.genres.map((g: any) => g.name).join(', ') : undefined,
      overview: data.overview,
      poster: data.poster_path ? `${TMDB_IMG}/w500${data.poster_path}` : undefined,
      rating: typeof data.vote_average === 'number' ? data.vote_average : undefined,
    }
  } catch (error: any) {
    console.error('TMDB movie details error:', error.response?.data || error.message)
    return null
  }
}



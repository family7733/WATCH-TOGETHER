import axios from 'axios'

const OMDB_API_KEY = (import.meta as any).env?.VITE_OMDB_API_KEY || 'b9fe71a4'
const OMDB_BASE = 'https://www.omdbapi.com/'

export type OmdbSearchItem = {
  imdbID: string
  Title: string
  Year?: string
  Type?: string
  Poster?: string
}

export type OmdbMovie = {
  imdbID: string
  Title: string
  Year?: string
  Runtime?: string
  Genre?: string
  Plot?: string
  Poster?: string
  imdbRating?: string
}

export async function searchMovies(query: string): Promise<OmdbSearchItem[]> {
  const url = `${OMDB_BASE}?apikey=${OMDB_API_KEY}&type=movie&s=${encodeURIComponent(query)}`
  const { data } = await axios.get(url)
  if (data && data.Search) return data.Search as OmdbSearchItem[]
  return []
}

export async function getMovieById(imdbID: string): Promise<OmdbMovie | null> {
  const url = `${OMDB_BASE}?apikey=${OMDB_API_KEY}&i=${encodeURIComponent(imdbID)}`
  const { data } = await axios.get(url)
  if (data && data.Response === 'True') return data as OmdbMovie
  return null
}



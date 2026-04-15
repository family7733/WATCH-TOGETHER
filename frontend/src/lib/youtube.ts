import axios from 'axios'

const YT_API_KEY = (import.meta as any).env?.VITE_YT_API_KEY || 'AIzaSyCNMmdCdAvfEGzUDe03DhxKgpNLcjF0CBk'
const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'

export async function findTrailerVideoId(title: string): Promise<string | null> {
  try {
    const q = `${title} official trailer`
    const { data } = await axios.get(YT_SEARCH_URL, {
      params: {
        key: YT_API_KEY,
        part: 'snippet',
        type: 'video',
        maxResults: 1,
        q,
        videoEmbeddable: 'true',
        safeSearch: 'moderate',
      },
    })
    const item = data?.items?.[0]
    return item?.id?.videoId ?? null
  } catch {
    return null
  }
}



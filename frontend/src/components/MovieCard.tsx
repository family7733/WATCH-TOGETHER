import { Link } from 'react-router-dom'

type Props = {
  id: string
  title: string
  year?: string
  poster?: string
}

export default function MovieCard({ id, title, year, poster }: Props) {
  return (
    <Link 
      to={`/movies/${id}`} 
      className="group relative overflow-hidden rounded-xl bg-gradient-to-b from-gray-900 to-black border-2 border-gray-800 hover:border-red-600 transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/20 hover:-translate-y-2"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {poster ? (
          <>
            <img 
              src={poster} 
              alt={title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-gray-500 text-sm font-medium">
            <div className="text-center">
              <div className="text-4xl mb-2">🎬</div>
              <div>No Poster</div>
            </div>
          </div>
        )}
        {/* Hover overlay with title */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <div className="text-white font-bold text-sm mb-1 line-clamp-2">{title}</div>
            {year && <div className="text-red-400 text-xs font-semibold">{year}</div>}
          </div>
        </div>
      </div>
      <div className="p-4 bg-black/50 backdrop-blur-sm">
        <div className="truncate font-bold text-white text-sm mb-1 group-hover:text-red-400 transition-colors">{title}</div>
        {year && <div className="text-xs text-gray-400 font-medium">{year}</div>}
      </div>
      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </div>
    </Link>
  )
}



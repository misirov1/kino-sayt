import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Play, Heart, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';

export default function MovieCard({ movie, isFavorited, onFavoriteToggle }) {
  const { user, setIsAuthModalOpen } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const res = await apiFetch(`/social/favorites/${movie.id}/toggle`, { method: 'POST' });
      showToast(res.message, 'success');
      if (onFavoriteToggle) onFavoriteToggle(movie.id, res.isFavorite);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="group relative flex flex-col bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 hover:shadow-2xl hover:shadow-red-950/20 transition-all duration-300">
      
      {/* Poster Image Container */}
      <Link to={`/movie/${movie.id}`} className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950 block">
        <img
          src={movie.poster}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Badges on Top */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-600/90 text-white backdrop-blur-md shadow-sm">
            {movie.quality || 'HD'}
          </span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-zinc-300 backdrop-blur-md border border-zinc-700/50">
            {movie.ageLimit || '12+'}
          </span>
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavoriteClick}
          title="Sevimlilarga qo‘shish"
          className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-md border border-zinc-700/50 transition-all hover:scale-110 active:scale-95 z-10"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-zinc-200'}`} />
        </button>

        {/* Hover Watch Quick Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50 transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </Link>

      {/* Info Container */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs mb-1">
            <span className="text-zinc-400 font-medium">{movie.year}</span>
            <span className="flex items-center text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
              {movie.rating ? Number(movie.rating).toFixed(1) : '5.0'}
            </span>
          </div>

          <Link to={`/movie/${movie.id}`} className="block">
            <h3 className="font-bold text-sm text-white hover:text-red-400 transition-colors line-clamp-1">
              {movie.title}
            </h3>
          </Link>

          <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
            {movie.genre}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-500" />
            {movie.duration}
          </span>
          <span className="text-zinc-400 font-medium truncate max-w-[90px]">
            {movie.language || 'O‘zbekcha'}
          </span>
        </div>
      </div>
    </div>
  );
}

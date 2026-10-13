import React, { useState, useEffect } from 'react';
import MovieCard from '../components/movie/MovieCard';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Heart, Film, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FavoritesPage() {
  const { user, setIsAuthModalOpen } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      apiFetch('/social/favorites')
        .then(data => setFavorites(data || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleFavoriteToggle = (movieId, isFav) => {
    if (!isFav) {
      setFavorites(prev => prev.filter(m => m.id !== movieId));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 max-w-md space-y-4">
          <Heart className="w-12 h-12 text-red-500 mx-auto fill-red-500" />
          <h2 className="text-xl font-bold text-white">Mening Sevimlilarim</h2>
          <p className="text-xs text-zinc-400">
            Sevimlilar ro‘yxatini ko‘rish uchun avval hisobingizga kiring.
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm"
          >
            Kirish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="border-b border-zinc-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Heart className="w-7 h-7 text-red-500 fill-red-500" />
              <span>Sevimli Kinolarim</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Siz saqlagan kinolar soni: <strong className="text-white">{favorites.length}</strong> ta
            </p>
          </div>

          <Link
            to="/movies"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-400"
          >
            <span>Katalogga o‘tish</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-400">Sevimlilar yuklanmoqda...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-24 text-center bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
            <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Sevimlilar ro‘yxati bo‘sh</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              Kinolar katalogidan o‘zingizga yoqqan filmlarni yurakchani bosib saqlang.
            </p>
            <Link
              to="/movies"
              className="inline-block bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all"
            >
              Kinolar katalogiga o‘tish
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
            {favorites.map(m => (
              <MovieCard
                key={m.id}
                movie={m}
                isFavorited={true}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

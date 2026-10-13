import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Info, Star, ChevronLeft, ChevronRight, Users, Sparkles, Film } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';

export default function MovieHero({ movies = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user, loginGuest } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [movies.length]);

  if (!movies || movies.length === 0) {
    return (
      <div className="relative w-full h-[50vh] min-h-[380px] flex items-center justify-center bg-gradient-to-b from-red-950/30 via-zinc-950 to-zinc-950 border-b border-zinc-800 p-6 text-center">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/80 border border-red-800 text-red-400 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Virtual Kino Platformasi</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Do‘stlar bilan birga kino tomosha qiling
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto">
            O‘z qurilmangizdagi videoni yuklang yoki katalogdan tanlang, 4 kishilik virtual xonada sinxron ko‘ring.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/upload"
              className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-900/40 text-sm flex items-center gap-2"
            >
              <Film className="w-4 h-4" />
              <span>Kino yuklash</span>
            </Link>
            <Link
              to="/movies"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold px-5 py-3 rounded-xl text-sm"
            >
              Katalogga o‘tish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const movie = movies[currentIndex] || movies[0];

  const handleStartRoom = async () => {
    try {
      if (!user) {
        await loginGuest();
      }
      const res = await apiFetch('/rooms/create', {
        method: 'POST',
        body: { movieId: movie.id }
      });
      navigate(`/room/${res.roomId}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="relative w-full h-[65vh] min-h-[480px] max-h-[680px] overflow-hidden bg-black select-none">
      
      {/* Background Backdrop Image */}
      <div className="absolute inset-0">
        <img
          src={movie.backdrop}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-[0.7] transition-all duration-1000 transform scale-100 animate-fadeIn"
        />
        {/* Cinematic Multi-stop Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent max-w-3xl" />
      </div>

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16">
        <div className="max-w-2xl space-y-4">
          
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 font-black text-white uppercase tracking-wider text-[11px] shadow-lg shadow-red-900/40">
              <Sparkles className="w-3 h-3" />
              Tavsiya etiladi
            </span>
            <span className="px-2 py-1 rounded-md bg-zinc-800/80 text-zinc-300 font-bold border border-zinc-700/60 backdrop-blur-md">
              {movie.quality}
            </span>
            <span className="px-2 py-1 rounded-md bg-zinc-800/80 text-zinc-300 font-semibold border border-zinc-700/60 backdrop-blur-md">
              {movie.ageLimit}
            </span>
            <span className="flex items-center text-amber-400 font-black px-2 py-1 rounded-md bg-amber-950/60 border border-amber-800/50 backdrop-blur-md">
              <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
              {movie.rating ? Number(movie.rating).toFixed(1) : '5.0'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
            {movie.title}
          </h1>

          {/* Meta */}
          <p className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <span>{movie.year}</span>
            <span>•</span>
            <span className="text-amber-300">{movie.genre}</span>
            <span>•</span>
            <span>{movie.duration}</span>
          </p>

          {/* Short description */}
          <p className="text-sm text-zinc-300 line-clamp-3 max-w-xl leading-relaxed">
            {movie.description}
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleStartRoom}
              className="flex items-center gap-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-6 py-3 rounded-xl shadow-xl shadow-red-950/50 transition-all hover:scale-102 active:scale-98 text-sm"
            >
              <Users className="w-5 h-5" />
              <span>Virtual Xonada Ko‘rish</span>
            </button>

            <Link
              to={`/movie/${movie.id}`}
              className="flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700/90 text-white font-semibold px-5 py-3 rounded-xl border border-zinc-700/70 backdrop-blur-md transition-all text-sm"
            >
              <Info className="w-4 h-4 text-zinc-300" />
              <span>Batafsil ma’lumot</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next controls */}
      {movies.length > 1 && (
        <div className="absolute bottom-6 right-4 sm:right-8 flex items-center gap-2 z-20">
          <button
            onClick={() => setCurrentIndex(prev => (prev === 0 ? movies.length - 1 : prev - 1))}
            className="p-2 rounded-full bg-black/50 hover:bg-red-600 text-white border border-zinc-700/60 backdrop-blur-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentIndex(prev => (prev + 1) % movies.length)}
            className="p-2 rounded-full bg-black/50 hover:bg-red-600 text-white border border-zinc-700/60 backdrop-blur-md transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

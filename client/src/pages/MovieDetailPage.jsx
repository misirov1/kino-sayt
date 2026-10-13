import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import CommentsSection from '../components/movie/CommentsSection';
import RatingStars from '../components/movie/RatingStars';
import MovieCard from '../components/movie/MovieCard';
import { 
  Play, Users, Heart, Share2, Star, Clock, 
  Calendar, Shield, Film, Eye, X 
} from 'lucide-react';

export default function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setIsAuthModalOpen, loginGuest } = useAuth();
  const { showToast } = useNotification();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    async function loadMovie() {
      setLoading(true);
      try {
        const data = await apiFetch(`/movies/${id}`);
        setMovie(data);
        setIsFavorite(data.isFavorite || false);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    loadMovie();
  }, [id]);

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

  const handleFavoriteToggle = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const res = await apiFetch(`/social/favorites/${movie.id}/toggle`, { method: 'POST' });
      setIsFavorite(res.isFavorite);
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-xl font-bold text-white mb-2">Kino topilmadi</h2>
        <Link to="/movies" className="text-sm text-red-500 hover:underline">
          Kinolar katalogiga qaytish →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      
      {/* Big Backdrop Banner */}
      <div className="relative w-full h-[55vh] min-h-[400px] max-h-[580px] bg-black overflow-hidden">
        <img
          src={movie.backdrop}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-[0.5] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
      </div>

      {/* Main Movie Info Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Poster Card */}
          <div className="w-48 sm:w-64 md:w-72 flex-shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-2xl bg-zinc-900">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-md shadow-md">
                {movie.quality}
              </div>
            </div>

            {/* Quick Watch Progress indicator if user started earlier */}
            {movie.watchProgress > 0 && (
              <div className="mt-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300">
                <p className="font-semibold text-amber-400 mb-1">Qoldirilgan joy:</p>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-600 h-full w-2/5" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Ko‘rishni davom ettirishingiz mumkin
                </p>
              </div>
            )}
          </div>

          {/* Details & Action Buttons */}
          <div className="flex-1 space-y-5">
            
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 font-bold text-zinc-300">
                {movie.ageLimit}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 font-bold text-amber-400">
                ★ {movie.rating ? Number(movie.rating).toFixed(1) : '5.0'} ({movie.ratingCount} baho)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-red-950 border border-red-800/80 font-semibold text-red-300">
                {movie.category}
              </span>
              <span className="flex items-center gap-1 text-zinc-400 text-xs ml-auto">
                <Eye className="w-3.5 h-3.5" />
                <span>{movie.viewsCount || 0} marta ko‘rilgan</span>
              </span>
            </div>

            {/* Title & Original Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="text-sm font-medium text-zinc-400 mt-1">
                  Asl nomi: <em>{movie.originalTitle}</em>
                </p>
              )}
            </div>

            {/* Meta Items */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <strong>Yil:</strong> {movie.year}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-500" />
                <strong>Davomiyligi:</strong> {movie.duration}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Film className="w-4 h-4 text-zinc-500" />
                <strong>Til:</strong> {movie.language}
              </span>
            </div>

            {/* Synopsis */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Kino tavsifi
              </h3>
              <p className="text-sm text-zinc-200 leading-relaxed">
                {movie.description}
              </p>
            </div>

            {/* Crew info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-3.5">
              <div>
                <span className="text-zinc-500 block font-semibold mb-0.5">Rejissyor:</span>
                <span className="text-zinc-200 font-bold">{movie.director || 'Noma’lum'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-semibold mb-0.5">Janr:</span>
                <span className="text-amber-400 font-bold">{movie.genre}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-zinc-500 block font-semibold mb-0.5">Bosh rollarda:</span>
                <span className="text-zinc-200 leading-normal">{movie.actors || 'Turli aktyorlar'}</span>
              </div>
            </div>

            {/* ACTION BUTTONS: Watch in Room, Invite Friends, Favorite, Trailer */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              
              {/* Primary Action: Virtual Cinema Room */}
              <button
                onClick={handleStartRoom}
                className="flex items-center gap-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black px-6 py-3.5 rounded-xl shadow-xl shadow-red-950/50 transition-all hover:scale-102 active:scale-98 text-sm"
              >
                <Users className="w-5 h-5" />
                <span>Kinoni Ko‘rish (Virtual Zal)</span>
              </button>

              {/* Do'stlar bilan ko'rish */}
              <button
                onClick={handleStartRoom}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-4 py-3.5 rounded-xl border border-zinc-700 transition-all text-sm"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Do‘stlar bilan ko‘rish</span>
              </button>

              {/* Sevimlilar Toggle */}
              <button
                onClick={handleFavoriteToggle}
                className={`p-3.5 rounded-xl border transition-all ${
                  isFavorite
                    ? 'bg-red-950/80 border-red-700 text-red-400 shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title={isFavorite ? 'Sevimlilardan o‘chirish' : 'Sevimlilarga qo‘shish'}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              {/* Treyler */}
              {movie.trailerUrl && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-4 py-3.5 rounded-xl text-sm font-semibold transition-all"
                >
                  <Play className="w-4 h-4 text-red-500" />
                  <span>Treyler</span>
                </button>
              )}
            </div>

            {/* Interactive Rating Widget */}
            <div className="pt-2">
              <RatingStars
                movieId={movie.id}
                initialRating={movie.rating}
                initialCount={movie.ratingCount}
                userInitialRating={movie.userRating}
                onRatingUpdated={(newR, newC) => {
                  setMovie(prev => ({ ...prev, rating: newR, ratingCount: newC }));
                }}
              />
            </div>

          </div>
        </div>

        {/* Similar Movies Section */}
        {movie.similar && movie.similar.length > 0 && (
          <section className="mt-14 space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-5 bg-red-600 rounded-full inline-block" />
              <span>O‘xshash va tavsiya etilgan filmlar</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
              {movie.similar.map(s => (
                <MovieCard key={s.id} movie={s} />
              ))}
            </div>
          </section>
        )}

        {/* Comments & Reviews Section */}
        <section className="mt-14">
          <CommentsSection movieId={movie.id} />
        </section>

      </div>

      {/* Trailer Modal */}
      {isTrailerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-red-500" />
                <span>{movie.title} — Rasmiy Treyler</span>
              </h3>
              <button
                onClick={() => setIsTrailerOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <video
                src={movie.trailerUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

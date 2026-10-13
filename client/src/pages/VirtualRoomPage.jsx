import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import VirtualCinemaRoom from '../components/room/VirtualCinemaRoom';
import { AlertCircle, Film, ArrowLeft, Users, Shield } from 'lucide-react';

export default function VirtualRoomPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRoom() {
      setLoading(true);
      try {
        const data = await apiFetch(`/rooms/${id}`);
        setRoom(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadRoom();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">
            Virtual kino zali yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Xona ochilmadi</h2>
          <p className="text-xs text-zinc-400 mb-4">{error || 'Kino xonasi mavjud emas yoki yopilgan.'}</p>
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Katalogga qaytish</span>
          </Link>
        </div>
      </div>
    );
  }

  const movieData = {
    id: room.movieId,
    title: room.movieTitle,
    poster: room.moviePoster,
    backdrop: room.movieBackdrop,
    videoUrl: room.videoUrl,
    duration: room.duration
  };

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to={`/movie/${room.movieId}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kino sahifasiga qaytish</span>
          </Link>
          <div className="text-xs text-zinc-500 font-mono">
            Xona kodi: <strong className="text-amber-400">{room.id}</strong>
          </div>
        </div>

        {/* Central Virtual Cinema Room Component */}
        <VirtualCinemaRoom room={room} movie={movieData} />

        {/* Room Info & Details Footer */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={room.moviePoster}
              alt={room.movieTitle}
              className="w-14 h-20 object-cover rounded-xl border border-zinc-800 shadow-md"
            />
            <div>
              <h3 className="text-base font-bold text-white">{room.movieTitle}</h3>
              <p className="text-xs text-zinc-400 line-clamp-1">{room.movieDescription}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400">
                <span>{room.duration}</span>
                <span>•</span>
                <span className="text-amber-400">{room.quality}</span>
                <span>•</span>
                <span>Boshlovchi: <strong className="text-white">{room.hostName}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sinxron audio va video yoqilgan</span>
          </div>
        </div>

      </div>
    </div>
  );
}

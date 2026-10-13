import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Clock, Play, Trash2, Film, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function WatchHistoryPage() {
  const { user, setIsAuthModalOpen } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/social/history');
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async (movieId) => {
    try {
      const res = await apiFetch('/rooms/create', {
        method: 'POST',
        body: { movieId }
      });
      navigate(`/room/${res.roomId}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteItem = async (movieId) => {
    try {
      await apiFetch(`/social/history/${movieId}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(h => h.movieId !== movieId));
      showToast('Tarixdan o‘chirildi.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 max-w-md space-y-4">
          <Clock className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Ko‘rish Tarixi</h2>
          <p className="text-xs text-zinc-400">
            Tarixni ko‘rish va to‘xtatilgan joydan davom ettirish uchun avval tizimga kiring.
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Clock className="w-7 h-7 text-amber-500" />
              <span>Ko‘rish Tarixi</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Oldin tomosha qilingan filmlar va to‘xtatilgan vaqtlari
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-400">Tarix yuklanmoqda...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="py-24 text-center bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
            <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Ko‘rish tarixi bo‘sh</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              Siz tomosha qilgan barcha filmlar bu yerda saqlanadi va qolgan joyidan davom ettiriladi.
            </p>
            <Link
              to="/movies"
              className="inline-block bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all"
            >
              Kino tanlash va ko‘rish
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-16 h-22 object-cover rounded-xl flex-shrink-0 shadow-md"
                  />
                  <div>
                    <Link
                      to={`/movie/${item.movieId}`}
                      className="text-base font-bold text-white hover:text-red-400 transition-colors"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {item.genre} • {item.year}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      <span className="font-mono text-amber-400 font-semibold">
                        To‘xtatilgan joy: {formatSeconds(item.progressSeconds)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleResume(item.movieId)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Davom ettirish</span>
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.movieId)}
                    title="Tarixdan o‘chirish"
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

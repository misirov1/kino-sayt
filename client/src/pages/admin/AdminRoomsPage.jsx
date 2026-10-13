import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { Tv, Users, Trash2, Play, ExternalLink, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/rooms');
      setRooms(data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRoom = async (room) => {
    if (!window.confirm(`Haqiqatan ham "${room.title}" xonasini majburiy yopmoqchimisiz? Barcha ishtirokchilar uziladi.`)) return;

    try {
      await apiFetch(`/admin/rooms/${room.id}`, { method: 'DELETE' });
      showToast('Kino xonasi majburiy yopildi!', 'success');
      setRooms(prev => prev.filter(r => r.id !== room.id));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-red-500" />
            <span>Aktiv Virtual Kino Xonalari ({rooms.length})</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Foydalanuvchilar hozirda tomosha qilayotgan 4 kishilik zallarni nazorat qilish
          </p>
        </div>

        <button
          onClick={loadRooms}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-xl transition-colors self-start sm:self-auto"
        >
          Yangilash
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-zinc-400">Xonalar yuklanmoqda...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="py-20 text-center bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <Tv className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Hozirda aktiv xonalar mavjud emas</h3>
          <p className="text-xs text-zinc-400">
            Foydalanuvchilar yangi virtual xona yaratganda ular shu yerda ko‘rinadi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div
              key={room.id}
              className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-4 shadow-lg hover:border-zinc-700 transition-all"
            >
              <div className="flex gap-3.5">
                <img
                  src={room.moviePoster}
                  alt={room.movieTitle}
                  className="w-16 h-24 object-cover rounded-xl shadow-md flex-shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950 text-red-400 border border-red-800">
                      {room.membersCount || 1}/4 Divanda
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {room.id}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">{room.movieTitle}</h3>
                  <p className="text-xs text-zinc-400 truncate">
                    Boshlovchi: <strong className="text-zinc-200">{room.hostName}</strong>
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Yaratilgan: {new Date(room.createdAt).toLocaleTimeString('uz-UZ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <Link
                  to={`/room/${room.id}`}
                  className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Xonaga kirish</span>
                </Link>

                <button
                  onClick={() => handleCloseRoom(room)}
                  className="flex items-center gap-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xonani Yopish</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

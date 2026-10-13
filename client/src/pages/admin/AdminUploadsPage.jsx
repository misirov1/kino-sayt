import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { Upload, CheckCircle2, XCircle, Clock, Film, ExternalLink } from 'lucide-react';

export default function AdminUploadsPage() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/movies?status=pending');
      setUploads(data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await apiFetch(`/admin/movies/${id}/approve`, { method: 'PUT' });
      showToast('Kino tasdiqlandi va katalogga chiqdi!', 'success');
      loadUploads();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Ushbu yuklamani rad etib, butunlay o‘chirmoqchimisiz?')) return;
    try {
      await apiFetch(`/admin/movies/${id}`, { method: 'DELETE' });
      showToast('Yuklama rad etildi va o‘chirildi.', 'success');
      loadUploads();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-amber-500" />
          <span>Foydalanuvchilar Yuklagan Kinolar Tekshiruvi ({uploads.length})</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Foydalanuvchilar tomonidan joylangan kinolarni ko‘rib chiqish, tasdiqlash yoki rad etish
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-zinc-400">Tekshirilmoqda...</p>
        </div>
      ) : uploads.length === 0 ? (
        <div className="py-20 text-center bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Barcha yuklamalar ko‘rib chiqilgan</h3>
          <p className="text-xs text-zinc-400">
            Hozirda tasdiqlash uchun navbatda kutayotgan kino yo‘q.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uploads.map(m => (
            <div
              key={m.id}
              className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-4"
            >
              <div className="flex gap-4">
                <img
                  src={m.poster}
                  alt={m.title}
                  className="w-20 h-28 object-cover rounded-xl shadow-md flex-shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-base font-bold text-white">{m.title}</h3>
                  <p className="text-xs text-zinc-400">{m.genre} • {m.year}</p>
                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                  <div className="pt-1 text-[11px] text-zinc-400 flex flex-wrap gap-2">
                    <span>Yuklagan: <strong className="text-white">{m.uploaderName}</strong></span>
                    <span>•</span>
                    <span className="text-amber-400 font-mono">
                      ⏳ O‘chish sanasi: {m.expiresAt ? new Date(m.expiresAt).toLocaleDateString('uz-UZ') : 'Doimiy'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <a
                  href={m.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline font-semibold"
                >
                  <span>Videoni tekshirish</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(m.id)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tasdiqlash</span>
                  </button>
                  <button
                    onClick={() => handleReject(m.id)}
                    className="flex items-center gap-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold px-3 py-2 rounded-xl text-xs transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Rad etish</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

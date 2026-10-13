import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiFetch } from '../utils/api';
import { 
  Upload, Film, Clock, ShieldCheck, AlertCircle, 
  CheckCircle2, FolderUp, Lock, Trash2, Play 
} from 'lucide-react';

export default function UploadMoviePage() {
  const navigate = useNavigate();
  const { user, isAdmin, setIsAuthModalOpen } = useAuth();
  const { showToast } = useNotification();

  const [formData, setFormData] = useState({
    title: '',
    originalTitle: '',
    description: '',
    poster: '',
    backdrop: '',
    videoUrl: '',
    trailerUrl: '',
    genre: 'Drama, Jangari',
    category: 'Yangi kinolar',
    year: '2024',
    duration: '1 soat 45 daqiqa',
    language: 'O‘zbekcha',
    actors: '',
    director: '',
    quality: '1080p Full HD',
    expireDays: '7'
  });

  const [myUploads, setMyUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const videoFileInputRef = useRef(null);
  const posterFileInputRef = useRef(null);

  const handleVideoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedVideoFile(file);
    if (!formData.title) {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setFormData(prev => ({ ...prev, title: cleanTitle }));
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      const uploadData = new FormData();
      uploadData.append('video', file);

      const token = localStorage.getItem('kinoverse_token');
      const adminPin = localStorage.getItem('kinoverse_admin_pin');
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(adminPin ? { 'x-admin-pin': adminPin } : {})
      };

      setUploadProgress(60);
      const res = await fetch('/api/upload/file', {
        method: 'POST',
        headers,
        body: uploadData
      });
      const data = await res.json();
      setUploadProgress(100);

      if (data.success && data.url) {
        setFormData(prev => ({ ...prev, videoUrl: data.url }));
        showToast(`"${file.name}" kompyuter yoki telefoningizdan yuklandi!`, 'success');
      } else {
        throw new Error(data.error || 'Yuklashda xatolik yuz berdi');
      }
    } catch (err) {
      showToast(err.message || 'Faylni yuklashda xatolik', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePosterFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const token = localStorage.getItem('kinoverse_token');
      const adminPin = localStorage.getItem('kinoverse_admin_pin');
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(adminPin ? { 'x-admin-pin': adminPin } : {})
      };

      const res = await fetch('/api/upload/file', {
        method: 'POST',
        headers,
        body: uploadData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setFormData(prev => ({ ...prev, poster: data.url }));
        showToast('Poster muvaffaqiyatli saqlandi!', 'success');
      }
    } catch (err) {
      showToast('Poster yuklashda xatolik', 'error');
    }
  };

  useEffect(() => {
    if (user) {
      loadMyUploads();
    }
  }, [user]);

  const loadMyUploads = async () => {
    try {
      const data = await apiFetch('/upload/my-uploads');
      setMyUploads(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!formData.title || !formData.videoUrl || !formData.description) {
      showToast('Kino nomi, video havolasi va tavsif to‘ldirilishi shart.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/upload', {
        method: 'POST',
        body: formData
      });
      showToast(res.message, 'success');
      loadMyUploads();
      // Reset some inputs
      setFormData(prev => ({
        ...prev,
        title: '',
        originalTitle: '',
        description: '',
        poster: '',
        videoUrl: ''
      }));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchMovie = async (movieId) => {
    try {
      const res = await apiFetch('/rooms/create', {
        method: 'POST',
        body: { movieId }
      });
      navigate(`/room/${res.roomId}`);
    } catch (err) {
      showToast(err.message || 'Xonaga kirishda xatolik yuz berdi', 'error');
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (!window.confirm('Rostdan ham ushbu kinoni o‘chirmoqchimisiz? Serverdagi video fayl ham to‘liq o‘chiriladi.')) return;
    try {
      const res = await apiFetch(`/upload/my-uploads/${movieId}`, {
        method: 'DELETE'
      });
      showToast(res.message || 'Kino muvaffaqiyatli o‘chirildi', 'success');
      loadMyUploads();
    } catch (err) {
      showToast(err.message || 'O‘chirishda xatolik yuz berdi', 'error');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 max-w-md space-y-4">
          <Upload className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Kino yuklash</h2>
          <p className="text-xs text-zinc-400">
            Platformaga kino yuklash uchun avval tizimga kiring.
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Upload className="w-7 h-7 text-red-500" />
            <span>Kino Yuklash Markazi</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Sevimli kinolaringizni yuklang va virtual xonada do‘stlaringiz bilan tomosha qiling.
          </p>
        </div>

        {/* Security & Expiration Notice Banner */}
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <p className="font-bold text-amber-300 mb-0.5">Xavfsizlik va avtomatik tozalash tizimi:</p>
            Oddiy foydalanuvchilar tomonidan yuklangan kinolar moderatorlar tomonidan tasdiqlanadi. 
            Vaqtinchalik xona kinolari saqlash muddatidan ({formData.expireDays} kun) so‘ng serverdan 
            avtomatik ravishda xavfsiz tozalab tashlanadi. Admin kinolari doimiy saqlanadi.
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-red-500" />
            <span>Kino ma’lumotlari</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Title */}
            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-semibold">Kino nomi *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Masalan: Mahalla 2"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Original title */}
            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-semibold">Asl nomi (inglizcha / original)</label>
              <input
                type="text"
                name="originalTitle"
                value={formData.originalTitle}
                onChange={handleChange}
                placeholder="Masalan: The Neighborhood"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>


            {/* Video File from PC / Phone */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-300 block font-semibold flex items-center justify-between">
                <span>🎬 Video fayl (Kompyuter yoki telefoningizdan) *</span>
                {isUploading && (
                  <span className="text-amber-400 text-[11px] font-bold">
                    {uploadProgress}% yuklanmoqda...
                  </span>
                )}
              </label>

              <div
                onClick={() => !isUploading && videoFileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-red-500/50 hover:border-red-400 bg-red-950/20 hover:bg-red-950/30 p-5 rounded-2xl flex flex-col items-center justify-center text-center transition-all group"
              >
                <input
                  type="file"
                  ref={videoFileInputRef}
                  accept="video/mp4,video/webm,video/ogg,video/mkv,video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <FolderUp className="w-6 h-6" />
                </div>
                {formData.videoUrl ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{selectedVideoFile?.name || 'Video fayl saqlandi'}</span>
                    </p>
                    <p className="text-xs text-emerald-400 font-medium">
                      ✓ Qurilmadan yuklandi: {formData.videoUrl} (Almashtirish uchun bosing)
                    </p>
                  </div>
                ) : isUploading ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-amber-400">Video yuklanmoqda... {uploadProgress}%</p>
                    <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden mx-auto">
                      <div className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-white mb-1">
                      📁 Kompyuter yoki telefoningizdagi video faylni tanlang
                    </p>
                    <p className="text-xs text-zinc-400">
                      Barcha formatlar (.mp4, .mkv, .webm, .mov) qabul qilinadi. Havola kiritish shart emas!
                    </p>
                  </div>
                )}
              </div>

              {/* Qo'shimcha ixtiyoriy havola */}
              <div className="pt-1">
                <input
                  type="text"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  placeholder="Yoki to‘g‘ridan-to‘g‘ri video fayl manzili (ixtiyoriy)"
                  className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Genre */}
            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-semibold">Janr *</label>
              <input
                type="text"
                name="genre"
                required
                value={formData.genre}
                onChange={handleChange}
                placeholder="Masalan: Komediya, Oilaviy"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-semibold">Kategoriya</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="Yangi kinolar">Yangi kinolar</option>
                <option value="O‘zbek kinolari">O‘zbek kinolari</option>
                <option value="O‘zbek tilidagi kinolar">O‘zbek tilidagi kinolar</option>
                <option value="Mashhur kinolar">Mashhur kinolar</option>
                <option value="Multfilm">Multfilm</option>
                <option value="Seriallar">Seriallar</option>
              </select>
            </div>

            {/* Year & Duration */}
            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-semibold">Yil</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-semibold">Davomiyligi</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="1 soat 35 daqiqa"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Language & Quality */}
            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-semibold">Til</label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                placeholder="O‘zbekcha (Dublyaj)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-semibold">Sifat</label>
              <select
                name="quality"
                value={formData.quality}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="4K Ultra HD">4K Ultra HD</option>
                <option value="1080p Full HD">1080p Full HD</option>
                <option value="720p HD">720p HD</option>
              </select>
            </div>

            {/* Expiration selection (if not admin) */}
            {!isAdmin && (
              <div>
                <label className="text-xs text-zinc-400 block mb-1 font-semibold">
                  Saqlash muddati (Avto-o‘chirish)
                </label>
                <select
                  name="expireDays"
                  value={formData.expireDays}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-amber-400 font-semibold focus:outline-none focus:border-red-500"
                >
                  <option value="3">3 kun</option>
                  <option value="7">7 kun (Tavsiya)</option>
                  <option value="14">14 kun</option>
                  <option value="30">30 kun</option>
                </select>
              </div>
            )}

            {/* Actors */}
            <div className={!isAdmin ? '' : 'sm:col-span-2'}>
              <label className="text-xs text-zinc-400 block mb-1 font-semibold">Aktyorlar</label>
              <input
                type="text"
                name="actors"
                value={formData.actors}
                onChange={handleChange}
                placeholder="Aktyor 1, Aktyor 2..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-400 block mb-1 font-semibold">Qisqacha tavsif *</label>
              <textarea
                name="description"
                rows="3"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Kino sujeti haqida qisqacha ma’lumot..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all text-sm disabled:opacity-50"
            >
              {loading ? 'Yuklanmoqda...' : 'Kinoni saqlash va yuklash'}
            </button>
          </div>
        </form>

        {/* My Uploaded Movies List */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-500" />
            <span>Mening yuklagan kinolarim ({myUploads.length})</span>
          </h3>

          {myUploads.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
              Siz hali hech qanday kino yuklamagansiz.
            </div>
          ) : (
            <div className="space-y-3">
              {myUploads.map(m => (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl gap-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={m.poster}
                      alt={m.title}
                      className="w-14 h-20 object-cover rounded-xl border border-zinc-800 flex-shrink-0 shadow-md"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{m.title}</h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-800/80">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Faqat sizga ko‘rinadi</span>
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{m.genre} • {m.year} • {m.duration}</p>
                      <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                        <span>Kino ko‘rib bo‘lingach avtomatik o‘chib ketadi</span>
                      </p>
                      {m.expiresAt && (
                        <p className="text-[10px] text-zinc-500">
                          ⏳ Maksimal saqlash: {new Date(m.expiresAt).toLocaleDateString('uz-UZ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleWatchMovie(m.id)}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Tomosha qilish</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMovie(m.id)}
                      title="Kinoni hoziroq o‘chirish"
                      className="p-2 bg-zinc-800 hover:bg-red-950/80 hover:text-red-400 text-zinc-400 rounded-xl border border-zinc-700/60 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

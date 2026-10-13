import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiFetch } from '../utils/api';
import { Link } from 'react-router-dom';
import { 
  User, Mail, AtSign, Shield, Heart, Clock, 
  Upload, Users, Edit3, Save, Camera, Film 
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, setIsAuthModalOpen } = useAuth();
  const { showToast } = useNotification();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 max-w-md space-y-4">
          <User className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Mening Profilim</h2>
          <p className="text-xs text-zinc-400">
            Profil ma’lumotlarini ko‘rish va o‘zgartirish uchun avval tizimga kiring.
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

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ name, avatar });
      setIsEditing(false);
      showToast('Profil ma’lumotlari muvaffaqiyatli saqlandi!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80'
  ];

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Profile Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Avatar & Selector */}
            <div className="relative group">
              <img
                src={avatar || user.avatar}
                alt={user.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-red-600/40 shadow-2xl"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* User Meta */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{user.name}</h1>
                  <p className="text-xs text-zinc-400 mt-0.5">@{user.username}</p>
                </div>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1.5 self-center sm:self-start bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Bekor qilish' : 'Profilni tahrirlash'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  {user.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <strong className="text-amber-400 uppercase font-mono text-[11px]">{user.role}</strong>
                </span>
                <span>•</span>
                <span className="text-[11px] font-mono text-zinc-500">ID: {user.id}</span>
              </div>
            </div>

          </div>

          {/* Edit Form Drawer */}
          {isEditing && (
            <form onSubmit={handleSave} className="mt-6 pt-6 border-t border-zinc-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1 font-semibold">To‘liq ism</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1 font-semibold">Avatar rasm URL</label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Quick Preset Avatars */}
              <div>
                <label className="text-xs text-zinc-400 block mb-2 font-semibold">
                  Yoki tayyor avatarlardan tanlang:
                </label>
                <div className="flex items-center gap-3">
                  {sampleAvatars.map((avUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatar(avUrl)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 ${
                        avatar === avUrl ? 'border-red-500 ring-2 ring-red-500/50' : 'border-zinc-700'
                      }`}
                    >
                      <img src={avUrl} alt="Preset avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{loading ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/favorites"
            className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-red-500/50 transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-red-600/10 text-red-500 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <p className="text-2xl font-black text-white">{user.stats?.favorites || 0}</p>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">Sevimli kinolar</p>
          </Link>

          <Link
            to="/history"
            className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-white">{user.stats?.history || 0}</p>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">Ko‘rish tarixi</p>
          </Link>

          <Link
            to="/friends"
            className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-white">{user.stats?.friends || 0}</p>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">Do‘stlar</p>
          </Link>

          <Link
            to="/upload"
            className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-white">{user.stats?.uploads || 0}</p>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">Yuklangan kinolar</p>
          </Link>
        </div>

      </div>
    </div>
  );
}

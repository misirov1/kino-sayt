import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { 
  LayoutDashboard, Film, Users, Upload, Shield, 
  Lock, KeyRound, LogOut, Tv, Sparkles, Check, ArrowLeft 
} from 'lucide-react';

export default function AdminLayout() {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    return localStorage.getItem('kinoverse_admin_pin') === '1234';
  });
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleVerifyPin = async (e) => {
    if (e) e.preventDefault();
    if (!pin) {
      setError('Kodni kiriting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/admin/verify-pin', {
        method: 'POST',
        body: { pin: pin.trim() }
      });

      localStorage.setItem('kinoverse_admin_pin', '1234');
      if (res.token) {
        localStorage.setItem('kinoverse_token', res.token);
      }
      setIsAdminUnlocked(true);
      showToast('Admin paneli muvaffaqiyatli ochildi! Xush kelibsiz.', 'success');
    } catch (err) {
      setError('Noto‘g‘ri kod! Admin kodi: 1234');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleLockAdmin = () => {
    localStorage.removeItem('kinoverse_admin_pin');
    setIsAdminUnlocked(false);
    setPin('');
    showToast('Admin panelidan chiqildi.', 'info');
  };

  const handleKeypadPress = (val) => {
    if (val === 'C') {
      setPin('');
      setError('');
    } else {
      if (pin.length < 4) {
        const next = pin + val;
        setPin(next);
        setError('');
        if (next === '1234') {
          // Auto submit when 1234 is typed
          setTimeout(() => {
            localStorage.setItem('kinoverse_admin_pin', '1234');
            setIsAdminUnlocked(true);
            showToast('Admin paneli ochildi! Xush kelibsiz.', 'success');
          }, 200);
        }
      }
    }
  };

  // If not unlocked with PIN 1234, render the Security Gate Screen
  if (!isAdminUnlocked) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

          {/* Padlock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-red-950/50">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Admin Paneli
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Admin paneliga kirish uchun maxfiy kodni kiriting
            </p>
          </div>

          {/* Quick PIN Code Hint Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Admin kodi: 1234</span>
          </div>

          {/* PIN Input & Visual Dots */}
          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div className="flex justify-center gap-3 my-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-11 h-12 rounded-xl flex items-center justify-center text-xl font-bold font-mono transition-all ${
                    pin[idx]
                      ? 'bg-red-600/20 border-2 border-red-500 text-white shadow-lg shadow-red-900/30'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-600'
                  }`}
                >
                  {pin[idx] ? '●' : ''}
                </div>
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-400 font-semibold animate-shake">
                {error}
              </p>
            )}

            {/* Interactive Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  className="h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-base font-bold transition-all active:scale-95 border border-zinc-800/80"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('C')}
                className="h-12 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 text-xs font-bold transition-all active:scale-95"
              >
                Tozalash
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-base font-bold transition-all active:scale-95 border border-zinc-800/80"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('1234')}
                className="h-12 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-1"
                title="1-bosishda 1234 kiritish"
              >
                <span>1234</span>
                <Sparkles className="w-3 h-3" />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || pin.length === 0}
              className="w-full mt-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-900/30 text-xs disabled:opacity-50"
            >
              {loading ? 'Tekshirilmoqda...' : 'Kirish'}
            </button>
          </form>

          <div>
            <Link to="/" className="text-xs text-zinc-500 hover:text-white inline-flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Bosh sahifaga qaytish</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const links = [
    { to: '/admin', label: 'Boshqaruv Paneli', icon: LayoutDashboard, end: true },
    { to: '/admin/movies', label: 'Kinolar Boshqaruvi', icon: Film },
    { to: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
    { to: '/admin/rooms', label: 'Aktiv Xonalar', icon: Tv },
    { to: '/admin/uploads', label: 'Tasdiqlash Kutilmoqda', icon: Upload }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Admin Header with Security Status & Lock Out button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600/20 text-red-500 rounded-2xl border border-red-600/30">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Admin Boshqaruv Markazi
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Kod: 1234 Faol
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Kino joylash, o‘chirish, foydalanuvchilar va virtual xonalar nazorati
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Logout Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 scrollbar-none">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-red-600 text-white shadow-md'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <button
              onClick={handleLockAdmin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors"
              title="Admin seansidan chiqish"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>

        {/* Child Views */}
        <Outlet />

      </div>
    </div>
  );
}

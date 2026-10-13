import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { apiFetch } from '../../utils/api';
import { 
  Film, Search, Sun, Moon, Bell, User, Heart, Clock, 
  Upload, Shield, LogOut, Menu, X, Star, Users 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isModerator, setIsAuthModalOpen } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount, setUnreadCount } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch(`/movies?search=${encodeURIComponent(searchQuery)}&limit=5`);
        setSearchResults(data.movies || []);
        setIsSearchOpen(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiFetch('/social/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleNotifDropdown = () => {
    if (!isNotifOpen) {
      loadNotifications();
    }
    setIsNotifOpen(!isNotifOpen);
    setIsUserMenuOpen(false);
  };

  const markAllNotifsRead = async () => {
    try {
      await apiFetch('/social/notifications/read-all', { method: 'PUT' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-zinc-950/85 border-b border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white flex items-center">
              KINO<span className="text-red-500">VERSE</span>
            </span>
            <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase -mt-1">
              Virtual Zal
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium text-zinc-300">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg hover:text-white transition-colors ${
              location.pathname === '/' ? 'text-red-500 font-semibold' : ''
            }`}
          >
            Bosh sahifa
          </Link>
          <Link
            to="/movies"
            className={`px-3 py-1.5 rounded-lg hover:text-white transition-colors ${
              location.pathname === '/movies' && !location.search ? 'text-red-500 font-semibold' : ''
            }`}
          >
            Kinolar
          </Link>
          <Link
            to="/movies?sort=popular"
            className={`px-3 py-1.5 rounded-lg hover:text-white transition-colors ${
              location.search.includes('popular') ? 'text-red-500 font-semibold' : ''
            }`}
          >
            Mashhur
          </Link>
          <Link
            to="/movies?sort=newest"
            className={`px-3 py-1.5 rounded-lg hover:text-white transition-colors ${
              location.search.includes('newest') ? 'text-red-500 font-semibold' : ''
            }`}
          >
            Yangi
          </Link>
          {user && (
            <>
              <Link
                to="/favorites"
                className={`px-3 py-1.5 rounded-lg hover:text-white transition-colors ${
                  location.pathname === '/favorites' ? 'text-red-500 font-semibold' : ''
                }`}
              >
                Sevimlilar
              </Link>
              <Link
                to="/friends"
                className={`px-3 py-1.5 rounded-lg hover:text-white transition-colors ${
                  location.pathname === '/friends' ? 'text-red-500 font-semibold' : ''
                }`}
              >
                Do‘stlar
              </Link>
            </>
          )}
          <Link
            to="/admin"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              location.pathname.startsWith('/admin')
                ? 'bg-red-600 text-white shadow-md'
                : 'text-amber-400 hover:text-amber-300 hover:bg-zinc-900 border border-amber-500/30'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Panel</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-xs md:max-w-sm hidden sm:block">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setIsSearchOpen(true)}
                placeholder="Kino, aktyor, janr qidirish..."
                className="w-full bg-zinc-900/90 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm rounded-full pl-9 pr-4 py-2 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1">
              {searchResults.map((m) => (
                <Link
                  key={m.id}
                  to={`/movie/${m.id}`}
                  onClick={() => setIsSearchOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800/80 transition-colors"
                >
                  <img
                    src={m.poster}
                    alt={m.title}
                    className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{m.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{m.genre}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                      <span>{m.year}</span>
                      <span>•</span>
                      <span className="flex items-center text-amber-400 font-medium">
                        <Star className="w-3 h-3 fill-amber-400 mr-0.5" /> {m.rating}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              <Link
                to={`/movies?search=${encodeURIComponent(searchQuery)}`}
                onClick={() => setIsSearchOpen(false)}
                className="block text-center text-xs font-semibold text-red-400 hover:text-red-300 py-2 border-t border-zinc-800 mt-1"
              >
                Barcha natijalarni ko‘rish →
              </Link>
            </div>
          )}
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2">
          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Kunduzgi rejim' : 'Tungi rejim'}
            className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 rounded-xl transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications Dropdown (if logged in) */}
          {user && (
            <div ref={notifRef} className="relative">
              <button
                onClick={toggleNotifDropdown}
                className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors"
                title="Bildirishnomalar"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Bildirishnomalar
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotifsRead}
                        className="text-[11px] text-red-400 hover:underline"
                      >
                        Barchasini o‘qilgan qilish
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/50">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-center text-zinc-500">
                        Yangi bildirishnomalar mavjud emas.
                      </p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs hover:bg-zinc-800/60 transition-colors ${
                            !n.isRead ? 'bg-red-950/20' : ''
                          }`}
                        >
                          <p className="font-semibold text-zinc-200">{n.title}</p>
                          <p className="text-zinc-400 mt-0.5 leading-snug">{n.message}</p>
                          {n.link && (
                            <Link
                              to={n.link}
                              onClick={() => setIsNotifOpen(false)}
                              className="inline-block mt-2 font-bold text-red-400 hover:underline text-[11px]"
                            >
                              O‘tish →
                            </Link>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile or Login Button */}
          {user ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-2 p-1 pl-2 bg-zinc-900 border border-zinc-800 rounded-full hover:border-zinc-700 transition-colors"
              >
                <span className="text-xs font-semibold text-zinc-200 hidden md:inline max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-red-500/50"
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-zinc-800">
                    <p className="font-bold text-white truncate">{user.name}</p>
                    <p className="text-zinc-400 truncate">@{user.username}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-red-950 text-red-300 border border-red-800">
                      {user.role}
                    </span>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4 text-red-400" />
                    <span>Mening profilim</span>
                  </Link>

                  <Link
                    to="/favorites"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  >
                    <Heart className="w-4 h-4 text-red-400" />
                    <span>Sevimlilar</span>
                  </Link>

                  <Link
                    to="/history"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  >
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Ko‘rish tarixi</span>
                  </Link>

                  <Link
                    to="/friends"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  >
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Do‘stlarim</span>
                  </Link>

                  <Link
                    to="/upload"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Kino yuklash</span>
                  </Link>

                  {isModerator && (
                    <Link
                      to="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-800 text-amber-300 font-semibold border-t border-zinc-800 mt-1 transition-colors"
                    >
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>Admin Panel</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-800 text-red-400 border-t border-zinc-800 mt-1 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Chiqish</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg shadow-red-900/30 transition-all active:scale-95"
            >
              Kirish
            </button>
          )}

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-zinc-950 border-b border-zinc-800 px-4 pt-2 pb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="sm:hidden mb-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kino qidirish..."
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-xl pl-9 pr-4 py-2.5"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
          </form>

          <div className="flex flex-col gap-1 text-sm font-medium text-zinc-300">
            <Link to="/" className="px-3 py-2 rounded-lg hover:bg-zinc-900">Bosh sahifa</Link>
            <Link to="/movies" className="px-3 py-2 rounded-lg hover:bg-zinc-900">Kinolar katalogi</Link>
            <Link to="/movies?sort=popular" className="px-3 py-2 rounded-lg hover:bg-zinc-900">Mashhur kinolar</Link>
            <Link to="/movies?sort=newest" className="px-3 py-2 rounded-lg hover:bg-zinc-900">Yangi qo‘shilganlar</Link>
            {user && (
              <>
                <Link to="/favorites" className="px-3 py-2 rounded-lg hover:bg-zinc-900">Sevimlilar</Link>
                <Link to="/friends" className="px-3 py-2 rounded-lg hover:bg-zinc-900">Do‘stlar</Link>
                <Link to="/history" className="px-3 py-2 rounded-lg hover:bg-zinc-900">Ko‘rish tarixi</Link>
                <Link to="/upload" className="px-3 py-2 rounded-lg hover:bg-zinc-900 text-emerald-400">Kino yuklash</Link>
              </>
            )}
            <Link to="/admin" className="px-3 py-2 rounded-lg hover:bg-zinc-900 text-amber-400 font-bold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

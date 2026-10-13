import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MovieHero from '../components/movie/MovieHero';
import MovieCard from '../components/movie/MovieCard';
import { apiFetch } from '../utils/api';
import { Users, Sparkles, TrendingUp, Compass, Film, Flame, Play } from 'lucide-react';

export default function HomePage() {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [activeRooms, setActiveRooms] = useState([]);
  const [rails, setRails] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [feat, active, railsData] = await Promise.all([
          apiFetch('/movies/featured'),
          apiFetch('/rooms/active'),
          apiFetch('/movies/rails')
        ]);
        setFeaturedMovies(feat || []);
        setActiveRooms(active || []);
        setRails(railsData || {});
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const categories = [
    'Yangi kinolar',
    'Mashhur kinolar',
    'O‘zbek kinolari',
    'O‘zbek tilidagi kinolar',
    'Jangari',
    'Komediya',
    'Drama',
    'Fantastika',
    'Multfilm',
    'Seriallar'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">
            Kino platformasi yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      
      {/* Hero Banner Section */}
      <MovieHero movies={featuredMovies} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        
        {/* Quick Genre Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            to="/movies"
            className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-red-600 text-white shadow-md hover:bg-red-500 transition-colors"
          >
            Barchasi
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/movies?category=${encodeURIComponent(cat)}`}
              className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-all"
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* ACTIVE LIVE VIRTUAL ROOMS (Join ongoing rooms) */}
        {activeRooms.length > 0 && (
          <section className="bg-gradient-to-r from-red-950/40 via-zinc-900/80 to-amber-950/30 border border-red-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-600 text-white shadow-lg shadow-red-900/50">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>Aktiv Virtual Xonalar</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Hozirda foydalanuvchilar birga tomosha qilayotgan jonli zallar
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRooms.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/room/${r.id}`)}
                  className="group relative flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-red-600/60 hover:shadow-xl transition-all cursor-pointer"
                >
                  <img
                    src={r.moviePoster}
                    alt={r.movieTitle}
                    className="w-16 h-22 object-cover rounded-xl shadow-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950 text-red-400 border border-red-800 mb-1">
                      {r.currentMembersCount || 1}/4 Divanda
                    </span>
                    <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">
                      {r.movieTitle}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      Boshlovchi: {r.hostName}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Xonaga qo‘shilish →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categories Movie Rails */}
        {Object.entries(rails).map(([categoryName, movies]) => {
          if (!movies || movies.length === 0) return null;
          return (
            <section key={categoryName} className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-gradient-to-b from-red-600 to-amber-500 rounded-full inline-block" />
                  <span>{categoryName}</span>
                </h2>
                <Link
                  to={`/movies?category=${encodeURIComponent(categoryName)}`}
                  className="text-xs font-bold text-red-500 hover:text-red-400 hover:underline flex items-center gap-1"
                >
                  Barchasi ({movies.length}) →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
                {movies.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            </section>
          );
        })}

      </div>
    </div>
  );
}

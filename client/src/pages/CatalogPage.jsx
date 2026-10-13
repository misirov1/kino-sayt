import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../components/movie/MovieCard';
import { apiFetch } from '../utils/api';
import { Search, Filter, SlidersHorizontal, Film } from 'lucide-react';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter states
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const genre = searchParams.get('genre') || '';
  const year = searchParams.get('year') || '';
  const sort = searchParams.get('sort') || 'popular';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const categories = [
    'Barchasi',
    'Yangi kinolar',
    'Mashhur kinolar',
    'O‘zbek kinolari',
    'O‘zbek tilidagi kinolar',
    'Jangari',
    'Komediya',
    'Drama',
    'Fantastika',
    'Horror',
    'Multfilm',
    'Seriallar'
  ];

  const genres = [
    'Barchasi',
    'Jangari',
    'Komediya',
    'Drama',
    'Fantastika',
    'Sarguzasht',
    'Horror',
    'Triller',
    'Tarixiy',
    'Oilaviy',
    'Fentezi',
    'Seriallar'
  ];

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          search,
          category,
          genre: genre === 'Barchasi' ? '' : genre,
          year,
          sort,
          page: page.toString(),
          limit: '18'
        });

        const data = await apiFetch(`/movies?${queryParams.toString()}`);
        setMovies(data.movies || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, [search, category, genre, year, sort, page]);

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value && value !== 'Barchasi') {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Film className="w-7 h-7 text-red-600" />
              <span>Kinolar Katalogi</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Topilgan kinolar soni: <strong className="text-white">{total}</strong> ta
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Saralash:</span>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
            >
              <option value="popular">Eng mashhurlar</option>
              <option value="rating">Yuqori reyting</option>
              <option value="newest">Yangi qo‘shilganlar</option>
              <option value="views">Eng ko‘p ko‘rilgan</option>
            </select>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl">
          
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              defaultValue={search}
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateParam('search', e.target.value);
              }}
              onBlur={(e) => updateParam('search', e.target.value)}
              placeholder="Nom, aktyor, rejissyor..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={category || 'Barchasi'}
              onChange={(e) => updateParam('category', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
            >
              <option value="Barchasi">Kategoriya: Barchasi</option>
              {categories.slice(1).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Genre Dropdown */}
          <div>
            <select
              value={genre || 'Barchasi'}
              onChange={(e) => updateParam('genre', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
            >
              <option value="Barchasi">Janr: Barchasi</option>
              {genres.slice(1).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Year Dropdown */}
          <div>
            <select
              value={year || 'Barchasi'}
              onChange={(e) => updateParam('year', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
            >
              <option value="Barchasi">Yil: Barchasi</option>
              {[2026, 2025, 2024, 2023, 2022, 2020, 2015, 2010, 2000, 1991, 1960].map(y => (
                <option key={y} value={y}>{y}-yil</option>
              ))}
            </select>
          </div>

        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-400">Kinolar qidirilmoqda...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="py-24 text-center bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
            <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Mos keluvchi kino topilmadi</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              Boshqa so‘z yoki filtrlarni sinab ko‘ring yoki filtrlarni tozalang.
            </p>
            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Filtrlarni tozalash
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
            {movies.map(m => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

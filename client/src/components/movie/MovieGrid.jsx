import React from 'react';
import MovieCard from './MovieCard';

export default function MovieGrid({ movies = [], title, subtitle, emptyMessage = "Kinolar topilmadi." }) {
  if (!movies || movies.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-500">
        <p className="text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <section className="py-6">
      {(title || subtitle) && (
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-1">
          <div>
            {title && (
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-6 bg-red-600 rounded-full inline-block"></span>
                {title}
              </h2>
            )}
            {subtitle && <p className="text-xs sm:text-sm text-zinc-400 mt-1">{subtitle}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
        {movies.map(movie => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}

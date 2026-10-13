const path = require('path');
const fs = require('fs');
const db = require('../db/database');

function deleteMovieAndVideoFile(movieId) {
  try {
    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId);
    if (!movie) return false;

    // Remove video file from uploads directory
    if (movie.videoUrl && movie.videoUrl.startsWith('/uploads/')) {
      const filename = path.basename(movie.videoUrl);
      const fullPath = path.resolve(__dirname, '../../uploads', filename);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`[Avto-Tozalash] Video fayl diskdan o‘chirildi: ${filename}`);
        } catch (e) {
          console.warn('[Avto-Tozalash] Faylni o‘chirishda xatolik:', e.message);
        }
      }
    }

    // Delete associated rooms and room members
    try {
      db.prepare('DELETE FROM rooms WHERE movieId = ?').run(movieId);
    } catch (e) {}

    // Delete movie record from db
    db.prepare('DELETE FROM movies WHERE id = ?').run(movieId);
    console.log(`[Avto-Tozalash] Kino bazadan muvaffaqiyatli o‘chirildi: "${movie.title}" (ID: ${movieId})`);
    return true;
  } catch (err) {
    console.error(`[Avto-Tozalash] Xatolik (${movieId}):`, err);
    return false;
  }
}

function cleanupExpiredMovies() {
  try {
    const expiredOrWatched = db.prepare(`
      SELECT id, title, uploadedBy, isWatched
      FROM movies 
      WHERE (expiresAt IS NOT NULL AND expiresAt <= CURRENT_TIMESTAMP)
         OR (isWatched = 1 AND isPrivate = 1)
    `).all();

    if (expiredOrWatched.length > 0) {
      console.log(`[Avto-Tozalash] ${expiredOrWatched.length} ta muddati o‘tgan yoki ko‘rib bo‘lingan kinolar topildi. O‘chirilmoqda...`);
      for (const m of expiredOrWatched) {
        deleteMovieAndVideoFile(m.id);
      }
    }
  } catch (err) {
    console.error('[Avto-Tozalash] Xatolik:', err);
  }
}

function startCleanupCron(intervalMinutes = 60) {
  // Run on startup
  cleanupExpiredMovies();
  // Schedule periodic cleanup
  setInterval(cleanupExpiredMovies, intervalMinutes * 60 * 1000);
}

module.exports = {
  deleteMovieAndVideoFile,
  cleanupExpiredMovies,
  startCleanupCron
};

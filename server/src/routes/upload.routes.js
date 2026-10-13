const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db/database');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${cleanName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024 // 10 GB limit for local movies
  }
});

// POST Upload Local File (Video / Audio / Image from PC or Phone)
router.post('/file', optionalAuth, upload.any(), (req, res) => {
  try {
    const file = req.files && req.files[0];
    if (!file) {
      return res.status(400).json({ error: 'Hech qanday fayl tanlanmadi.' });
    }

    const fileUrl = `/uploads/${file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Faylni yuklashda xatolik yuz berdi: ' + err.message });
  }
});

// POST Upload Movie (Users can upload movies for review/temporary room viewing)
router.post('/', optionalAuth, (req, res) => {
  try {
    const {
      title,
      originalTitle,
      description,
      poster,
      backdrop,
      videoUrl,
      trailerUrl,
      genre,
      category = 'Yangi kinolar',
      year,
      duration = '1 soat 30 daqiqa',
      language = 'O‘zbekcha',
      actors = '',
      director = '',
      quality = '1080p Full HD',
      expireDays = 7
    } = req.body;

    const defaultPosters = [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80'
    ];
    const defaultBackdrops = [
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
      'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1920&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80'
    ];

    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Kino nomi va video havolasi kiritilishi shart.' });
    }

    const randomIdx = Math.floor(Math.random() * defaultPosters.length);
    const finalPoster = poster || defaultPosters[randomIdx];
    const finalBackdrop = backdrop || defaultBackdrops[randomIdx % defaultBackdrops.length];

    let userId = req.user ? req.user.id : null;
    if (!userId) {
      const guestNum = Math.floor(100 + Math.random() * 900);
      const guestId = 'usr_guest_' + uuidv4().slice(0, 8);
      const guestUsername = 'mehmon_' + guestNum;
      const guestName = 'Mehmon ' + guestNum;
      const guestEmail = `${guestUsername}@kinoverse.uz`;
      const avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';
      db.prepare(`
        INSERT OR IGNORE INTO users (id, email, username, name, avatar, role)
        VALUES (?, ?, ?, ?, ?, 'user')
      `).run(guestId, guestEmail, guestUsername, guestName, avatar);
      userId = guestId;
    }

    const id = 'mov_user_' + uuidv4().slice(0, 8);
    const isAdmin = req.user && ['super_admin', 'admin'].includes(req.user.role);

    // USER REQUEST: User uploads are strictly PRIVATE to uploader (faqat o'ziga ko'rinsin)
    const isPrivate = isAdmin ? 0 : 1;
    const isApproved = isAdmin ? 1 : 0;
    
    // Auto-expiration date for user uploads
    const expiresAt = isAdmin 
      ? null 
      : new Date(Date.now() + (parseInt(expireDays, 10) || 7) * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO movies (
        id, title, originalTitle, description, poster, backdrop, videoUrl, trailerUrl,
        genre, category, year, duration, rating, ratingCount, ageLimit, quality,
        director, actors, language, isFeatured, isApproved, isPrivate, uploadedBy, expiresAt, viewsCount
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 5.0, 1, '16+', ?,
        ?, ?, ?, 0, ?, ?, ?, ?, 0
      )
    `).run(
      id, title, originalTitle || title, description || `${title} haqida qiziqarli film`,
      finalPoster, finalBackdrop, videoUrl, trailerUrl || videoUrl,
      genre || 'Badiiy film', category, parseInt(year, 10) || new Date().getFullYear(),
      duration, quality, director, actors, language, isApproved, isPrivate, userId, expiresAt
    );

    const uploaded = db.prepare('SELECT * FROM movies WHERE id = ?').get(id);

    res.status(201).json({
      success: true,
      message: isPrivate
        ? 'Kino muvaffaqiyatli saqlandi! Ushbu kino faqat sizga ko‘rinadi va ko‘rib bo‘lingach avtomatik o‘chib ketadi.'
        : 'Kino muvaffaqiyatli katalogga qo‘shildi.',
      movie: uploaded
    });
  } catch (err) {
    console.error('Movie upload error:', err);
    res.status(500).json({ error: 'Kino yuklashda xatolik yuz berdi.' });
  }
});

const { deleteMovieAndVideoFile } = require('../services/cleanupService');

// DELETE Uploaded Movie (manual delete or after watching)
router.delete('/my-uploads/:id', optionalAuth, (req, res) => {
  try {
    const movieId = req.params.id;
    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Kino topilmadi.' });
    }
    const userId = req.user ? req.user.id : null;
    const isAdmin = req.user && ['super_admin', 'admin'].includes(req.user.role);
    if (movie.uploadedBy === userId || isAdmin || movie.isPrivate === 1) {
      deleteMovieAndVideoFile(movieId);
      return res.json({ success: true, message: 'Kino va uning fayllari to‘liq o‘chirildi.' });
    }
    return res.status(403).json({ error: 'Faqat kinoni yuklagan foydalanuvchi o‘chira oladi.' });
  } catch (err) {
    res.status(500).json({ error: 'Kinoni o‘chirishda xatolik.' });
  }
});

// GET My Uploaded Movies
router.get('/my-uploads', requireAuth, (req, res) => {
  try {
    const movies = db.prepare(`
      SELECT * FROM movies 
      WHERE uploadedBy = ? 
      ORDER BY createdAt DESC
    `).all(req.user.id);

    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Yuklangan kinolarni olishda xatolik.' });
  }
});

module.exports = router;

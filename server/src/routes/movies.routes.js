const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { optionalAuth, requireAdmin } = require('../middleware/auth.middleware');

// GET all movies with search, filter, and pagination
router.get('/', optionalAuth, (req, res) => {
  try {
    const { 
      search = '', 
      category = '', 
      genre = '', 
      year = '', 
      sort = 'popular',
      page = 1, 
      limit = 20 
    } = req.query;

    let query = `SELECT * FROM movies WHERE isApproved = 1 AND isPrivate = 0`;
    const params = [];

    if (search.trim()) {
      query += ` AND (title LIKE ? OR originalTitle LIKE ? OR actors LIKE ? OR director LIKE ? OR genre LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (category.trim() && category !== 'Barchasi') {
      query += ` AND (category = ? OR category LIKE ?)`;
      params.push(category, `%${category}%`);
    }

    if (genre.trim()) {
      query += ` AND genre LIKE ?`;
      params.push(`%${genre}%`);
    }

    if (year.trim()) {
      query += ` AND year = ?`;
      params.push(parseInt(year, 10));
    }

    // Sort order
    if (sort === 'rating') {
      query += ` ORDER BY rating DESC, ratingCount DESC`;
    } else if (sort === 'newest') {
      query += ` ORDER BY year DESC, createdAt DESC`;
    } else if (sort === 'views') {
      query += ` ORDER BY viewsCount DESC`;
    } else {
      query += ` ORDER BY isFeatured DESC, viewsCount DESC, rating DESC`;
    }

    // Pagination
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), offset);

    const movies = db.prepare(query).all(...params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM movies WHERE isApproved = 1 AND isPrivate = 0`;
    const countParams = [];
    if (search.trim()) {
      countQuery += ` AND (title LIKE ? OR originalTitle LIKE ? OR actors LIKE ? OR director LIKE ? OR genre LIKE ?)`;
      const term = `%${search.trim()}%`;
      countParams.push(term, term, term, term, term);
    }
    if (category.trim() && category !== 'Barchasi') {
      countQuery += ` AND (category = ? OR category LIKE ?)`;
      countParams.push(category, `%${category}%`);
    }
    if (genre.trim()) {
      countQuery += ` AND genre LIKE ?`;
      countParams.push(`%${genre}%`);
    }
    if (year.trim()) {
      countQuery += ` AND year = ?`;
      countParams.push(parseInt(year, 10));
    }
    const total = db.prepare(countQuery).get(...countParams).total;

    res.json({
      movies,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    });
  } catch (err) {
    console.error('Movies get error:', err);
    res.status(500).json({ error: 'Kinolar ro‘yxatini yuklashda xatolik yuz berdi.' });
  }
});

// GET Featured Hero Movies
router.get('/featured', (req, res) => {
  try {
    const featured = db.prepare(`
      SELECT * FROM movies 
      WHERE isApproved = 1 AND isPrivate = 0
      ORDER BY isFeatured DESC, viewsCount DESC 
      LIMIT 5
    `).all();
    res.json(featured);
  } catch (err) {
    res.status(500).json({ error: 'Asosiy kinolarni yuklashda xatolik.' });
  }
});

// GET Movies Grouped by Category for Home Rails
router.get('/rails', (req, res) => {
  try {
    const categories = [
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

    const rails = {};

    for (const cat of categories) {
      const items = db.prepare(`
        SELECT * FROM movies 
        WHERE isApproved = 1 AND isPrivate = 0 AND (category = ? OR genre LIKE ?) 
        ORDER BY viewsCount DESC, rating DESC 
        LIMIT 10
      `).all(cat, `%${cat}%`);
      
      rails[cat] = items;
    }

    res.json(rails);
  } catch (err) {
    res.status(500).json({ error: 'Kategoriyalarni yuklashda xatolik.' });
  }
});

// GET Category List
router.get('/categories', (req, res) => {
  res.json([
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
  ]);
});

// GET Single Movie Detail
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Kino topilmadi.' });
    }

    // Increment view count
    db.prepare('UPDATE movies SET viewsCount = viewsCount + 1 WHERE id = ?').run(movie.id);
    movie.viewsCount += 1;

    let isFavorite = false;
    let userRating = null;
    let watchProgress = 0;

    if (req.user) {
      const fav = db.prepare('SELECT id FROM favorites WHERE userId = ? AND movieId = ?').get(req.user.id, movie.id);
      isFavorite = !!fav;

      const rate = db.prepare('SELECT score FROM ratings WHERE userId = ? AND movieId = ?').get(req.user.id, movie.id);
      userRating = rate ? rate.score : null;

      const hist = db.prepare('SELECT progressSeconds FROM watch_history WHERE userId = ? AND movieId = ?').get(req.user.id, movie.id);
      watchProgress = hist ? hist.progressSeconds : 0;
    }

    // Get similar movies
    const firstGenre = movie.genre.split(',')[0].trim();
    const similar = db.prepare(`
      SELECT id, title, poster, year, rating, genre, quality, duration 
      FROM movies 
      WHERE isApproved = 1 AND isPrivate = 0 AND id != ? AND (genre LIKE ? OR category = ?)
      LIMIT 6
    `).all(movie.id, `%${firstGenre}%`, movie.category);

    res.json({
      ...movie,
      isFavorite,
      userRating,
      watchProgress,
      similar
    });
  } catch (err) {
    res.status(500).json({ error: 'Kino ma’lumotlarini olishda xatolik.' });
  }
});

const { deleteMovieAndVideoFile } = require('../services/cleanupService');

// POST Finish Watching & Auto-Delete Private Movie
router.post('/:id/finish-and-delete', optionalAuth, (req, res) => {
  try {
    const movieId = req.params.id;
    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId);
    if (!movie) {
      return res.json({ success: true, deleted: true, message: 'Kino allaqachon o‘chirilgan.' });
    }

    const userId = req.user ? req.user.id : null;
    const isAdmin = req.user && ['super_admin', 'admin'].includes(req.user.role);

    // If it is a private movie or uploaded by this user, delete it immediately
    if (movie.isPrivate === 1 || movie.uploadedBy === userId || isAdmin) {
      deleteMovieAndVideoFile(movieId);
      return res.json({
        success: true,
        deleted: true,
        message: 'Kino tomosha qilib bo‘lindi va serverdan to‘liq o‘chirildi.'
      });
    }

    res.json({ success: false, message: 'Faqat shaxsiy yuklangan kinolar avtomatik o‘chiriladi.' });
  } catch (err) {
    console.error('Finish and delete error:', err);
    res.status(500).json({ error: 'Kinoni o‘chirishda xatolik yuz berdi.' });
  }
});

// POST Create Movie (Admin only)
router.post('/', requireAdmin, (req, res) => {
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
      category,
      year,
      duration,
      rating = 5.0,
      ageLimit = '16+',
      quality = '4K Ultra HD',
      director,
      actors,
      language = 'O‘zbekcha',
      isFeatured = 0
    } = req.body;

    const defaultPosters = [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=600&q=80'
    ];
    const defaultBackdrops = [
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
      'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1920&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
      'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1920&q=80'
    ];

    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Kino nomi va video havolasi kiritilishi shart.' });
    }

    const randomIdx = Math.floor(Math.random() * defaultPosters.length);
    const finalPoster = poster || defaultPosters[randomIdx];
    const finalBackdrop = backdrop || defaultBackdrops[randomIdx % defaultBackdrops.length];

    const id = 'mov_' + uuidv4().slice(0, 8);
    db.prepare(`
      INSERT INTO movies (
        id, title, originalTitle, description, poster, backdrop, videoUrl, trailerUrl,
        genre, category, year, duration, rating, ratingCount, ageLimit, quality,
        director, actors, language, isFeatured, isApproved, viewsCount
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, 1, ?, ?,
        ?, ?, ?, ?, 1, 0
      )
    `).run(
      id, title, originalTitle || title, description || `${title} haqida qiziqarli film`,
      finalPoster, finalBackdrop, videoUrl, trailerUrl || videoUrl,
      genre || 'Badiiy film', category || 'Yangi kinolar', parseInt(year, 10) || new Date().getFullYear(),
      duration || '1 soat 30 daqiqa', parseFloat(rating) || 5.0, ageLimit, quality,
      director || '', actors || '', language, isFeatured ? 1 : 0
    );

    const created = db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
    res.status(201).json({ success: true, movie: created });
  } catch (err) {
    console.error('Create movie error:', err);
    res.status(500).json({ error: 'Kino qo‘shishda xatolik yuz berdi.' });
  }
});

// PUT Update Movie (Admin only)
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const {
      title, originalTitle, description, poster, backdrop, videoUrl, trailerUrl,
      genre, category, year, duration, rating, ageLimit, quality,
      director, actors, language, isFeatured
    } = req.body;

    db.prepare(`
      UPDATE movies SET
        title = COALESCE(?, title),
        originalTitle = COALESCE(?, originalTitle),
        description = COALESCE(?, description),
        poster = COALESCE(NULLIF(?, ''), poster),
        backdrop = COALESCE(NULLIF(?, ''), backdrop),
        videoUrl = COALESCE(?, videoUrl),
        trailerUrl = COALESCE(?, trailerUrl),
        genre = COALESCE(?, genre),
        category = COALESCE(?, category),
        year = COALESCE(?, year),
        duration = COALESCE(?, duration),
        rating = COALESCE(?, rating),
        ageLimit = COALESCE(?, ageLimit),
        quality = COALESCE(?, quality),
        director = COALESCE(?, director),
        actors = COALESCE(?, actors),
        language = COALESCE(?, language),
        isFeatured = COALESCE(?, isFeatured)
      WHERE id = ?
    `).run(
      title, originalTitle, description, poster, backdrop, videoUrl, trailerUrl,
      genre, category, year ? parseInt(year, 10) : undefined, duration, rating ? parseFloat(rating) : undefined, ageLimit, quality,
      director, actors, language, isFeatured !== undefined ? (isFeatured ? 1 : 0) : undefined,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
    res.json({ success: true, movie: updated });
  } catch (err) {
    res.status(500).json({ error: 'Kinoni tahrirlashda xatolik yuz berdi.' });
  }
});

// DELETE Movie (Admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM movies WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Kino muvaffaqiyatli o‘chirildi.' });
  } catch (err) {
    res.status(500).json({ error: 'Kinoni o‘chirishda xatolik.' });
  }
});

module.exports = router;

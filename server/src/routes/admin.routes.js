const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { requireAdmin, requireModerator, JWT_SECRET, ROOT_ADMIN } = require('../middleware/auth.middleware');

// Verify Admin PIN (1234)
router.post('/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (pin === '1234') {
    const token = jwt.sign(
      { id: 'admin_root', role: 'super_admin', name: 'Bosh Administrator', email: 'admin@kinoverse.uz' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    return res.json({
      success: true,
      token,
      admin: ROOT_ADMIN
    });
  } else {
    return res.status(401).json({ error: 'Xato kod! Admin paneli kodi: 1234' });
  }
});

// GET Admin Dashboard Statistics
router.get('/stats', requireModerator, (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalMovies = db.prepare('SELECT COUNT(*) as count FROM movies WHERE isApproved = 1').get().count;
    const pendingApprovals = db.prepare('SELECT COUNT(*) as count FROM movies WHERE isApproved = 0').get().count;
    const activeRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
    const userUploads = db.prepare('SELECT COUNT(*) as count FROM movies WHERE uploadedBy IS NOT NULL').get().count;
    const totalViews = db.prepare('SELECT SUM(viewsCount) as total FROM movies').get().total || 0;

    const recentUsers = db.prepare(`
      SELECT id, name, username, email, avatar, role, isBanned, createdAt, lastLoginAt
      FROM users ORDER BY createdAt DESC LIMIT 6
    `).all();

    const pendingMoviesList = db.prepare(`
      SELECT m.*, u.name as uploaderName, u.email as uploaderEmail
      FROM movies m
      LEFT JOIN users u ON m.uploadedBy = u.id
      WHERE m.isApproved = 0
      ORDER BY m.createdAt DESC
      LIMIT 10
    `).all();

    res.json({
      stats: {
        totalUsers,
        totalMovies,
        pendingApprovals,
        activeRooms,
        userUploads,
        totalViews
      },
      recentUsers,
      pendingMovies: pendingMoviesList
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Statistika ma’lumotlarini olishda xatolik.' });
  }
});

// GET All Movies for Admin Table
router.get('/movies', requireModerator, (req, res) => {
  try {
    const { status = 'all', search = '' } = req.query;
    let query = `
      SELECT m.*, u.name as uploaderName, u.email as uploaderEmail
      FROM movies m
      LEFT JOIN users u ON m.uploadedBy = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status === 'approved') {
      query += ` AND m.isApproved = 1`;
    } else if (status === 'pending') {
      query += ` AND m.isApproved = 0`;
    }

    if (search.trim()) {
      query += ` AND (m.title LIKE ? OR m.director LIKE ? OR m.genre LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY m.createdAt DESC`;
    const movies = db.prepare(query).all(...params);

    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Admin kinolar ro‘yxatini yuklashda xatolik.' });
  }
});

// Approve user uploaded movie
router.put('/movies/:id/approve', requireAdmin, (req, res) => {
  try {
    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Kino topilmadi.' });
    }

    db.prepare('UPDATE movies SET isApproved = 1 WHERE id = ?').run(movie.id);

    if (movie.uploadedBy) {
      db.prepare(`
        INSERT INTO notifications (id, userId, title, message, type, link)
        VALUES (?, ?, ?, ?, 'movie_approved', ?)
      `).run(
        'notif_' + uuidv4().slice(0, 8),
        movie.uploadedBy,
        'Kino tasdiqlandi! 🎉',
        `Siz yuklagan "${movie.title}" kinosi ma’muriyat tomonidan tasdiqlandi va umumiy katalogga chiqdi!`,
        `/movie/${movie.id}`
      );
    }

    res.json({ success: true, message: 'Kino muvaffaqiyatli tasdiqlandi.' });
  } catch (err) {
    res.status(500).json({ error: 'Kinoni tasdiqlashda xatolik.' });
  }
});

// Delete movie
router.delete('/movies/:id', requireAdmin, (req, res) => {
  try {
    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Kino topilmadi.' });
    }

    db.prepare('DELETE FROM movies WHERE id = ?').run(movie.id);

    res.json({ success: true, message: `"${movie.title}" kinosi muvaffaqiyatli o‘chirildi.` });
  } catch (err) {
    res.status(500).json({ error: 'Kinoni o‘chirishda xatolik.' });
  }
});

// Toggle Featured Movie
router.put('/movies/:id/toggle-featured', requireAdmin, (req, res) => {
  try {
    const movie = db.prepare('SELECT id, isFeatured FROM movies WHERE id = ?').get(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Kino topilmadi.' });
    }

    const nextState = movie.isFeatured ? 0 : 1;
    db.prepare('UPDATE movies SET isFeatured = ? WHERE id = ?').run(nextState, movie.id);

    res.json({ success: true, isFeatured: nextState });
  } catch (err) {
    res.status(500).json({ error: 'Featured holatini o‘zgartirishda xatolik.' });
  }
});

// Booster: Update movie views count and rating directly
router.put('/movies/:id/boost', requireAdmin, (req, res) => {
  try {
    const { viewsCount, rating } = req.body;
    const movie = db.prepare('SELECT id, title FROM movies WHERE id = ?').get(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Kino topilmadi.' });
    }

    db.prepare(`
      UPDATE movies SET
        viewsCount = COALESCE(?, viewsCount),
        rating = COALESCE(?, rating)
      WHERE id = ?
    `).run(
      viewsCount !== undefined ? parseInt(viewsCount, 10) : undefined,
      rating !== undefined ? parseFloat(rating) : undefined,
      req.params.id
    );

    res.json({ success: true, message: `"${movie.title}" ko‘rsatkichlari muvaffaqiyatli yangilandi!` });
  } catch (err) {
    res.status(500).json({ error: 'Kino ko‘rsatkichlarini yangilashda xatolik.' });
  }
});

// GET All Users
router.get('/users', requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.name, u.username, u.email, u.avatar, u.role, u.isBanned, u.createdAt, u.lastLoginAt,
             (SELECT COUNT(*) FROM movies m WHERE m.uploadedBy = u.id) as uploadsCount,
             (SELECT COUNT(*) FROM comments c WHERE c.userId = u.id) as commentsCount
      FROM users u
      ORDER BY u.createdAt DESC
    `).all();

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Foydalanuvchilar ro‘yxatini olishda xatolik.' });
  }
});

// Ban / Unban User
router.put('/users/:id/ban', requireAdmin, (req, res) => {
  try {
    const targetUser = db.prepare('SELECT id, role, isBanned, name FROM users WHERE id = ?').get(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
    }

    if (targetUser.id === 'user_superadmin_01' || targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Super Adminni bloklash mumkin emas.' });
    }

    const nextState = targetUser.isBanned ? 0 : 1;
    db.prepare('UPDATE users SET isBanned = ? WHERE id = ?').run(nextState, targetUser.id);

    res.json({
      success: true,
      isBanned: nextState,
      message: nextState ? `"${targetUser.name}" bloklandi.` : `"${targetUser.name}" blokdan chiqarildi.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Foydalanuvchi holatini yangilashda xatolik.' });
  }
});

// GET Active Virtual Rooms for Admin
router.get('/rooms', requireAdmin, (req, res) => {
  try {
    const rooms = db.prepare(`
      SELECT r.*, m.title as movieTitle, m.poster as moviePoster,
             u.name as hostName, u.email as hostEmail,
             (SELECT COUNT(*) FROM room_members rm WHERE rm.roomId = r.id) as membersCount
      FROM rooms r
      JOIN movies m ON r.movieId = m.id
      JOIN users u ON r.hostId = u.id
      ORDER BY r.createdAt DESC
    `).all();

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Virtual xonalarni olishda xatolik.' });
  }
});

// Force Close Virtual Room
router.delete('/rooms/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Virtual kino xonasi majburiy yopildi.' });
  } catch (err) {
    res.status(500).json({ error: 'Xonani yopishda xatolik.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');

// --- FAVORITES ---
router.get('/favorites', requireAuth, (req, res) => {
  try {
    const movies = db.prepare(`
      SELECT m.*, f.createdAt as favoritedAt
      FROM favorites f
      JOIN movies m ON f.movieId = m.id
      WHERE f.userId = ?
      ORDER BY f.createdAt DESC
    `).all(req.user.id);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Sevimlilar ro‘yxatini olishda xatolik.' });
  }
});

router.post('/favorites/:movieId/toggle', requireAuth, (req, res) => {
  try {
    const { movieId } = req.params;
    const existing = db.prepare('SELECT id FROM favorites WHERE userId = ? AND movieId = ?').get(req.user.id, movieId);

    if (existing) {
      db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
      return res.json({ success: true, isFavorite: false, message: 'Sevimlilardan o‘chirildi.' });
    } else {
      const id = 'fav_' + uuidv4().slice(0, 8);
      db.prepare('INSERT INTO favorites (id, userId, movieId) VALUES (?, ?, ?)').run(id, req.user.id, movieId);
      return res.json({ success: true, isFavorite: true, message: 'Sevimlilarga qo‘shildi!' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Sevimlilarni yangilashda xatolik.' });
  }
});

// --- WATCH HISTORY ---
router.get('/history', requireAuth, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT wh.id, wh.progressSeconds, wh.totalSeconds, wh.lastWatchedAt,
             m.id as movieId, m.title, m.poster, m.backdrop, m.duration, m.genre, m.year, m.quality
      FROM watch_history wh
      JOIN movies m ON wh.movieId = m.id
      WHERE wh.userId = ?
      ORDER BY wh.lastWatchedAt DESC
    `).all(req.user.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Ko‘rish tarixini olishda xatolik.' });
  }
});

router.post('/history', requireAuth, (req, res) => {
  try {
    const { movieId, progressSeconds = 0, totalSeconds = 0 } = req.body;
    if (!movieId) {
      return res.status(400).json({ error: 'Kino ko‘rsatilmadi.' });
    }

    const id = 'wh_' + uuidv4().slice(0, 8);
    db.prepare(`
      INSERT INTO watch_history (id, userId, movieId, progressSeconds, totalSeconds, lastWatchedAt)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId, movieId) DO UPDATE SET
        progressSeconds = excluded.progressSeconds,
        totalSeconds = excluded.totalSeconds,
        lastWatchedAt = CURRENT_TIMESTAMP
    `).run(id, req.user.id, movieId, progressSeconds, totalSeconds);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Tarixni saqlashda xatolik.' });
  }
});

router.delete('/history/:movieId', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM watch_history WHERE userId = ? AND movieId = ?').run(req.user.id, req.params.movieId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Tarixdan o‘chirishda xatolik.' });
  }
});

// --- FRIENDS SYSTEM ---
router.get('/friends', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    // Get confirmed friends
    const friends = db.prepare(`
      SELECT u.id, u.name, u.username, u.avatar, u.role, u.lastLoginAt,
             (CASE WHEN datetime(u.lastLoginAt) >= datetime('now', '-5 minutes') THEN 1 ELSE 0 END) as isOnline
      FROM friends f
      JOIN users u ON (u.id = CASE WHEN f.user1Id = ? THEN f.user2Id ELSE f.user1Id END)
      WHERE f.user1Id = ? OR f.user2Id = ?
    `).all(userId, userId, userId);

    // Get received pending requests
    const incomingRequests = db.prepare(`
      SELECT fr.id, fr.createdAt, u.id as senderId, u.name, u.username, u.avatar
      FROM friend_requests fr
      JOIN users u ON fr.senderId = u.id
      WHERE fr.receiverId = ? AND fr.status = 'pending'
    `).all(userId);

    // Get sent pending requests
    const outgoingRequests = db.prepare(`
      SELECT fr.id, fr.createdAt, u.id as receiverId, u.name, u.username, u.avatar
      FROM friend_requests fr
      JOIN users u ON fr.receiverId = u.id
      WHERE fr.senderId = ? AND fr.status = 'pending'
    `).all(userId);

    res.json({ friends, incomingRequests, outgoingRequests });
  } catch (err) {
    res.status(500).json({ error: 'Do‘stlar ro‘yxatini olishda xatolik.' });
  }
});

router.get('/users/search', requireAuth, (req, res) => {
  try {
    const { query = '' } = req.query;
    if (!query.trim()) return res.json([]);

    const users = db.prepare(`
      SELECT id, name, username, avatar, role
      FROM users
      WHERE id != ? AND isBanned = 0 AND (name LIKE ? OR username LIKE ? OR email LIKE ?)
      LIMIT 10
    `).all(req.user.id, `%${query}%`, `%${query}%`, `%${query}%`);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Foydalanuvchilarni qidirishda xatolik.' });
  }
});

router.post('/friends/request', requireAuth, (req, res) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId || receiverId === req.user.id) {
      return res.status(400).json({ error: 'Yaroqsiz foydalanuvchi.' });
    }

    // Check if already friends
    const alreadyFriends = db.prepare(`
      SELECT id FROM friends 
      WHERE (user1Id = ? AND user2Id = ?) OR (user1Id = ? AND user2Id = ?)
    `).get(req.user.id, receiverId, receiverId, req.user.id);

    if (alreadyFriends) {
      return res.status(400).json({ error: 'Siz allaqachon do‘stsiz.' });
    }

    // Check if pending request exists
    const existingReq = db.prepare(`
      SELECT * FROM friend_requests 
      WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
    `).get(req.user.id, receiverId, receiverId, req.user.id);

    if (existingReq) {
      return res.status(400).json({ error: 'Do‘stlik so‘rovi allaqachon yuborilgan yoki kutilmoqda.' });
    }

    const id = 'fr_req_' + uuidv4().slice(0, 8);
    db.prepare('INSERT INTO friend_requests (id, senderId, receiverId) VALUES (?, ?, ?)').run(id, req.user.id, receiverId);

    // Create notification for receiver
    db.prepare(`
      INSERT INTO notifications (id, userId, title, message, type, link)
      VALUES (?, ?, ?, ?, 'friend_request', '/friends')
    `).run(
      'notif_' + uuidv4().slice(0, 8),
      receiverId,
      'Yangi do‘stlik so‘rovi 🤝',
      `"${req.user.name}" sizga do‘stlik so‘rovini yubordi.`
    );

    res.status(201).json({ success: true, message: 'Do‘stlik so‘rovi yuborildi!' });
  } catch (err) {
    res.status(500).json({ error: 'So‘rov yuborishda xatolik.' });
  }
});

router.post('/friends/respond', requireAuth, (req, res) => {
  try {
    const { requestId, action } = req.body; // 'accept' or 'decline'
    const request = db.prepare('SELECT * FROM friend_requests WHERE id = ? AND receiverId = ?').get(requestId, req.user.id);

    if (!request) {
      return res.status(404).json({ error: 'So‘rov topilmadi.' });
    }

    if (action === 'accept') {
      const friendId = 'fr_' + uuidv4().slice(0, 8);
      const tx = db.transaction(() => {
        db.prepare('INSERT OR IGNORE INTO friends (id, user1Id, user2Id) VALUES (?, ?, ?)').run(friendId, request.senderId, request.receiverId);
        db.prepare('DELETE FROM friend_requests WHERE id = ?').run(requestId);
        
        // Notify sender that request was accepted
        db.prepare(`
          INSERT INTO notifications (id, userId, title, message, type, link)
          VALUES (?, ?, ?, ?, 'friend_request', '/friends')
        `).run(
          'notif_' + uuidv4().slice(0, 8),
          request.senderId,
          'Do‘stlik qabul qilindi! 🎉',
          `"${req.user.name}" sizning do‘stlik so‘rovingizni qabul qildi.`
        );
      });
      tx();
      return res.json({ success: true, message: 'Do‘stlik qabul qilindi!' });
    } else {
      db.prepare('DELETE FROM friend_requests WHERE id = ?').run(requestId);
      return res.json({ success: true, message: 'So‘rov rad etildi.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'So‘rovga javob berishda xatolik.' });
  }
});

router.delete('/friends/:friendId', requireAuth, (req, res) => {
  try {
    const friendId = req.params.friendId;
    db.prepare(`
      DELETE FROM friends 
      WHERE (user1Id = ? AND user2Id = ?) OR (user1Id = ? AND user2Id = ?)
    `).run(req.user.id, friendId, friendId, req.user.id);

    res.json({ success: true, message: 'Do‘stlar safidan chiqarildi.' });
  } catch (err) {
    res.status(500).json({ error: 'Do‘stni o‘chirishda xatolik.' });
  }
});

// --- NOTIFICATIONS ---
router.get('/notifications', requireAuth, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      LIMIT 30
    `).all(req.user.id);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE userId = ? AND isRead = 0
    `).get(req.user.id).count;

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Bildirishnomalarni olishda xatolik.' });
  }
});

router.put('/notifications/:id/read', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Holatni yangilashda xatolik.' });
  }
});

router.put('/notifications/read-all', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET isRead = 1 WHERE userId = ?').run(req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Bildirishnomalarni o‘qilgan qilishda xatolik.' });
  }
});

// --- COMMENTS ---
router.get('/comments/:movieId', optionalAuth, (req, res) => {
  try {
    const comments = db.prepare(`
      SELECT c.*, u.name as userName, u.username, u.avatar as userAvatar, u.role as userRole
      FROM comments c
      JOIN users u ON c.userId = u.id
      WHERE c.movieId = ?
      ORDER BY c.createdAt DESC
    `).all(req.params.movieId);

    // If authenticated, check which comments user has liked
    let userLikes = new Set();
    if (req.user) {
      const likes = db.prepare('SELECT commentId FROM comment_likes WHERE userId = ?').all(req.user.id);
      userLikes = new Set(likes.map(l => l.commentId));
    }

    const enhanced = comments.map(c => ({
      ...c,
      isLiked: userLikes.has(c.id)
    }));

    res.json(enhanced);
  } catch (err) {
    res.status(500).json({ error: 'Fikrlarni yuklashda xatolik.' });
  }
});

router.post('/comments/:movieId', requireAuth, (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Fikr matni bo‘sh bo‘lishi mumkin emas.' });
    }

    const id = 'c_' + uuidv4().slice(0, 8);
    db.prepare(`
      INSERT INTO comments (id, movieId, userId, content, likesCount)
      VALUES (?, ?, ?, ?, 0)
    `).run(id, req.params.movieId, req.user.id, content.trim());

    const created = db.prepare(`
      SELECT c.*, u.name as userName, u.username, u.avatar as userAvatar, u.role as userRole
      FROM comments c
      JOIN users u ON c.userId = u.id
      WHERE c.id = ?
    `).get(id);

    res.status(201).json({ success: true, comment: { ...created, isLiked: false } });
  } catch (err) {
    res.status(500).json({ error: 'Fikr qoldirishda xatolik.' });
  }
});

router.delete('/comments/:commentId', requireAuth, (req, res) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Fikr topilmadi.' });
    }

    const isModerator = ['super_admin', 'admin', 'moderator'].includes(req.user.role);
    if (comment.userId !== req.user.id && !isModerator) {
      return res.status(403).json({ error: 'Ushbu fikrni o‘chirishga ruxsatingiz yo‘q.' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id);
    res.json({ success: true, message: 'Fikr o‘chirildi.' });
  } catch (err) {
    res.status(500).json({ error: 'Fikrni o‘chirishda xatolik.' });
  }
});

router.post('/comments/:commentId/like', requireAuth, (req, res) => {
  try {
    const commentId = req.params.commentId;
    const existing = db.prepare('SELECT id FROM comment_likes WHERE commentId = ? AND userId = ?').get(commentId, req.user.id);

    if (existing) {
      db.prepare('DELETE FROM comment_likes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE comments SET likesCount = MAX(0, likesCount - 1) WHERE id = ?').run(commentId);
      return res.json({ success: true, isLiked: false });
    } else {
      const id = 'cl_' + uuidv4().slice(0, 8);
      db.prepare('INSERT INTO comment_likes (id, commentId, userId) VALUES (?, ?, ?)').run(id, commentId, req.user.id);
      db.prepare('UPDATE comments SET likesCount = likesCount + 1 WHERE id = ?').run(commentId);
      return res.json({ success: true, isLiked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Likelarni yangilashda xatolik.' });
  }
});

// --- RATING (1-5 STARS) ---
router.post('/ratings/:movieId', requireAuth, (req, res) => {
  try {
    const { movieId } = req.params;
    const { score } = req.body;
    const numScore = parseInt(score, 10);

    if (!numScore || numScore < 1 || numScore > 5) {
      return res.status(400).json({ error: 'Reyting 1 dan 5 gacha bo‘lishi lozim.' });
    }

    const id = 'rat_' + uuidv4().slice(0, 8);
    db.prepare(`
      INSERT INTO ratings (id, movieId, userId, score)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(movieId, userId) DO UPDATE SET score = excluded.score
    `).run(id, movieId, req.user.id, numScore);

    // Recalculate average rating for the movie
    const stats = db.prepare(`
      SELECT AVG(score) as avgRating, COUNT(*) as count 
      FROM ratings 
      WHERE movieId = ?
    `).get(movieId);

    const roundedRating = Math.round((stats.avgRating || 5.0) * 10) / 10;
    db.prepare('UPDATE movies SET rating = ?, ratingCount = ? WHERE id = ?')
      .run(roundedRating, stats.count, movieId);

    res.json({
      success: true,
      userRating: numScore,
      newRating: roundedRating,
      ratingCount: stats.count,
      message: 'Bahoyingiz qabul qilindi!'
    });
  } catch (err) {
    res.status(500).json({ error: 'Reyting berishda xatolik.' });
  }
});

module.exports = router;

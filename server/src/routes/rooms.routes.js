const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');

// GET Active Rooms list
router.get('/active', optionalAuth, (req, res) => {
  try {
    const rooms = db.prepare(`
      SELECT r.*, 
             COALESCE(m.title, 'Kino') as movieTitle, 
             COALESCE(m.poster, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80') as moviePoster, 
             COALESCE(m.backdrop, 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80') as movieBackdrop,
             COALESCE(u.name, 'Boshlovchi') as hostName, 
             COALESCE(u.avatar, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80') as hostAvatar,
             (SELECT COUNT(*) FROM room_members rm WHERE rm.roomId = r.id) as currentMembersCount
      FROM rooms r
      LEFT JOIN movies m ON r.movieId = m.id
      LEFT JOIN users u ON r.hostId = u.id
      ORDER BY r.createdAt DESC
      LIMIT 20
    `).all();

    res.json(rooms);
  } catch (err) {
    console.error('Active rooms error:', err);
    res.status(500).json({ error: 'Aktiv kino xonalarini yuklashda xatolik.' });
  }
});

// POST Create or Get Room for Movie
router.post('/create', optionalAuth, (req, res) => {
  try {
    const { movieId } = req.body;
    if (!movieId) {
      return res.status(400).json({ error: 'Kino tanlanmadi.' });
    }

    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Kino topilmadi.' });
    }

    let userId = req.user ? req.user.id : null;
    let guestUser = null;
    let guestToken = null;

    if (!userId) {
      const guestNum = Math.floor(100 + Math.random() * 900);
      const guestId = 'usr_guest_' + uuidv4().slice(0, 8);
      const guestUsername = 'mehmon_' + guestNum;
      const guestName = 'Mehmon ' + guestNum;
      const guestEmail = `${guestUsername}@kinoverse.uz`;
      const avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';
      db.prepare(`
        INSERT INTO users (id, email, username, name, avatar, role)
        VALUES (?, ?, ?, ?, ?, 'user')
      `).run(guestId, guestEmail, guestUsername, guestName, avatar);

      userId = guestId;
      guestUser = { id: guestId, email: guestEmail, username: guestUsername, name: guestName, avatar, role: 'user' };
      const { JWT_SECRET } = require('../middleware/auth.middleware');
      const jwt = require('jsonwebtoken');
      guestToken = jwt.sign({ id: guestId, email: guestEmail, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });
    } else {
      // Ensure host user exists in users table so foreign key constraint never fails
      const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      if (!existingUser) {
        let safeEmail = (req.user && req.user.email) || `${userId}@kinoverse.uz`;
        let safeUsername = (req.user && req.user.username) || userId;
        if (db.prepare('SELECT id FROM users WHERE email = ?').get(safeEmail)) {
          safeEmail = `${userId}_${Date.now()}@kinoverse.uz`;
        }
        if (db.prepare('SELECT id FROM users WHERE username = ?').get(safeUsername)) {
          safeUsername = `${userId}_${Date.now()}`;
        }
        db.prepare(`
          INSERT OR IGNORE INTO users (id, email, username, name, avatar, role)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          safeEmail,
          safeUsername,
          (req.user && req.user.name) || 'Bosh Administrator',
          (req.user && req.user.avatar) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          (req.user && req.user.role) || 'super_admin'
        );
      }
    }

    // Check if user already has an active room for this movie
    let existingRoom = db.prepare(`
      SELECT * FROM rooms WHERE movieId = ? AND hostId = ? ORDER BY createdAt DESC LIMIT 1
    `).get(movieId, userId);

    if (existingRoom) {
      // Ensure host is assigned to seat 0
      try {
        db.prepare('DELETE FROM room_members WHERE roomId = ? AND (seatIndex = 0 OR userId = ?)').run(existingRoom.id, userId);
        const memberId = 'rm_' + uuidv4().slice(0, 8);
        db.prepare(`
          INSERT OR REPLACE INTO room_members (id, roomId, userId, seatIndex)
          VALUES (?, ?, ?, 0)
        `).run(memberId, existingRoom.id, userId);
      } catch (e) {}
      return res.json({ success: true, roomId: existingRoom.id, room: existingRoom, guestUser, guestToken });
    }

    // Create a new room with a unique friendly code
    let roomId = 'KINO-' + Math.floor(1000 + Math.random() * 9000);
    while (db.prepare('SELECT id FROM rooms WHERE id = ?').get(roomId)) {
      roomId = 'KINO-' + Math.floor(1000 + Math.random() * 9000);
    }

    db.prepare(`
      INSERT INTO rooms (id, movieId, hostId, title, isPlaying, currentTime, maxMembers)
      VALUES (?, ?, ?, ?, 0, 0, 4)
    `).run(roomId, movie.id, userId, `${movie.title} — Virtual Zali`);

    // Assign host to Seat 0
    try {
      db.prepare('DELETE FROM room_members WHERE roomId = ? AND (seatIndex = 0 OR userId = ?)').run(roomId, userId);
    } catch (e) {}

    const memberId = 'rm_' + uuidv4().slice(0, 8);
    db.prepare(`
      INSERT OR REPLACE INTO room_members (id, roomId, userId, seatIndex)
      VALUES (?, ?, ?, 0)
    `).run(memberId, roomId, userId);

    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    res.status(201).json({ success: true, roomId, room, guestUser, guestToken });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Kino xonasi yaratishda xatolik yuz berdi.' });
  }
});

// GET Room details by ID
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const roomId = req.params.id;
    const room = db.prepare(`
      SELECT r.*, 
             COALESCE(m.title, 'Kino') as movieTitle, 
             m.originalTitle, 
             COALESCE(m.description, 'Tavsif mavjud emas') as movieDescription,
             COALESCE(m.poster, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80') as moviePoster, 
             COALESCE(m.backdrop, 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80') as movieBackdrop, 
             COALESCE(m.videoUrl, '') as videoUrl, 
             COALESCE(m.duration, '120 daqiqa') as duration,
             COALESCE(m.quality, '1080p') as quality, 
             COALESCE(m.language, 'O‘zbekcha') as language, 
             COALESCE(u.name, 'Boshlovchi') as hostName, 
             COALESCE(u.avatar, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80') as hostAvatar
      FROM rooms r
      LEFT JOIN movies m ON r.movieId = m.id
      LEFT JOIN users u ON r.hostId = u.id
      WHERE r.id = ?
    `).get(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Kino xonasi topilmadi yoki yopilgan.' });
    }

    // Get current members with their seat index and profile details
    const members = db.prepare(`
      SELECT rm.id, rm.roomId, rm.seatIndex, rm.joinedAt,
             rm.userId, 
             COALESCE(u.name, 'Tomoshabin') as name, 
             COALESCE(u.username, 'mehmon') as username, 
             COALESCE(u.avatar, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80') as avatar, 
             COALESCE(u.role, 'user') as role
      FROM room_members rm
      LEFT JOIN users u ON rm.userId = u.id
      WHERE rm.roomId = ?
      ORDER BY rm.seatIndex ASC
    `).all(roomId);

    res.json({
      ...room,
      members,
      isFull: members.length >= room.maxMembers
    });
  } catch (err) {
    console.error('Get room error:', err);
    res.status(500).json({ error: 'Kino xonasi ma’lumotlarini olishda xatolik.' });
  }
});

// POST Join Room
router.post('/:id/join', requireAuth, (req, res) => {
  try {
    const roomId = req.params.id;
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Kino xonasi topilmadi.' });
    }

    // Check if user is already a member
    const existing = db.prepare('SELECT * FROM room_members WHERE roomId = ? AND userId = ?').get(roomId, req.user.id);
    if (existing) {
      return res.json({ success: true, seatIndex: existing.seatIndex, message: 'Xonadasiz.' });
    }

    // Count members
    const members = db.prepare('SELECT seatIndex FROM room_members WHERE roomId = ?').all(roomId);
    if (members.length >= room.maxMembers) {
      return res.status(400).json({
        error: 'Bu kino xonasi to‘liq. Maksimal 4 ta foydalanuvchi qatnashishi mumkin.'
      });
    }

    // Find first available seat index (0, 1, 2, 3)
    const occupiedSeats = new Set(members.map(m => m.seatIndex));
    let availableSeat = 0;
    for (let i = 0; i < 4; i++) {
      if (!occupiedSeats.has(i)) {
        availableSeat = i;
        break;
      }
    }

    const memberId = 'rm_' + uuidv4().slice(0, 8);
    db.prepare(`
      INSERT INTO room_members (id, roomId, userId, seatIndex)
      VALUES (?, ?, ?, ?)
    `).run(memberId, roomId, req.user.id, availableSeat);

    res.json({ success: true, seatIndex: availableSeat });
  } catch (err) {
    console.error('Join room error:', err);
    res.status(500).json({ error: 'Xonaga ulanishda xatolik yuz berdi.' });
  }
});

module.exports = router;

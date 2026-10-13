const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { requireAuth, JWT_SECRET } = require('../middleware/auth.middleware');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Google OAuth Login
router.post('/google', async (req, res) => {
  try {
    const { credential, email, name, avatar, googleId } = req.body;

    let targetEmail = email;
    let targetName = name;
    let targetAvatar = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';
    let targetGoogleId = googleId;

    // In case credential is a base64 JWT payload from Google Sign-In
    if (credential && !targetEmail) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          targetEmail = payload.email;
          targetName = payload.name;
          targetAvatar = payload.picture || targetAvatar;
          targetGoogleId = payload.sub;
        }
      } catch (err) {
        console.error('Google token decode xatosi:', err);
      }
    }

    if (!targetEmail) {
      return res.status(400).json({ error: 'Google hisob ma’lumotlari to‘liq emas.' });
    }

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(targetEmail);

    if (user) {
      if (user.isBanned === 1) {
        return res.status(403).json({ error: 'Hisobingiz ma’muriyat tomonidan bloklangan.' });
      }
      db.prepare('UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP, avatar = COALESCE(?, avatar) WHERE id = ?')
        .run(targetAvatar, user.id);
    } else {
      const newId = 'usr_' + uuidv4().slice(0, 8);
      const username = (targetEmail.split('@')[0] + '_' + Math.floor(Math.random() * 1000)).toLowerCase();
      db.prepare(`
        INSERT INTO users (id, email, username, name, avatar, role, googleId)
        VALUES (?, ?, ?, ?, ?, 'user', ?)
      `).run(newId, targetEmail, username, targetName || 'Kino Ishqibozi', targetAvatar, targetGoogleId);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(newId);
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Google login xatosi:', err);
    res.status(500).json({ error: 'Google orqali kirishda server xatoligi yuz berdi.' });
  }
});

// Guest Instant Login (for immediate movie watching & room entry)
router.post('/guest', (req, res) => {
  try {
    const guestNum = Math.floor(100 + Math.random() * 900);
    const guestId = 'usr_guest_' + uuidv4().slice(0, 8);
    const guestUsername = 'mehmon_' + guestNum;
    const guestName = 'Mehmon ' + guestNum;
    const guestEmail = `${guestUsername}@kinoverse.uz`;
    const guestAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
    ];
    const avatar = guestAvatars[Math.floor(Math.random() * guestAvatars.length)];

    db.prepare(`
      INSERT INTO users (id, email, username, name, avatar, role)
      VALUES (?, ?, ?, ?, ?, 'user')
    `).run(guestId, guestEmail, guestUsername, guestName, avatar);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(guestId);
    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Guest login error:', err);
    res.status(500).json({ error: 'Mehmon profilini yaratishda xatolik.' });
  }
});


// Standard Email/Password Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email va parolni to‘liq kiriting.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Bunday email mavjud emas yoki parol xato.' });
    }

    if (user.isBanned === 1) {
      return res.status(403).json({ error: 'Sizning hisobingiz bloklangan.' });
    }

    if (user.password) {
      const isValid = bcrypt.compareSync(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Bunday email mavjud emas yoki parol xato.' });
      }
    }

    db.prepare('UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Kirishda xatolik yuz berdi.' });
  }
});

// Standard Register
router.post('/register', (req, res) => {
  try {
    const { email, username, name, password, avatar } = req.body;
    if (!email || !username || !name || !password) {
      return res.status(400).json({ error: 'Barcha maydonlarni to‘ldiring.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) {
      return res.status(400).json({ error: 'Ushbu email yoki foydalanuvchi nomi allaqachon band.' });
    }

    const newId = 'usr_' + uuidv4().slice(0, 8);
    const hashedPassword = bcrypt.hashSync(password, 10);
    const defaultAvatar = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

    db.prepare(`
      INSERT INTO users (id, email, username, name, password, avatar, role)
      VALUES (?, ?, ?, ?, ?, ?, 'user')
    `).run(newId, email, username.toLowerCase(), name, hashedPassword, defaultAvatar);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(newId);
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Ro‘yxatdan o‘tishda xatolik yuz berdi.' });
  }
});

// Get Current User Profile with stats
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, username, name, avatar, role, createdAt, lastLoginAt FROM users WHERE id = ?').get(req.user.id);
    
    // Aggregate user counts
    const favCount = db.prepare('SELECT COUNT(*) as count FROM favorites WHERE userId = ?').get(user.id).count;
    const historyCount = db.prepare('SELECT COUNT(*) as count FROM watch_history WHERE userId = ?').get(user.id).count;
    const uploadCount = db.prepare('SELECT COUNT(*) as count FROM movies WHERE uploadedBy = ?').get(user.id).count;
    const friendCount = db.prepare('SELECT COUNT(*) as count FROM friends WHERE user1Id = ? OR user2Id = ?').get(user.id, user.id).count;

    res.json({
      ...user,
      stats: {
        favorites: favCount,
        history: historyCount,
        uploads: uploadCount,
        friends: friendCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Profil ma’lumotlarini olishda xatolik.' });
  }
});

// Update Profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, avatar } = req.body;
    db.prepare('UPDATE users SET name = COALESCE(?, name), avatar = COALESCE(?, avatar) WHERE id = ?')
      .run(name, avatar, req.user.id);

    const updated = db.prepare('SELECT id, email, username, name, avatar, role FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Profilni yangilashda xatolik yuz berdi.' });
  }
});

module.exports = router;

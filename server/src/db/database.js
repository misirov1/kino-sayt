const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'kino_platformasi.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      role TEXT DEFAULT 'user', -- 'super_admin', 'admin', 'moderator', 'user'
      password TEXT,
      googleId TEXT,
      isBanned INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastLoginAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      originalTitle TEXT,
      description TEXT NOT NULL,
      poster TEXT NOT NULL,
      backdrop TEXT NOT NULL,
      videoUrl TEXT NOT NULL,
      trailerUrl TEXT,
      genre TEXT NOT NULL,
      category TEXT NOT NULL, -- 'Yangi kinolar', 'Mashhur kinolar', 'O‘zbek kinolari', 'O‘zbek tilidagi kinolar', 'Jangari', 'Komediya', 'Drama', 'Fantastika', 'Horror', 'Multfilm', 'Seriallar'
      year INTEGER NOT NULL,
      duration TEXT NOT NULL,
      rating REAL DEFAULT 4.8,
      ratingCount INTEGER DEFAULT 0,
      ageLimit TEXT DEFAULT '16+',
      quality TEXT DEFAULT '4K Ultra HD',
      director TEXT,
      actors TEXT,
      language TEXT DEFAULT 'O‘zbekcha',
      isFeatured INTEGER DEFAULT 0,
      isApproved INTEGER DEFAULT 1,
      uploadedBy TEXT,
      expiresAt DATETIME,
      viewsCount INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      movieId TEXT NOT NULL,
      hostId TEXT NOT NULL,
      title TEXT NOT NULL,
      isPlaying INTEGER DEFAULT 0,
      currentTime REAL DEFAULT 0,
      playbackRate REAL DEFAULT 1,
      maxMembers INTEGER DEFAULT 4,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (movieId) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY (hostId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS room_members (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      userId TEXT NOT NULL,
      seatIndex INTEGER NOT NULL, -- 0, 1, 2, 3 (for the 4-seater couch)
      joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(roomId, userId),
      UNIQUE(roomId, seatIndex)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      movieId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (movieId) REFERENCES movies(id) ON DELETE CASCADE,
      UNIQUE(userId, movieId)
    );

    CREATE TABLE IF NOT EXISTS watch_history (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      movieId TEXT NOT NULL,
      progressSeconds REAL DEFAULT 0,
      totalSeconds REAL DEFAULT 0,
      lastWatchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (movieId) REFERENCES movies(id) ON DELETE CASCADE,
      UNIQUE(userId, movieId)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      movieId TEXT NOT NULL,
      userId TEXT NOT NULL,
      content TEXT NOT NULL,
      likesCount INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (movieId) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comment_likes (
      id TEXT PRIMARY KEY,
      commentId TEXT NOT NULL,
      userId TEXT NOT NULL,
      FOREIGN KEY (commentId) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(commentId, userId)
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      movieId TEXT NOT NULL,
      userId TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (movieId) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(movieId, userId)
    );

    CREATE TABLE IF NOT EXISTS friends (
      id TEXT PRIMARY KEY,
      user1Id TEXT NOT NULL,
      user2Id TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user1Id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user2Id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user1Id, user2Id)
    );

    CREATE TABLE IF NOT EXISTS friend_requests (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      receiverId TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(senderId, receiverId)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- 'room_invite', 'friend_request', 'movie_approved', 'system'
      link TEXT,
      isRead INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Add isPrivate and isWatched columns to movies if they do not exist
  try {
    db.prepare('ALTER TABLE movies ADD COLUMN isPrivate INTEGER DEFAULT 0').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE movies ADD COLUMN isWatched INTEGER DEFAULT 0').run();
  } catch (e) {}

  // Always ensure ROOT_ADMIN exists in users table so foreign keys never fail
  try {
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, username, name, avatar, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'admin_root',
      'admin_root@kinoverse.uz',
      'admin_root',
      'Bosh Administrator',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      'super_admin'
    );
  } catch (err) {
    console.warn('Could not insert admin_root into users:', err.message);
  }
}

initDb();

module.exports = db;

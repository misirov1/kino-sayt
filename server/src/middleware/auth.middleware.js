const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'kinoverse_super_secret_jwt_key_2026_uz';

const ROOT_ADMIN = {
  id: 'admin_root',
  email: 'admin_root@kinoverse.uz',
  username: 'admin_root',
  name: 'Bosh Administrator',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  role: 'super_admin',
  isBanned: 0
};

function authenticate(req, res, next) {
  // Direct PIN 1234 check via header
  if (req.headers['x-admin-pin'] === '1234') {
    req.user = ROOT_ADMIN;
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split(' ')[1] 
    : (req.query && req.query.token);

  if (!token) {
    return res.status(401).json({ error: 'Tizimga kirish talab etiladi. Token topilmadi.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.id === 'admin_root' || decoded.role === 'admin' || decoded.role === 'super_admin') {
      req.user = ROOT_ADMIN;
      return next();
    }

    const user = db.prepare('SELECT id, email, username, name, avatar, role, isBanned FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Foydalanuvchi hisobi topilmadi.' });
    }

    if (user.isBanned === 1) {
      return res.status(403).json({ error: 'Sizning hisobingiz administrator tomonidan bloklangan.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Yaroqsiz yoki muddati o‘tgan seans. Qaytadan kiring.' });
  }
}

function optionalAuth(req, res, next) {
  if (req.headers['x-admin-pin'] === '1234') {
    req.user = ROOT_ADMIN;
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split(' ')[1] 
    : (req.query && req.query.token);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.id === 'admin_root') {
      req.user = ROOT_ADMIN;
      return next();
    }
    const user = db.prepare('SELECT id, email, username, name, avatar, role, isBanned FROM users WHERE id = ?').get(decoded.id);
    req.user = (user && user.isBanned !== 1) ? user : null;
  } catch (err) {
    req.user = null;
  }
  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Avval tizimga kiring.' });
    }

    if (req.user.id === 'admin_root' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'Ushbu amalni bajarish uchun ruxsat yetarli emas.' });
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireAuth: authenticate,
  requireSuperAdmin: [authenticate, requireRole(['super_admin'])],
  requireAdmin: [authenticate, requireRole(['super_admin', 'admin'])],
  requireModerator: [authenticate, requireRole(['super_admin', 'admin', 'moderator'])],
  JWT_SECRET,
  ROOT_ADMIN
};

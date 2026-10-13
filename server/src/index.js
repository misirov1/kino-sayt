require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth.routes');
const moviesRoutes = require('./routes/movies.routes');
const roomsRoutes = require('./routes/rooms.routes');
const uploadRoutes = require('./routes/upload.routes');
const adminRoutes = require('./routes/admin.routes');
const socialRoutes = require('./routes/social.routes');

const { initRoomSocket } = require('./socket/roomSocket');
const { startCleanupCron } = require('./services/cleanupService');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder if needed
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/social', socialRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'Kinoverse O‘zbekiston',
    timestamp: new Date().toISOString()
  });
});

// Serve static frontend build
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const indexHtmlPath = path.resolve(clientDistPath, 'index.html');
app.use(express.static(clientDistPath));

// Fallback all other routes to index.html for client-side routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
    return next();
  }
  if (fs.existsSync(indexHtmlPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(fs.readFileSync(indexHtmlPath, 'utf8'));
  }
  res.status(404).send('Frontend build topilmadi.');
});

// Initialize Socket.IO Handlers
initRoomSocket(io);

// Start Background Cleanup Worker (every 60 mins)
startCleanupCron(60);

// Start HTTP Server
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 KINO PLATFORMASI SERVERI ISHGA TUSHDI!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🎬 Socket.IO va Virtual Kino Xonasi tayyor`);
  console.log(`===============================================`);
});

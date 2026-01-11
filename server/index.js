const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const songsRoutes = require('./routes/songs');
const lyricsRoutes = require('./routes/lyrics');
const progressRoutes = require('./routes/progress');
const usersRoutes = require('./routes/users');

app.use('/api/songs', songsRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '팝송 학습 API 서버가 정상 작동 중입니다.',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '팝송 학습 API에 오신 것을 환영합니다! 🎵',
    version: '1.0.0',
    endpoints: {
      songs: '/api/songs',
      lyrics: '/api/lyrics',
      progress: '/api/progress',
      users: '/api/users',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: '요청하신 엔드포인트를 찾을 수 없습니다.',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('서버 오류:', err.stack);
  res.status(500).json({ 
    error: '서버 내부 오류가 발생했습니다.',
    message: err.message 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║  🎵 팝송 학습 API 서버 시작됨             ║
  ║  📡 포트: ${PORT}                          ║
  ║  🌐 Local: http://localhost:${PORT}       ║
  ║  🌐 External: http://knhanul.duckdns.org:${PORT} ║
  ║  📚 API Docs: http://localhost:${PORT}/api║
  ╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;

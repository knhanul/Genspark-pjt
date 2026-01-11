const express = require('express');
const router = express.Router();
const db = require('../db');

// 모든 곡 조회
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.*,
        COUNT(DISTINCT l.id) as total_lyrics,
        AVG(CASE WHEN up.is_mastered THEN 1 ELSE 0 END) * 100 as avg_progress
      FROM songs s
      LEFT JOIN lyrics l ON s.id = l.song_id
      LEFT JOIN user_progress up ON l.id = up.lyric_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('곡 조회 오류:', err);
    res.status(500).json({ error: '곡 목록을 가져오는데 실패했습니다.' });
  }
});

// 특정 곡 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM songs WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '곡을 찾을 수 없습니다.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('곡 상세 조회 오류:', err);
    res.status(500).json({ error: '곡 정보를 가져오는데 실패했습니다.' });
  }
});

// 새 곡 추가
router.post('/', async (req, res) => {
  try {
    const { title, artist, youtube_url, youtube_id, thumbnail_url, duration, difficulty_level, genre } = req.body;
    
    if (!title || !artist || !youtube_url || !youtube_id) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }
    
    const result = await db.query(
      `INSERT INTO songs (title, artist, youtube_url, youtube_id, thumbnail_url, duration, difficulty_level, genre)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, artist, youtube_url, youtube_id, thumbnail_url, duration, difficulty_level || 'intermediate', genre]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('곡 추가 오류:', err);
    res.status(500).json({ error: '곡을 추가하는데 실패했습니다.' });
  }
});

// 곡 정보 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, youtube_url, youtube_id, thumbnail_url, duration, difficulty_level, genre } = req.body;
    
    const result = await db.query(
      `UPDATE songs 
       SET title = COALESCE($1, title),
           artist = COALESCE($2, artist),
           youtube_url = COALESCE($3, youtube_url),
           youtube_id = COALESCE($4, youtube_id),
           thumbnail_url = COALESCE($5, thumbnail_url),
           duration = COALESCE($6, duration),
           difficulty_level = COALESCE($7, difficulty_level),
           genre = COALESCE($8, genre),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [title, artist, youtube_url, youtube_id, thumbnail_url, duration, difficulty_level, genre, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '곡을 찾을 수 없습니다.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('곡 수정 오류:', err);
    res.status(500).json({ error: '곡 정보를 수정하는데 실패했습니다.' });
  }
});

// 곡 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM songs WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '곡을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '곡이 삭제되었습니다.', song: result.rows[0] });
  } catch (err) {
    console.error('곡 삭제 오류:', err);
    res.status(500).json({ error: '곡을 삭제하는데 실패했습니다.' });
  }
});

// 곡별 가사 조회 (편의 라우트)
router.get('/:id/lyrics', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT l.*, 
              COALESCE(up.is_mastered, false) as is_mastered,
              COALESCE(up.practice_count, 0) as practice_count
       FROM lyrics l
       LEFT JOIN user_progress up ON l.id = up.lyric_id AND up.user_id = $2
       WHERE l.song_id = $1
       ORDER BY l.line_number`,
      [id, req.query.user_id || 1] // 기본 사용자 ID = 1
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('가사 조회 오류:', err);
    res.status(500).json({ error: '가사를 가져오는데 실패했습니다.' });
  }
});

module.exports = router;

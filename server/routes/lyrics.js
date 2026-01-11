const express = require('express');
const router = express.Router();
const db = require('../db');

// 특정 곡의 모든 가사 조회
router.get('/song/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    const userId = req.query.user_id || 1; // 기본 사용자 ID
    
    const result = await db.query(
      `SELECT l.*,
              up.is_mastered,
              up.practice_count,
              up.last_practiced_at
       FROM lyrics l
       LEFT JOIN user_progress up ON l.id = up.lyric_id AND up.user_id = $2
       WHERE l.song_id = $1
       ORDER BY l.line_number`,
      [songId, userId]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('가사 조회 오류:', err);
    res.status(500).json({ error: '가사를 가져오는데 실패했습니다.' });
  }
});

// 특정 가사 ID로 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM lyrics WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '가사를 찾을 수 없습니다.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('가사 조회 오류:', err);
    res.status(500).json({ error: '가사를 가져오는데 실패했습니다.' });
  }
});

// 새 가사 추가
router.post('/', async (req, res) => {
  try {
    const { song_id, line_number, text, start_time, end_time, translation } = req.body;
    
    if (!song_id || !line_number || !text) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }
    
    const result = await db.query(
      `INSERT INTO lyrics (song_id, line_number, text, start_time, end_time, translation)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [song_id, line_number, text, start_time, end_time, translation]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('가사 추가 오류:', err);
    res.status(500).json({ error: '가사를 추가하는데 실패했습니다.' });
  }
});

// 여러 가사 한번에 추가 (배치)
router.post('/batch', async (req, res) => {
  try {
    const { song_id, lyrics } = req.body;
    
    if (!song_id || !Array.isArray(lyrics) || lyrics.length === 0) {
      return res.status(400).json({ error: '잘못된 요청 형식입니다.' });
    }
    
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const insertedLyrics = [];
      for (const lyric of lyrics) {
        const result = await client.query(
          `INSERT INTO lyrics (song_id, line_number, text, start_time, end_time, translation)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [song_id, lyric.line_number, lyric.text, lyric.start_time, lyric.end_time, lyric.translation]
        );
        insertedLyrics.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      res.status(201).json(insertedLyrics);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('가사 배치 추가 오류:', err);
    res.status(500).json({ error: '가사를 추가하는데 실패했습니다.' });
  }
});

// 가사 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, start_time, end_time, translation, line_number } = req.body;
    
    const result = await db.query(
      `UPDATE lyrics
       SET text = COALESCE($1, text),
           start_time = COALESCE($2, start_time),
           end_time = COALESCE($3, end_time),
           translation = COALESCE($4, translation),
           line_number = COALESCE($5, line_number)
       WHERE id = $6
       RETURNING *`,
      [text, start_time, end_time, translation, line_number, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '가사를 찾을 수 없습니다.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('가사 수정 오류:', err);
    res.status(500).json({ error: '가사를 수정하는데 실패했습니다.' });
  }
});

// 가사 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM lyrics WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '가사를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '가사가 삭제되었습니다.', lyric: result.rows[0] });
  } catch (err) {
    console.error('가사 삭제 오류:', err);
    res.status(500).json({ error: '가사를 삭제하는데 실패했습니다.' });
  }
});

module.exports = router;

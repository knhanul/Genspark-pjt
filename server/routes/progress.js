const express = require('express');
const router = express.Router();
const db = require('../db');

// 사용자별 전체 학습 진도 조회
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await db.query(
      `SELECT 
         up.*,
         l.text,
         l.line_number,
         s.title,
         s.artist
       FROM user_progress up
       JOIN lyrics l ON up.lyric_id = l.id
       JOIN songs s ON l.song_id = s.id
       WHERE up.user_id = $1
       ORDER BY s.id, l.line_number`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('진도 조회 오류:', err);
    res.status(500).json({ error: '학습 진도를 가져오는데 실패했습니다.' });
  }
});

// 특정 곡의 사용자 학습 진도 조회
router.get('/user/:userId/song/:songId', async (req, res) => {
  try {
    const { userId, songId } = req.params;
    
    const result = await db.query(
      `SELECT 
         l.id as lyric_id,
         l.line_number,
         l.text,
         l.start_time,
         l.end_time,
         l.translation,
         COALESCE(up.is_mastered, false) as is_mastered,
         COALESCE(up.practice_count, 0) as practice_count,
         up.last_practiced_at
       FROM lyrics l
       LEFT JOIN user_progress up ON l.id = up.lyric_id AND up.user_id = $1
       WHERE l.song_id = $2
       ORDER BY l.line_number`,
      [userId, songId]
    );
    
    // 통계 계산
    const stats = await db.query(
      `SELECT 
         COUNT(*) as total_lines,
         COUNT(CASE WHEN up.is_mastered THEN 1 END) as mastered_lines,
         ROUND(
           (COUNT(CASE WHEN up.is_mastered THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
           2
         ) as progress_percentage,
         SUM(COALESCE(up.practice_count, 0)) as total_practice_count
       FROM lyrics l
       LEFT JOIN user_progress up ON l.id = up.lyric_id AND up.user_id = $1
       WHERE l.song_id = $2`,
      [userId, songId]
    );
    
    res.json({
      lyrics: result.rows,
      stats: stats.rows[0]
    });
  } catch (err) {
    console.error('곡별 진도 조회 오류:', err);
    res.status(500).json({ error: '학습 진도를 가져오는데 실패했습니다.' });
  }
});

// 학습 진도 업데이트 (마스터 상태, 연습 횟수)
router.post('/', async (req, res) => {
  try {
    const { user_id, lyric_id, is_mastered, increment_practice } = req.body;
    
    if (!user_id || !lyric_id) {
      return res.status(400).json({ error: '사용자 ID와 가사 ID가 필요합니다.' });
    }
    
    // UPSERT (INSERT OR UPDATE)
    const result = await db.query(
      `INSERT INTO user_progress (user_id, lyric_id, is_mastered, practice_count, last_practiced_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, lyric_id)
       DO UPDATE SET
         is_mastered = COALESCE($3, user_progress.is_mastered),
         practice_count = user_progress.practice_count + $4,
         last_practiced_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, lyric_id, is_mastered, increment_practice ? 1 : 0]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('진도 업데이트 오류:', err);
    res.status(500).json({ error: '학습 진도를 업데이트하는데 실패했습니다.' });
  }
});

// 마스터 상태 토글
router.put('/toggle-master', async (req, res) => {
  try {
    const { user_id, lyric_id } = req.body;
    
    if (!user_id || !lyric_id) {
      return res.status(400).json({ error: '사용자 ID와 가사 ID가 필요합니다.' });
    }
    
    const result = await db.query(
      `INSERT INTO user_progress (user_id, lyric_id, is_mastered, practice_count, last_practiced_at)
       VALUES ($1, $2, true, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, lyric_id)
       DO UPDATE SET
         is_mastered = NOT user_progress.is_mastered,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, lyric_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('마스터 상태 토글 오류:', err);
    res.status(500).json({ error: '마스터 상태를 변경하는데 실패했습니다.' });
  }
});

// 연습 횟수 증가
router.post('/practice', async (req, res) => {
  try {
    const { user_id, lyric_id } = req.body;
    
    if (!user_id || !lyric_id) {
      return res.status(400).json({ error: '사용자 ID와 가사 ID가 필요합니다.' });
    }
    
    const result = await db.query(
      `INSERT INTO user_progress (user_id, lyric_id, practice_count, last_practiced_at)
       VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, lyric_id)
       DO UPDATE SET
         practice_count = user_progress.practice_count + 1,
         last_practiced_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, lyric_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('연습 횟수 증가 오류:', err);
    res.status(500).json({ error: '연습 횟수를 증가시키는데 실패했습니다.' });
  }
});

// 특정 진도 삭제 (리셋)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM user_progress WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '진도 정보를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '진도 정보가 삭제되었습니다.', progress: result.rows[0] });
  } catch (err) {
    console.error('진도 삭제 오류:', err);
    res.status(500).json({ error: '진도 정보를 삭제하는데 실패했습니다.' });
  }
});

// 곡별 진도 리셋
router.delete('/user/:userId/song/:songId', async (req, res) => {
  try {
    const { userId, songId } = req.params;
    
    const result = await db.query(
      `DELETE FROM user_progress 
       WHERE user_id = $1 
       AND lyric_id IN (
         SELECT id FROM lyrics WHERE song_id = $2
       )
       RETURNING *`,
      [userId, songId]
    );
    
    res.json({ 
      message: '곡의 진도가 초기화되었습니다.', 
      deleted_count: result.rows.length 
    });
  } catch (err) {
    console.error('곡별 진도 리셋 오류:', err);
    res.status(500).json({ error: '진도를 초기화하는데 실패했습니다.' });
  }
});

module.exports = router;

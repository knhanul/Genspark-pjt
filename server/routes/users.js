const express = require('express');
const router = express.Router();
const db = require('../db');

// 모든 사용자 조회
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('사용자 조회 오류:', err);
    res.status(500).json({ error: '사용자 목록을 가져오는데 실패했습니다.' });
  }
});

// 특정 사용자 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('사용자 조회 오류:', err);
    res.status(500).json({ error: '사용자 정보를 가져오는데 실패했습니다.' });
  }
});

// 새 사용자 추가
router.post('/', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ error: '사용자명과 이메일이 필요합니다.' });
    }
    
    const result = await db.query(
      'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *',
      [username, email]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('사용자 추가 오류:', err);
    if (err.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: '이미 존재하는 사용자명 또는 이메일입니다.' });
    } else {
      res.status(500).json({ error: '사용자를 추가하는데 실패했습니다.' });
    }
  }
});

// 사용자 정보 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;
    
    const result = await db.query(
      `UPDATE users 
       SET username = COALESCE($1, username),
           email = COALESCE($2, email)
       WHERE id = $3
       RETURNING *`,
      [username, email, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('사용자 수정 오류:', err);
    res.status(500).json({ error: '사용자 정보를 수정하는데 실패했습니다.' });
  }
});

// 사용자 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '사용자가 삭제되었습니다.', user: result.rows[0] });
  } catch (err) {
    console.error('사용자 삭제 오류:', err);
    res.status(500).json({ error: '사용자를 삭제하는데 실패했습니다.' });
  }
});

module.exports = router;

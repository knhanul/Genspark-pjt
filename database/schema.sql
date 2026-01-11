-- 팝송 학습 애플리케이션 데이터베이스 스키마

-- 데이터베이스 생성 (이미 생성되어 있다면 스킵)
-- CREATE DATABASE popsongs_db;

-- 기존 테이블 삭제 (초기화용)
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS lyrics CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 곡 테이블
CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(100) NOT NULL,
    youtube_url VARCHAR(500) NOT NULL,
    youtube_id VARCHAR(50) NOT NULL,
    thumbnail_url VARCHAR(500),
    duration INTEGER, -- 초 단위
    difficulty_level VARCHAR(20) DEFAULT 'intermediate', -- beginner, intermediate, advanced
    genre VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 가사 테이블 (구절별)
CREATE TABLE lyrics (
    id SERIAL PRIMARY KEY,
    song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL, -- 가사 순서
    text TEXT NOT NULL, -- 가사 텍스트
    start_time DECIMAL(10,2), -- 시작 시간 (초)
    end_time DECIMAL(10,2), -- 종료 시간 (초)
    translation TEXT, -- 한글 번역 (선택)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(song_id, line_number)
);

-- 학습 진도 테이블
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lyric_id INTEGER NOT NULL REFERENCES lyrics(id) ON DELETE CASCADE,
    is_mastered BOOLEAN DEFAULT FALSE, -- 마스터 여부
    practice_count INTEGER DEFAULT 0, -- 연습 횟수
    last_practiced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lyric_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_songs_artist ON songs(artist);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_lyrics_song_id ON lyrics(song_id);
CREATE INDEX idx_lyrics_line_number ON lyrics(song_id, line_number);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_lyric_id ON user_progress(lyric_id);

-- 샘플 데이터 삽입
INSERT INTO users (username, email) VALUES 
('demo_user', 'demo@example.com'),
('test_user', 'test@example.com');

-- 샘플 곡 데이터
INSERT INTO songs (title, artist, youtube_url, youtube_id, thumbnail_url, duration, difficulty_level, genre) VALUES 
(
    'Imagine',
    'John Lennon',
    'https://www.youtube.com/watch?v=YkgkThdzX-8',
    'YkgkThdzX-8',
    'https://img.youtube.com/vi/YkgkThdzX-8/maxresdefault.jpg',
    183,
    'beginner',
    'Classic Rock'
),
(
    'Shape of You',
    'Ed Sheeran',
    'https://www.youtube.com/watch?v=JGwWNGJdvx8',
    'JGwWNGJdvx8',
    'https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg',
    234,
    'intermediate',
    'Pop'
),
(
    'Someone Like You',
    'Adele',
    'https://www.youtube.com/watch?v=hLQl3WQQoQ0',
    'hLQl3WQQoQ0',
    'https://img.youtube.com/vi/hLQl3WQQoQ0/maxresdefault.jpg',
    285,
    'intermediate',
    'Pop Ballad'
);

-- Imagine 가사 샘플
INSERT INTO lyrics (song_id, line_number, text, start_time, end_time, translation) VALUES 
(1, 1, 'Imagine there''s no heaven', 14.5, 18.0, '천국이 없다고 상상해봐요'),
(1, 2, 'It''s easy if you try', 18.0, 21.5, '노력하면 쉬워요'),
(1, 3, 'No hell below us', 21.5, 24.5, '우리 아래 지옥도 없고'),
(1, 4, 'Above us only sky', 24.5, 28.0, '우리 위엔 오직 하늘만'),
(1, 5, 'Imagine all the people', 28.0, 32.0, '모든 사람들이'),
(1, 6, 'Living for today', 32.0, 36.0, '오늘을 위해 산다고 상상해봐요');

-- Shape of You 가사 샘플
INSERT INTO lyrics (song_id, line_number, text, start_time, end_time, translation) VALUES 
(2, 1, 'The club isn''t the best place to find a lover', 8.0, 11.5, '클럽은 연인을 찾기에 최고의 장소가 아니에요'),
(2, 2, 'So the bar is where I go', 11.5, 14.0, '그래서 난 바에 가죠'),
(2, 3, 'Me and my friends at the table doing shots', 14.0, 17.5, '나와 내 친구들은 테이블에서 술을 마시고'),
(2, 4, 'Drinking fast and then we talk slow', 17.5, 20.5, '빨리 마시고 천천히 얘기해요');

-- Someone Like You 가사 샘플
INSERT INTO lyrics (song_id, line_number, text, start_time, end_time, translation) VALUES 
(3, 1, 'I heard that you''re settled down', 12.0, 16.5, '당신이 정착했다고 들었어요'),
(3, 2, 'That you found a girl and you''re married now', 16.5, 21.0, '여자를 만나 결혼했다고'),
(3, 3, 'I heard that your dreams came true', 21.0, 25.5, '당신의 꿈이 이루어졌다고 들었어요'),
(3, 4, 'Guess she gave you things I didn''t give to you', 25.5, 30.0, '그녀가 내가 주지 못한 걸 줬나봐요');

-- 샘플 학습 진도 데이터
INSERT INTO user_progress (user_id, lyric_id, is_mastered, practice_count, last_practiced_at) VALUES 
(1, 1, true, 10, NOW()),
(1, 2, true, 8, NOW()),
(1, 3, false, 3, NOW()),
(1, 4, false, 2, NOW());

-- 뷰 생성: 곡별 학습 진행률
CREATE OR REPLACE VIEW song_progress_view AS
SELECT 
    s.id as song_id,
    s.title,
    s.artist,
    up.user_id,
    COUNT(l.id) as total_lines,
    COUNT(CASE WHEN up.is_mastered THEN 1 END) as mastered_lines,
    ROUND(
        (COUNT(CASE WHEN up.is_mastered THEN 1 END)::DECIMAL / COUNT(l.id)) * 100, 
        2
    ) as progress_percentage
FROM songs s
LEFT JOIN lyrics l ON s.id = l.song_id
LEFT JOIN user_progress up ON l.id = up.lyric_id
GROUP BY s.id, s.title, s.artist, up.user_id;

COMMENT ON TABLE songs IS '팝송 정보 테이블';
COMMENT ON TABLE lyrics IS '가사 구절별 정보 테이블';
COMMENT ON TABLE user_progress IS '사용자별 학습 진도 테이블';
COMMENT ON TABLE users IS '사용자 정보 테이블';

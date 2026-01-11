import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import axios from 'axios';
import './LearningPlayer.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function LearningPlayer({ song, userId, onBack }) {
  const [lyrics, setLyrics] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hideMode, setHideMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const playerRef = useRef(null);

  useEffect(() => {
    fetchLyricsAndProgress();
  }, [song.id]);

  useEffect(() => {
    if (playerRef.current && isPlaying) {
      const interval = setInterval(() => {
        const currentTime = playerRef.current.getCurrentTime();
        updateCurrentLyric(currentTime);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, lyrics]);

  const fetchLyricsAndProgress = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/progress/user/${userId}/song/${song.id}`
      );
      setLyrics(response.data.lyrics);
      setStats(response.data.stats);
    } catch (error) {
      console.error('가사 조회 실패:', error);
      alert('가사를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentLyric = (currentTime) => {
    const index = lyrics.findIndex(
      (lyric) => currentTime >= lyric.start_time && currentTime <= lyric.end_time
    );
    if (index !== -1 && index !== currentLyricIndex) {
      setCurrentLyricIndex(index);
    }
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange = (event) => {
    setIsPlaying(event.data === 1); // 1 = playing
    
    // 반복 모드일 때
    if (repeatMode && currentLyricIndex >= 0) {
      const currentLyric = lyrics[currentLyricIndex];
      const currentTime = playerRef.current.getCurrentTime();
      
      if (currentTime >= currentLyric.end_time) {
        playerRef.current.seekTo(currentLyric.start_time);
      }
    }
  };

  const handleLyricClick = async (lyric, index) => {
    if (playerRef.current) {
      playerRef.current.seekTo(lyric.start_time);
      playerRef.current.playVideo();
      setCurrentLyricIndex(index);
      
      // 연습 횟수 증가
      try {
        await axios.post(`${API_URL}/progress/practice`, {
          user_id: userId,
          lyric_id: lyric.lyric_id
        });
      } catch (error) {
        console.error('연습 횟수 업데이트 실패:', error);
      }
    }
  };

  const handleToggleMastered = async (lyric) => {
    try {
      await axios.put(`${API_URL}/progress/toggle-master`, {
        user_id: userId,
        lyric_id: lyric.lyric_id
      });
      
      // 로컬 상태 업데이트
      setLyrics(lyrics.map(l => 
        l.lyric_id === lyric.lyric_id 
          ? { ...l, is_mastered: !l.is_mastered }
          : l
      ));
      
      // 통계 재조회
      fetchLyricsAndProgress();
    } catch (error) {
      console.error('마스터 상태 업데이트 실패:', error);
    }
  };

  const handleRepeatLyric = (lyric, index) => {
    setRepeatMode(!repeatMode);
    setCurrentLyricIndex(index);
    if (playerRef.current) {
      playerRef.current.seekTo(lyric.start_time);
      playerRef.current.playVideo();
    }
  };

  const opts = {
    height: '480',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      modestbranding: 1
    },
  };

  if (loading) {
    return <div className="loading">학습 자료를 준비하는 중</div>;
  }

  return (
    <div className="learning-player">
      <div className="player-header">
        <button className="btn btn-secondary" onClick={onBack}>
          ← 목록으로
        </button>
        <div className="song-header-info">
          <h2>{song.title}</h2>
          <p>{song.artist}</p>
        </div>
        {stats && (
          <div className="stats-badge">
            {stats.mastered_lines}/{stats.total_lines} 마스터
            ({stats.progress_percentage}%)
          </div>
        )}
      </div>

      <div className="player-controls">
        <button
          className={`btn ${hideMode ? 'btn-success' : 'btn-secondary'} btn-small`}
          onClick={() => setHideMode(!hideMode)}
        >
          {hideMode ? '👁️ 가사 보기' : '🙈 가사 숨기기'}
        </button>
        <button
          className={`btn ${repeatMode ? 'btn-success' : 'btn-secondary'} btn-small`}
          onClick={() => setRepeatMode(!repeatMode)}
        >
          {repeatMode ? '🔁 반복 중' : '🔁 반복 모드'}
        </button>
      </div>

      <div className="player-container">
        <div className="video-section">
          <YouTube
            videoId={song.youtube_id}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
          />
        </div>

        <div className="lyrics-section">
          <h3>📝 가사</h3>
          {lyrics.length === 0 ? (
            <div className="empty-lyrics">
              <p>아직 가사가 등록되지 않았습니다.</p>
            </div>
          ) : (
            <div className="lyrics-list">
              {lyrics.map((lyric, index) => (
                <div
                  key={lyric.lyric_id}
                  className={`lyric-item ${
                    index === currentLyricIndex ? 'active' : ''
                  } ${lyric.is_mastered ? 'mastered' : ''}`}
                  onClick={() => handleLyricClick(lyric, index)}
                >
                  <div className="lyric-number">{lyric.line_number}</div>
                  <div className="lyric-content">
                    <div className="lyric-text">
                      {hideMode && !lyric.is_mastered ? '___________' : lyric.text}
                    </div>
                    {lyric.translation && (
                      <div className="lyric-translation">
                        {lyric.translation}
                      </div>
                    )}
                    <div className="lyric-time">
                      {lyric.start_time}s - {lyric.end_time}s
                      {lyric.practice_count > 0 && (
                        <span className="practice-count">
                          🔄 {lyric.practice_count}회 연습
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="lyric-actions">
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRepeatLyric(lyric, index);
                      }}
                      title="이 구절 반복"
                    >
                      🔁
                    </button>
                    <button
                      className={`btn-icon ${lyric.is_mastered ? 'mastered' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMastered(lyric);
                      }}
                      title={lyric.is_mastered ? '마스터 취소' : '마스터 완료'}
                    >
                      {lyric.is_mastered ? '✅' : '⭐'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats && (
        <div className="progress-summary">
          <h3>📊 학습 통계</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.total_lines}</div>
              <div className="stat-label">전체 구절</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.mastered_lines}</div>
              <div className="stat-label">마스터 구절</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.progress_percentage}%</div>
              <div className="stat-label">완료율</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.total_practice_count}</div>
              <div className="stat-label">총 연습 횟수</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LearningPlayer;

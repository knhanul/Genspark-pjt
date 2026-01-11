import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import axios from 'axios';
import TimestampEditor from './TimestampEditor';
import BatchTimestampEditor from './BatchTimestampEditor';
import LyricsForm from './LyricsForm';
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
  const [editMode, setEditMode] = useState(false);
  const [editingLyric, setEditingLyric] = useState(null);
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [showLyricsForm, setShowLyricsForm] = useState(false);
  const playerRef = useRef(null);

  const fetchLyricsAndProgress = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log(`📥 가사 데이터 요청: 곡 ID ${song.id}, 사용자 ID ${userId}`);
      const response = await axios.get(
        `${API_URL}/progress/user/${userId}/song/${song.id}`
      );
      setLyrics(response.data.lyrics);
      setStats(response.data.stats);
      console.log(`✅ 가사 ${response.data.lyrics.length}개 로드 완료`);
      console.log('가사 타임스탬프:', response.data.lyrics.map(l => `${l.line_number}번: ${l.start_time}s-${l.end_time}s`));
    } catch (error) {
      console.error('❌ 가사 조회 실패:', error);
      alert('가사를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId, song.id]);

  const updateCurrentLyric = React.useCallback((currentTime) => {
    const index = lyrics.findIndex(
      (lyric) => currentTime >= lyric.start_time && currentTime <= lyric.end_time
    );
    if (index !== -1 && index !== currentLyricIndex) {
      console.log(`🎵 ${currentTime.toFixed(2)}초 -> 가사 ${index + 1}번 활성화: "${lyrics[index].text}"`);
      setCurrentLyricIndex(index);
      
      // 자동 스크롤
      setTimeout(() => {
        const lyricElement = document.querySelector(`.lyric-item-${index}`);
        if (lyricElement) {
          lyricElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 50);
    }
  }, [lyrics, currentLyricIndex]);

  useEffect(() => {
    fetchLyricsAndProgress();
  }, [fetchLyricsAndProgress]);

  useEffect(() => {
    let interval = null;
    
    if (playerRef.current && isPlaying) {
      console.log('▶️ 재생 시작: 실시간 가사 동기화 활성화');
      interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const currentTime = playerRef.current.getCurrentTime();
          updateCurrentLyric(currentTime);
        }
      }, 100);
    } else if (!isPlaying) {
      console.log('⏸️  일시정지: 가사 동기화 비활성화');
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, updateCurrentLyric]);

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    console.log('✅ YouTube Player 준비 완료');
    console.log(`📊 총 ${lyrics.length}개의 가사 구절 로드됨`);
    console.log('🎬 영상을 재생하면 가사가 자동으로 동기화됩니다!');
  };

  const onPlayerStateChange = (event) => {
    // YouTube Player States: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
    const states = {
      '-1': '준비 중',
      '0': '종료',
      '1': '재생 중',
      '2': '일시정지',
      '3': '버퍼링',
      '5': '대기'
    };
    console.log(`🎬 YouTube 상태: ${states[event.data] || event.data}`);
    
    setIsPlaying(event.data === 1); // 1 = playing
    
    // 반복 모드일 때
    if (repeatMode && currentLyricIndex >= 0 && lyrics[currentLyricIndex]) {
      const currentLyric = lyrics[currentLyricIndex];
      const currentTime = playerRef.current?.getCurrentTime?.() || 0;
      
      if (currentTime >= currentLyric.end_time) {
        console.log(`🔁 반복 모드: ${currentLyric.start_time}초로 이동`);
        playerRef.current.seekTo(currentLyric.start_time);
      }
    }
  };

  const handleLyricClick = async (lyric, index) => {
    if (playerRef.current) {
      console.log(`👆 가사 클릭: ${index + 1}번 "${lyric.text}" (${lyric.start_time}초)`);
      playerRef.current.seekTo(lyric.start_time);
      playerRef.current.playVideo();
      setCurrentLyricIndex(index);
      
      // 연습 횟수 증가
      try {
        await axios.post(`${API_URL}/progress/practice`, {
          user_id: userId,
          lyric_id: lyric.lyric_id
        });
        console.log(`📈 연습 횟수 증가: 가사 ${lyric.lyric_id}`);
      } catch (error) {
        console.error('❌ 연습 횟수 업데이트 실패:', error);
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

  const handleEditTimestamp = (lyric) => {
    console.log('⚙️ 타임스탬프 편집 모드:', lyric);
    setEditingLyric(lyric);
    // 일시정지하지 않음 - 사용자가 자유롭게 영상 조작 가능
  };

  const handleSaveTimestamp = async (updatedLyric) => {
    try {
      console.log('💾 타임스탬프 저장:', updatedLyric);
      await axios.put(`${API_URL}/lyrics/${updatedLyric.id}`, {
        start_time: updatedLyric.start_time,
        end_time: updatedLyric.end_time
      });
      
      setLyrics(lyrics.map(l => 
        l.id === updatedLyric.id 
          ? { ...l, start_time: updatedLyric.start_time, end_time: updatedLyric.end_time }
          : l
      ));
      
      setEditingLyric(null);
      alert('✅ 타임스탬프가 저장되었습니다!');
      console.log('✅ 타임스탬프 저장 완료');
    } catch (error) {
      console.error('❌ 타임스탬프 저장 실패:', error);
      alert('타임스탬프 저장에 실패했습니다.');
    }
  };

  const handleCancelEdit = () => {
    setEditingLyric(null);
  };

  const handleBatchEdit = () => {
    console.log('📋 일괄 편집 모드 활성화');
    setBatchEditMode(true);
  };

  const handleSaveBatchTimestamps = async (editedLyrics) => {
    try {
      console.log(`💾 일괄 저장: ${editedLyrics.length}개 가사`);
      
      // 각 가사를 순차적으로 업데이트
      for (const lyric of editedLyrics) {
        await axios.put(`${API_URL}/lyrics/${lyric.id}`, {
          start_time: lyric.start_time,
          end_time: lyric.end_time
        });
      }
      
      // 로컬 상태 업데이트
      setLyrics(editedLyrics);
      
      setBatchEditMode(false);
      alert(`✅ ${editedLyrics.length}개 가사의 타임스탬프가 저장되었습니다!`);
      console.log('✅ 일괄 저장 완료');
    } catch (error) {
      console.error('❌ 일괄 저장 실패:', error);
      alert('일괄 저장에 실패했습니다.');
    }
  };

  const handleCancelBatchEdit = () => {
    setBatchEditMode(false);
  };

  const handleAddLyrics = () => {
    console.log('📝 가사 등록 모드 활성화');
    setShowLyricsForm(true);
  };

  const handleLyricsFormComplete = () => {
    setShowLyricsForm(false);
    // 가사 목록 새로고침
    fetchLyricsAndProgress();
  };

  const handleLyricsFormCancel = () => {
    setShowLyricsForm(false);
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
        <button
          className={`btn ${editMode ? 'btn-warning' : 'btn-secondary'} btn-small`}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? '⚙️ 편집 중' : '⚙️ 개별 편집'}
        </button>
        <button
          className="btn btn-info btn-small"
          onClick={handleBatchEdit}
        >
          📋 일괄 편집
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
          <div className="lyrics-header">
            <h3>📝 가사</h3>
            <button
              className="btn btn-success btn-small"
              onClick={handleAddLyrics}
            >
              ➕ 가사 등록
            </button>
          </div>
          {lyrics.length === 0 ? (
            <div className="empty-lyrics">
              <div className="empty-icon">📝</div>
              <p>아직 가사가 등록되지 않았습니다.</p>
              <button
                className="btn btn-primary"
                onClick={handleAddLyrics}
              >
                ➕ 가사 등록하기
              </button>
            </div>
            </div>
          ) : (
            <div className="lyrics-list">
              {lyrics.map((lyric, index) => (
                <div
                  key={lyric.lyric_id}
                  className={`lyric-item lyric-item-${index} ${
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
                    {editMode ? (
                      <button
                        className="btn-icon btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTimestamp(lyric);
                        }}
                        title="타임스탬프 편집"
                      >
                        ⚙️
                      </button>
                    ) : (
                      <>
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
                      </>
                    )}
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

      {editingLyric && (
        <TimestampEditor
          lyric={editingLyric}
          playerRef={playerRef}
          onSave={handleSaveTimestamp}
          onCancel={handleCancelEdit}
        />
      )}

      {batchEditMode && (
        <BatchTimestampEditor
          lyrics={lyrics}
          playerRef={playerRef}
          songId={song.id}
          onSave={handleSaveBatchTimestamps}
          onCancel={handleCancelBatchEdit}
        />
      )}

      {showLyricsForm && (
        <LyricsForm
          song={song}
          onComplete={handleLyricsFormComplete}
          onCancel={handleLyricsFormCancel}
        />
      )}
    </div>
  );
}

export default LearningPlayer;

import React, { useState, useEffect } from 'react';
import './BatchTimestampEditor.css';

function BatchTimestampEditor({ lyrics, onSave, onCancel, playerRef, songId }) {
  const [editedLyrics, setEditedLyrics] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    // lyrics를 복사하여 편집 가능한 상태로 만듦
    setEditedLyrics(lyrics.map(lyric => ({
      ...lyric,
      start_time: lyric.start_time || 0,
      end_time: lyric.end_time || 0
    })));
  }, [lyrics]);

  // 실시간으로 YouTube 플레이어의 현재 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [playerRef]);

  const updateLyric = (index, field, value) => {
    const updated = [...editedLyrics];
    updated[index] = {
      ...updated[index],
      [field]: parseFloat(value) || 0
    };
    setEditedLyrics(updated);
  };

  const setCurrentAsStart = (index) => {
    const time = currentTime.toFixed(2);
    updateLyric(index, 'start_time', time);
    console.log(`📍 ${index + 1}번 가사 시작: ${time}초`);
  };

  const setCurrentAsEnd = (index) => {
    const time = currentTime.toFixed(2);
    updateLyric(index, 'end_time', time);
    console.log(`📍 ${index + 1}번 가사 종료: ${time}초`);
  };

  const seekTo = (time) => {
    if (playerRef && playerRef.current && time) {
      playerRef.current.seekTo(parseFloat(time));
    }
  };

  const handleSaveAll = async () => {
    // 유효성 검증
    for (let i = 0; i < editedLyrics.length; i++) {
      const lyric = editedLyrics[i];
      if (lyric.end_time <= lyric.start_time) {
        alert(`${i + 1}번 가사: 종료 시간이 시작 시간보다 커야 합니다!`);
        setSelectedIndex(i);
        return;
      }
    }

    // 저장
    onSave(editedLyrics);
  };

  const autoFillFromPrevious = (index) => {
    if (index === 0) return;
    
    const prev = editedLyrics[index - 1];
    const current = editedLyrics[index];
    
    // 이전 가사의 종료 시간을 현재 가사의 시작 시간으로
    updateLyric(index, 'start_time', prev.end_time);
    
    // 이전 가사와 같은 길이로 설정
    const duration = prev.end_time - prev.start_time;
    updateLyric(index, 'end_time', parseFloat(prev.end_time) + duration);
  };

  return (
    <div className="batch-editor-overlay">
      <div className="batch-editor-modal">
        <div className="modal-header">
          <h3>📋 일괄 타임스탬프 편집</h3>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-body">
          <div className="current-time-display">
            <span className="label">🎬 현재 재생 시간:</span>
            <span className="time">{currentTime.toFixed(2)}초</span>
          </div>

          <div className="help-banner">
            💡 <strong>빠른 편집 팁:</strong>
            <ul>
              <li>영상을 재생하며 각 구절의 시작/종료 시점에 버튼 클릭</li>
              <li>"이전 기준" 버튼으로 연속된 가사 빠르게 설정</li>
              <li>▶️ 버튼으로 설정 확인</li>
            </ul>
          </div>

          <div className="lyrics-batch-list">
            {editedLyrics.map((lyric, index) => (
              <div
                key={lyric.id || index}
                className={`batch-lyric-item ${selectedIndex === index ? 'selected' : ''}`}
              >
                <div className="lyric-header">
                  <div className="lyric-number">{lyric.line_number}</div>
                  <div className="lyric-text-col">
                    <div className="lyric-text">{lyric.text}</div>
                    {lyric.translation && (
                      <div className="lyric-translation">{lyric.translation}</div>
                    )}
                  </div>
                </div>

                <div className="time-controls">
                  <div className="time-row">
                    <label>⏰ 시작</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={lyric.start_time}
                      onChange={(e) => updateLyric(index, 'start_time', e.target.value)}
                      placeholder="0.0"
                    />
                    <button
                      className="btn-set btn-start"
                      onClick={() => setCurrentAsStart(index)}
                      title="현재 시간"
                    >
                      📍
                    </button>
                    <button
                      className="btn-seek"
                      onClick={() => seekTo(lyric.start_time)}
                      title="이동"
                    >
                      ▶️
                    </button>
                  </div>

                  <div className="time-row">
                    <label>⏱️ 종료</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={lyric.end_time}
                      onChange={(e) => updateLyric(index, 'end_time', e.target.value)}
                      placeholder="0.0"
                    />
                    <button
                      className="btn-set btn-end"
                      onClick={() => setCurrentAsEnd(index)}
                      title="현재 시간"
                    >
                      📍
                    </button>
                    <button
                      className="btn-seek"
                      onClick={() => seekTo(lyric.end_time)}
                      title="이동"
                    >
                      ▶️
                    </button>
                  </div>

                  {index > 0 && (
                    <button
                      className="btn-auto"
                      onClick={() => autoFillFromPrevious(index)}
                      title="이전 가사 기준으로 자동 설정"
                    >
                      ⬇️ 이전 기준
                    </button>
                  )}

                  <div className="duration-display">
                    구간: {(lyric.end_time - lyric.start_time).toFixed(2)}초
                    {lyric.end_time <= lyric.start_time && (
                      <span className="error-badge">오류</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleSaveAll}>
            💾 전체 저장 ({editedLyrics.length}개)
          </button>
        </div>
      </div>
    </div>
  );
}

export default BatchTimestampEditor;

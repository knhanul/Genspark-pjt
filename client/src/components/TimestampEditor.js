import React, { useState, useEffect } from 'react';
import './TimestampEditor.css';

function TimestampEditor({ lyric, onSave, onCancel, playerRef }) {
  const [startTime, setStartTime] = useState(lyric.start_time || 0);
  const [endTime, setEndTime] = useState(lyric.end_time || 0);
  const [currentTime, setCurrentTime] = useState(0);

  // 실시간으로 YouTube 플레이어의 현재 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 100); // 0.1초마다 업데이트

    return () => clearInterval(interval);
  }, [playerRef]);

  const handleSave = () => {
    const start = parseFloat(startTime);
    const end = parseFloat(endTime);
    
    if (isNaN(start) || isNaN(end)) {
      alert('시작 시간과 종료 시간을 올바르게 입력해주세요!');
      return;
    }
    
    if (end <= start) {
      alert('종료 시간은 시작 시간보다 커야 합니다!');
      return;
    }
    
    onSave({
      ...lyric,
      start_time: start,
      end_time: end
    });
  };

  const setCurrentAsStart = () => {
    const time = currentTime.toFixed(2);
    setStartTime(time);
    console.log(`📍 시작 시간을 ${time}초로 설정`);
  };

  const setCurrentAsEnd = () => {
    const time = currentTime.toFixed(2);
    setEndTime(time);
    console.log(`📍 종료 시간을 ${time}초로 설정`);
  };

  const seekToStart = () => {
    if (playerRef && playerRef.current && startTime) {
      playerRef.current.seekTo(parseFloat(startTime));
      console.log(`⏩ ${startTime}초로 이동`);
    }
  };

  const seekToEnd = () => {
    if (playerRef && playerRef.current && endTime) {
      playerRef.current.seekTo(parseFloat(endTime));
      console.log(`⏩ ${endTime}초로 이동`);
    }
  };

  const duration = (parseFloat(endTime) - parseFloat(startTime)).toFixed(2);

  return (
    <div className="timestamp-editor-overlay">
      <div className="timestamp-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⏱️ 타임스탬프 편집</h3>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="lyric-preview">
            <div className="lyric-number">{lyric.line_number}</div>
            <div className="lyric-text">{lyric.text}</div>
            {lyric.translation && (
              <div className="lyric-translation">{lyric.translation}</div>
            )}
          </div>

          <div className="current-time-display">
            <span className="label">🎬 현재 재생 시간:</span>
            <span className="time">{currentTime.toFixed(2)}초</span>
          </div>

          <div className="time-input-group">
            <div className="time-input">
              <label>⏰ 시작 시간 (초)</label>
              <div className="input-with-button">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="0.0"
                />
                <button 
                  className="btn-set-current btn-start"
                  onClick={setCurrentAsStart}
                  title="현재 재생 시간을 시작 시간으로 설정"
                >
                  📍 현재 시간
                </button>
                <button 
                  className="btn-seek"
                  onClick={seekToStart}
                  title="이 시간으로 이동하여 확인"
                  disabled={!startTime}
                >
                  ▶️
                </button>
              </div>
            </div>

            <div className="time-input">
              <label>⏱️ 종료 시간 (초)</label>
              <div className="input-with-button">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="0.0"
                />
                <button 
                  className="btn-set-current btn-end"
                  onClick={setCurrentAsEnd}
                  title="현재 재생 시간을 종료 시간으로 설정"
                >
                  📍 현재 시간
                </button>
                <button 
                  className="btn-seek"
                  onClick={seekToEnd}
                  title="이 시간으로 이동하여 확인"
                  disabled={!endTime}
                >
                  ▶️
                </button>
              </div>
            </div>
          </div>

          <div className="time-preview">
            <div className="duration-info">
              <span className="label">⏳ 구간 길이:</span>
              <span className={`value ${duration < 0 ? 'error' : ''}`}>
                {duration}초
              </span>
            </div>
            <div className="range-info">
              {startTime}초 ~ {endTime}초
            </div>
          </div>

          <div className="help-text">
            💡 <strong>사용 방법:</strong>
            <ol>
              <li>YouTube 영상을 해당 구절이 <strong>시작되는 순간</strong>으로 이동 (일시정지 권장)</li>
              <li><strong>"시작 시간"</strong> 옆의 <span className="highlight">📍 현재 시간</span> 버튼 클릭</li>
              <li>영상을 해당 구절이 <strong>끝나는 순간</strong>으로 이동</li>
              <li><strong>"종료 시간"</strong> 옆의 <span className="highlight">📍 현재 시간</span> 버튼 클릭</li>
              <li>▶️ 버튼으로 설정한 시간이 정확한지 확인</li>
              <li>"💾 저장" 버튼 클릭</li>
            </ol>
            <div className="tip">
              <strong>💡 TIP:</strong> 모달 창을 열어둔 채로 YouTube 영상을 자유롭게 조작할 수 있습니다!
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            💾 저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimestampEditor;

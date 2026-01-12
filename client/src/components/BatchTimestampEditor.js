import React, { useState, useEffect } from 'react';
import './BatchTimestampEditor.css';

function BatchTimestampEditor({ lyrics, onSave, onCancel, playerRef, songId }) {
  const [editedLyrics, setEditedLyrics] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    // lyrics를 복사하여 편집 가능한 상태로 만듦
    const mapped = lyrics.map(lyric => ({
      ...lyric,
      start_time: parseFloat(lyric.start_time) || 0,
      end_time: parseFloat(lyric.end_time) || 0
    }));
    setEditedLyrics(mapped);
    
    // 첫 번째 가사 자동 선택
    if (mapped.length > 0) {
      setSelectedIndex(0);
    }
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

  const selectedLyric = selectedIndex !== null ? editedLyrics[selectedIndex] : null;

  const updateSelectedLyric = (field, value) => {
    if (selectedIndex === null) return;
    
    const updated = [...editedLyrics];
    updated[selectedIndex] = {
      ...updated[selectedIndex],
      [field]: parseFloat(value) || 0
    };
    setEditedLyrics(updated);
  };

  const setCurrentAsStart = () => {
    const time = currentTime.toFixed(2);
    updateSelectedLyric('start_time', time);
    console.log(`📍 ${selectedIndex + 1}번 가사 시작: ${time}초`);
  };

  const setCurrentAsEnd = () => {
    const time = currentTime.toFixed(2);
    updateSelectedLyric('end_time', time);
    console.log(`📍 ${selectedIndex + 1}번 가사 종료: ${time}초`);
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
        alert(`${lyric.line_number}번 가사: 종료 시간이 시작 시간보다 커야 합니다!`);
        setSelectedIndex(i);
        return;
      }
    }

    // 저장
    onSave(editedLyrics);
  };

  const duration = selectedLyric 
    ? (parseFloat(selectedLyric.end_time || 0) - parseFloat(selectedLyric.start_time || 0)).toFixed(2)
    : '0.00';
  
  const hasError = selectedLyric && parseFloat(selectedLyric.end_time || 0) <= parseFloat(selectedLyric.start_time || 0);

  return (
    <div className="batch-editor-overlay">
      <div className="batch-editor-modal split-layout">
        <div className="modal-header">
          <h3>📋 일괄 타임스탬프 편집</h3>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-body-split">
          {/* 왼쪽: 가사 리스트 */}
          <div className="lyrics-list-panel">
            <div className="panel-header">
              <h4>📝 가사 목록 ({editedLyrics.length}개)</h4>
            </div>
            <div className="lyrics-scrollable">
              {editedLyrics.map((lyric, index) => (
                <div
                  key={lyric.lyric_id || index}
                  className={`lyric-list-item ${selectedIndex === index ? 'selected' : ''}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <div className="item-number">{lyric.line_number}</div>
                  <div className="item-content">
                    <div className="item-text">{lyric.text}</div>
                    <div className="item-time">
                      {parseFloat(lyric.start_time || 0).toFixed(1)}s - {parseFloat(lyric.end_time || 0).toFixed(1)}s
                      {parseFloat(lyric.end_time || 0) <= parseFloat(lyric.start_time || 0) && (
                        <span className="error-badge">⚠️</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 선택한 가사 편집 패널 */}
          <div className="edit-panel">
            {selectedLyric ? (
              <>
                <div className="panel-header">
                  <h4>⚙️ 타임스탬프 편집</h4>
                  <div className="current-time-badge">
                    🎬 {currentTime.toFixed(2)}초
                  </div>
                </div>

                <div className="edit-content">
                  {/* 선택한 가사 정보 */}
                  <div className="selected-lyric-info">
                    <div className="info-number">#{selectedLyric.line_number}</div>
                    <div className="info-text">{selectedLyric.text}</div>
                    {selectedLyric.translation && (
                      <div className="info-translation">{selectedLyric.translation}</div>
                    )}
                  </div>

                  {/* 시작 시간 편집 */}
                  <div className="time-edit-group">
                    <label className="time-label">⏰ 시작 시간</label>
                    <div className="time-input-row">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={selectedLyric.start_time}
                        onChange={(e) => updateSelectedLyric('start_time', e.target.value)}
                        placeholder="0.0"
                        className="time-input"
                      />
                      <span className="unit">초</span>
                    </div>
                    <div className="time-button-row">
                      <button
                        className="btn-time btn-set-start"
                        onClick={setCurrentAsStart}
                        title="현재 재생 시간으로 설정"
                      >
                        📍 현재 시간 ({currentTime.toFixed(2)}s)
                      </button>
                      <button
                        className="btn-time btn-seek"
                        onClick={() => seekTo(selectedLyric.start_time)}
                        title="이 시간으로 이동"
                      >
                        ▶️ 이동
                      </button>
                    </div>
                  </div>

                  {/* 종료 시간 편집 */}
                  <div className="time-edit-group">
                    <label className="time-label">⏱️ 종료 시간</label>
                    <div className="time-input-row">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={selectedLyric.end_time}
                        onChange={(e) => updateSelectedLyric('end_time', e.target.value)}
                        placeholder="0.0"
                        className="time-input"
                      />
                      <span className="unit">초</span>
                    </div>
                    <div className="time-button-row">
                      <button
                        className="btn-time btn-set-end"
                        onClick={setCurrentAsEnd}
                        title="현재 재생 시간으로 설정"
                      >
                        📍 현재 시간 ({currentTime.toFixed(2)}s)
                      </button>
                      <button
                        className="btn-time btn-seek"
                        onClick={() => seekTo(selectedLyric.end_time)}
                        title="이 시간으로 이동"
                      >
                        ▶️ 이동
                      </button>
                    </div>
                  </div>

                  {/* 구간 정보 */}
                  <div className={`duration-info ${hasError ? 'error' : ''}`}>
                    <div className="info-row">
                      <span className="info-label">구간 길이:</span>
                      <span className="info-value">{duration}초</span>
                    </div>
                    {hasError && (
                      <div className="error-message">
                        ⚠️ 종료 시간이 시작 시간보다 커야 합니다!
                      </div>
                    )}
                  </div>

                  {/* 도움말 */}
                  <div className="help-box">
                    <div className="help-title">💡 빠른 편집 방법</div>
                    <ul className="help-list">
                      <li>영상을 재생하며 각 구절 시작/끝에서 📍 버튼 클릭</li>
                      <li>왼쪽 목록에서 다른 가사를 클릭하여 순차 편집</li>
                      <li>▶️ 버튼으로 설정한 시간 확인</li>
                    </ul>
                  </div>

                  {/* 네비게이션 버튼 */}
                  <div className="navigation-buttons">
                    <button
                      className="btn-nav btn-prev"
                      onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                      disabled={selectedIndex === 0}
                    >
                      ◀ 이전 가사
                    </button>
                    <button
                      className="btn-nav btn-next"
                      onClick={() => setSelectedIndex(Math.min(editedLyrics.length - 1, selectedIndex + 1))}
                      disabled={selectedIndex === editedLyrics.length - 1}
                    >
                      다음 가사 ▶
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-selection">
                <div className="empty-icon">📝</div>
                <p>왼쪽에서 편집할 가사를 선택하세요</p>
              </div>
            )}
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

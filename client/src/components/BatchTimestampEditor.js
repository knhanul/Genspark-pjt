import React, { useState, useEffect } from 'react';
import './BatchTimestampEditor.css';

function BatchTimestampEditor({ lyrics, onSave, onCancel, playerRef, songId }) {
  const [editedLyrics, setEditedLyrics] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  useEffect(() => {
    // lyrics를 복사하여 편집 가능한 상태로 만듦
    const mapped = lyrics.map(lyric => ({
      ...lyric,
      start_time: parseFloat(lyric.start_time) || 0,
      end_time: parseFloat(lyric.end_time) || 0
    }));
    setEditedLyrics(mapped);
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

  const setCurrentTimeToField = (index, field) => {
    const time = currentTime.toFixed(2);
    updateLyric(index, field, time);
    console.log(`📍 ${index + 1}번 가사 ${field === 'start_time' ? '시작' : '종료'}: ${time}초`);
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
        setSelectedRowIndex(i);
        return;
      }
    }

    // 저장
    onSave(editedLyrics);
  };

  return (
    <div className="batch-editor-overlay">
      <div className="batch-editor-modal table-layout">
        <div className="modal-header">
          <div>
            <h3>📋 일괄 타임스탬프 편집</h3>
            <div className="current-time-display">
              🎬 현재 시간: <strong>{currentTime.toFixed(2)}초</strong>
            </div>
          </div>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-body-table">
          <div className="help-text">
            💡 각 행에서 "시작 셋팅" 또는 "종료 셋팅" 버튼을 클릭하면 현재 재생 시간이 자동으로 입력됩니다.
          </div>

          <div className="table-container">
            <table className="lyrics-table">
              <thead>
                <tr>
                  <th className="col-number">순번</th>
                  <th className="col-lyrics">
                    <div>영어가사</div>
                    <div className="sub-header">한국어 번역 내역</div>
                  </th>
                  <th className="col-timestamp">
                    <div>시작시간</div>
                    <div className="sub-header">현재시간 셋팅</div>
                  </th>
                  <th className="col-timestamp">
                    <div>종료시간</div>
                    <div className="sub-header">현재시간 셋팅</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {editedLyrics.map((lyric, index) => {
                  const hasError = parseFloat(lyric.end_time || 0) <= parseFloat(lyric.start_time || 0);
                  
                  return (
                    <tr 
                      key={lyric.lyric_id || index}
                      className={`${selectedRowIndex === index ? 'selected-row' : ''} ${hasError ? 'error-row' : ''}`}
                      onClick={() => setSelectedRowIndex(index)}
                    >
                      {/* 순번 */}
                      <td className="col-number">{lyric.line_number}</td>

                      {/* 가사 */}
                      <td className="col-lyrics">
                        <div className="lyric-english">{lyric.text}</div>
                        {lyric.translation && (
                          <div className="lyric-korean">{lyric.translation}</div>
                        )}
                      </td>

                      {/* 시작 시간 */}
                      <td className="col-timestamp">
                        <div className="timestamp-group">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={lyric.start_time}
                            onChange={(e) => updateLyric(index, 'start_time', e.target.value)}
                            className="time-input-small"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            className="btn-small btn-set-time"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentTimeToField(index, 'start_time');
                            }}
                            title={`현재 시간(${currentTime.toFixed(2)}s)으로 설정`}
                          >
                            시작 셋팅
                          </button>
                        </div>
                      </td>

                      {/* 종료 시간 */}
                      <td className="col-timestamp">
                        <div className="timestamp-group">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={lyric.end_time}
                            onChange={(e) => updateLyric(index, 'end_time', e.target.value)}
                            className="time-input-small"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            className="btn-small btn-set-time"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentTimeToField(index, 'end_time');
                            }}
                            title={`현재 시간(${currentTime.toFixed(2)}s)으로 설정`}
                          >
                            종료 셋팅
                          </button>
                        </div>
                        {hasError && (
                          <div className="error-indicator">⚠️ 오류</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-info">
            총 <strong>{editedLyrics.length}개</strong> 가사
          </div>
          <div className="footer-buttons">
            <button className="btn btn-secondary" onClick={onCancel}>
              취소
            </button>
            <button className="btn btn-primary" onClick={handleSaveAll}>
              💾 전체 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatchTimestampEditor;

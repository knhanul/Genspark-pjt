import React, { useState } from 'react';
import axios from 'axios';
import './LyricsForm.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function LyricsForm({ song, onComplete, onCancel }) {
  const [lyrics, setLyrics] = useState('');
  const [mode, setMode] = useState('auto'); // 'auto' or 'manual'
  const [loading, setLoading] = useState(false);

  const handleAutoSubmit = async () => {
    if (!lyrics.trim()) {
      alert('가사를 입력해주세요!');
      return;
    }

    setLoading(true);
    try {
      // 가사를 줄바꿈으로 분리
      const lines = lyrics.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        alert('유효한 가사가 없습니다!');
        setLoading(false);
        return;
      }

      // 일괄 추가 API 호출
      const lyricsData = lines.map((line, index) => {
        // "시작시간-종료시간 가사 | 번역" 형식 파싱
        const timeMatch = line.match(/^(\d+\.?\d*)-(\d+\.?\d*)\s+(.+?)(?:\s*\|\s*(.+))?$/);
        
        if (timeMatch) {
          const [, start, end, text, translation] = timeMatch;
          return {
            line_number: index + 1,
            text: text.trim(),
            start_time: parseFloat(start),
            end_time: parseFloat(end),
            translation: translation ? translation.trim() : null
          };
        } else {
          // 시간 정보 없이 가사만 입력된 경우
          const parts = line.split('|').map(p => p.trim());
          return {
            line_number: index + 1,
            text: parts[0],
            start_time: null,
            end_time: null,
            translation: parts[1] || null
          };
        }
      });

      const response = await axios.post(`${API_URL}/lyrics/batch`, {
        song_id: song.id,
        lyrics: lyricsData
      });

      console.log(`✅ ${lyricsData.length}개 가사 등록 완료`);
      alert(`✅ ${lyricsData.length}개의 가사가 등록되었습니다!`);
      onComplete();
    } catch (error) {
      console.error('❌ 가사 등록 실패:', error);
      alert('가사 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lyrics-form-overlay">
      <div className="lyrics-form-modal">
        <div className="modal-header">
          <h3>📝 가사 등록</h3>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-body">
          <div className="song-info">
            <h4>{song.title}</h4>
            <p>{song.artist}</p>
          </div>

          <div className="mode-selector">
            <button
              className={`mode-btn ${mode === 'auto' ? 'active' : ''}`}
              onClick={() => setMode('auto')}
            >
              📋 텍스트 입력
            </button>
            <button
              className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
              onClick={() => setMode('manual')}
            >
              ⚙️ 수동 입력 (고급)
            </button>
          </div>

          {mode === 'auto' ? (
            <div className="auto-mode">
              <div className="help-text">
                <h4>💡 입력 형식</h4>
                <div className="format-examples">
                  <div className="format-item">
                    <strong>시간 정보 포함:</strong>
                    <code>14.5-18.0 Imagine there's no heaven | 천국이 없다고 상상해봐요</code>
                  </div>
                  <div className="format-item">
                    <strong>가사만:</strong>
                    <code>Imagine there's no heaven | 천국이 없다고 상상해봐요</code>
                  </div>
                  <div className="format-item">
                    <strong>번역 없이:</strong>
                    <code>14.5-18.0 Imagine there's no heaven</code>
                  </div>
                </div>
                <ul>
                  <li>한 줄에 한 구절씩 입력</li>
                  <li>시작시간-종료시간 가사 | 번역 형식</li>
                  <li>시간 정보는 나중에 [일괄 편집]으로 추가 가능</li>
                  <li>| 뒤에 한글 번역 (선택사항)</li>
                </ul>
              </div>

              <textarea
                className="lyrics-input"
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="예시:
14.5-18.0 Imagine there's no heaven | 천국이 없다고 상상해봐요
18.0-21.5 It's easy if you try | 노력하면 쉬워요
21.5-24.5 No hell below us | 우리 아래 지옥도 없고

또는 시간 없이:
Imagine there's no heaven | 천국이 없다고 상상해봐요
It's easy if you try | 노력하면 쉬워요"
                rows={15}
              />

              <div className="preview-info">
                입력된 줄 수: <strong>{lyrics.split('\n').filter(l => l.trim()).length}개</strong>
              </div>
            </div>
          ) : (
            <div className="manual-mode">
              <div className="help-text">
                <h4>⚙️ 수동 입력 모드</h4>
                <p>이 기능은 추후 구현 예정입니다.</p>
                <p>현재는 <strong>📋 텍스트 입력</strong> 모드를 사용해주세요.</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            취소
          </button>
          {mode === 'auto' && (
            <button
              className="btn btn-primary"
              onClick={handleAutoSubmit}
              disabled={loading}
            >
              {loading ? '등록 중...' : '📤 등록하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LyricsForm;

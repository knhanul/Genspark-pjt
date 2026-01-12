import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './LyricsGridEditor.css';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function LyricsGridEditor({ song, onClose, playerRef, onSave }) {
  const [rowData, setRowData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const gridRef = useRef();

  // 컬럼 정의
  const columnDefs = [
    {
      headerName: '순번',
      field: 'line_number',
      width: 80,
      editable: false,
      cellStyle: { fontWeight: 'bold', textAlign: 'center' }
    },
    {
      headerName: '영어 가사',
      field: 'text',
      width: 300,
      editable: true,
      cellStyle: { whiteSpace: 'normal', lineHeight: '1.5' }
    },
    {
      headerName: '한국어 번역',
      field: 'translation',
      width: 300,
      editable: true,
      cellStyle: { whiteSpace: 'normal', lineHeight: '1.5', color: '#6c757d' }
    },
    {
      headerName: '시작 시간(초)',
      field: 'start_time',
      width: 150,
      editable: true,
      valueParser: (params) => {
        const value = parseFloat(params.newValue);
        return isNaN(value) ? 0 : value;
      },
      cellStyle: (params) => {
        const isValid = validateStartTime(params.data, params.node.rowIndex);
        return {
          backgroundColor: isValid ? 'white' : '#ffe0e0',
          textAlign: 'center',
          fontWeight: '600'
        };
      }
    },
    {
      headerName: '종료 시간(초)',
      field: 'end_time',
      width: 150,
      editable: true,
      valueParser: (params) => {
        const value = parseFloat(params.newValue);
        return isNaN(value) ? 0 : value;
      },
      cellStyle: (params) => {
        const isValid = validateEndTime(params.data, params.node.rowIndex);
        return {
          backgroundColor: isValid ? 'white' : '#ffe0e0',
          textAlign: 'center',
          fontWeight: '600'
        };
      }
    }
  ];

  // 그리드 기본 설정
  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: false,
    wrapText: true,
    autoHeight: true
  };

  // 데이터 로드
  useEffect(() => {
    loadLyrics();
  }, [song]);

  // 실시간 현재 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [playerRef]);

  const loadLyrics = async () => {
    try {
      const response = await axios.get(`${API_URL}/lyrics/song/${song.id}`);
      const lyrics = response.data.map((lyric, index) => ({
        lyric_id: lyric.lyric_id || null,
        line_number: lyric.line_number || index + 1,
        text: lyric.text || '',
        translation: lyric.translation || '',
        start_time: parseFloat(lyric.start_time) || 0,
        end_time: parseFloat(lyric.end_time) || 0,
        song_id: song.id
      }));
      setRowData(lyrics);
    } catch (error) {
      console.error('가사 로드 실패:', error);
      setRowData([]);
    }
  };

  // 유효성 검증 함수들
  const validateStartTime = (rowData, rowIndex) => {
    const allRows = gridRef.current?.api?.getModel()?.rowsToDisplay?.map(row => row.data) || [];
    const currentRow = allRows[rowIndex];
    if (!currentRow) return true;

    const startTime = parseFloat(currentRow.start_time || 0);
    const endTime = parseFloat(currentRow.end_time || 0);

    // 종료 시간보다 시작 시간이 크면 안됨
    if (endTime > 0 && startTime >= endTime) return false;

    // 이전 행의 종료 시간보다 작으면 안됨
    if (rowIndex > 0) {
      const prevRow = allRows[rowIndex - 1];
      const prevEndTime = parseFloat(prevRow.end_time || 0);
      if (prevEndTime > 0 && startTime < prevEndTime) return false;
    }

    return true;
  };

  const validateEndTime = (rowData, rowIndex) => {
    const allRows = gridRef.current?.api?.getModel()?.rowsToDisplay?.map(row => row.data) || [];
    const currentRow = allRows[rowIndex];
    if (!currentRow) return true;

    const startTime = parseFloat(currentRow.start_time || 0);
    const endTime = parseFloat(currentRow.end_time || 0);

    // 시작 시간보다 종료 시간이 작으면 안됨
    if (startTime > 0 && endTime <= startTime) return false;

    // 다음 행의 시작 시간보다 크면 안됨
    if (rowIndex < allRows.length - 1) {
      const nextRow = allRows[rowIndex + 1];
      const nextStartTime = parseFloat(nextRow.start_time || 0);
      if (nextStartTime > 0 && endTime > nextStartTime) return false;
    }

    return true;
  };

  // 행 선택 이벤트
  const onSelectionChanged = useCallback(() => {
    const selectedRows = gridRef.current.api.getSelectedRows();
    if (selectedRows.length > 0) {
      setSelectedRow(selectedRows[0]);
    } else {
      setSelectedRow(null);
    }
  }, []);

  // 셀 편집 완료 이벤트
  const onCellValueChanged = useCallback((params) => {
    // 라인 넘버 자동 재정렬
    const allRows = [];
    gridRef.current.api.forEachNode((node) => allRows.push(node.data));
    allRows.forEach((row, index) => {
      row.line_number = index + 1;
    });
    setRowData([...allRows]);
    gridRef.current.api.refreshCells();
  }, []);

  // 하단 컨트롤 버튼들
  const handleAddRow = () => {
    const allRows = [];
    gridRef.current.api.forEachNode((node) => allRows.push(node.data));
    
    const lastRow = allRows[allRows.length - 1];
    const newStartTime = lastRow ? parseFloat(lastRow.end_time || 0) : 0;
    
    const newRow = {
      lyric_id: null,
      line_number: allRows.length + 1,
      text: '',
      translation: '',
      start_time: newStartTime,
      end_time: newStartTime + 5, // 기본 5초
      song_id: song.id
    };
    
    setRowData([...allRows, newRow]);
  };

  const handleDeleteRow = () => {
    if (!selectedRow) {
      alert('삭제할 행을 선택하세요.');
      return;
    }

    const allRows = [];
    gridRef.current.api.forEachNode((node) => allRows.push(node.data));
    const filtered = allRows.filter(row => row.line_number !== selectedRow.line_number);
    
    // 라인 넘버 재정렬
    filtered.forEach((row, index) => {
      row.line_number = index + 1;
    });
    
    setRowData(filtered);
    setSelectedRow(null);
  };

  const handleSetStartTime = () => {
    if (!selectedRow) {
      alert('타임스탬프를 설정할 행을 선택하세요.');
      return;
    }

    const time = parseFloat(currentTime.toFixed(2));
    const allRows = [];
    gridRef.current.api.forEachNode((node) => allRows.push(node.data));
    
    const rowIndex = allRows.findIndex(row => row.line_number === selectedRow.line_number);
    if (rowIndex !== -1) {
      allRows[rowIndex].start_time = time;
      
      // 자동으로 종료 시간 설정 (시작 + 3초)
      if (allRows[rowIndex].end_time <= time) {
        allRows[rowIndex].end_time = time + 3;
      }
      
      setRowData([...allRows]);
      gridRef.current.api.refreshCells();
      console.log(`✅ ${rowIndex + 1}번 가사 시작: ${time}초`);
    }
  };

  const handleSetEndTime = () => {
    if (!selectedRow) {
      alert('타임스탬프를 설정할 행을 선택하세요.');
      return;
    }

    const time = parseFloat(currentTime.toFixed(2));
    const allRows = [];
    gridRef.current.api.forEachNode((node) => allRows.push(node.data));
    
    const rowIndex = allRows.findIndex(row => row.line_number === selectedRow.line_number);
    if (rowIndex !== -1) {
      const startTime = parseFloat(allRows[rowIndex].start_time || 0);
      
      if (time <= startTime) {
        alert('종료 시간은 시작 시간보다 커야 합니다!');
        return;
      }
      
      allRows[rowIndex].end_time = time;
      
      // 다음 행의 시작 시간 자동 조정
      if (rowIndex < allRows.length - 1) {
        if (allRows[rowIndex + 1].start_time < time) {
          allRows[rowIndex + 1].start_time = time;
        }
      }
      
      setRowData([...allRows]);
      gridRef.current.api.refreshCells();
      console.log(`✅ ${rowIndex + 1}번 가사 종료: ${time}초`);
    }
  };

  const handleSeekToStart = () => {
    if (!selectedRow || !playerRef.current) return;
    playerRef.current.seekTo(parseFloat(selectedRow.start_time || 0));
  };

  const handleSeekToEnd = () => {
    if (!selectedRow || !playerRef.current) return;
    playerRef.current.seekTo(parseFloat(selectedRow.end_time || 0));
  };

  const handleChangePlaybackRate = (rate) => {
    if (playerRef.current && playerRef.current.getInternalPlayer) {
      const player = playerRef.current.getInternalPlayer();
      player.setPlaybackRate(rate);
      setPlaybackRate(rate);
    }
  };

  // TSV 다운로드
  const handleDownloadTSV = () => {
    const allRows = [];
    gridRef.current.api.forEachNode((node) => allRows.push(node.data));
    
    const headers = ['순번', '영어가사', '한국어번역', '시작시간', '종료시간'];
    const tsvContent = [
      headers.join('\t'),
      ...allRows.map(row => 
        [row.line_number, row.text, row.translation, row.start_time, row.end_time].join('\t')
      )
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${song.title}_lyrics.tsv`;
    link.click();
  };

  // TSV 임포트
  const handleImportTSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      
      // 헤더 제거
      const dataLines = lines.slice(1).filter(line => line.trim());
      
      const imported = dataLines.map((line, index) => {
        const parts = line.split('\t');
        return {
          lyric_id: null,
          line_number: index + 1,
          text: parts[1] || '',
          translation: parts[2] || '',
          start_time: parseFloat(parts[3]) || 0,
          end_time: parseFloat(parts[4]) || 0,
          song_id: song.id
        };
      });
      
      setRowData(imported);
      alert(`${imported.length}개 가사를 임포트했습니다.`);
    };
    
    reader.readAsText(file);
    event.target.value = ''; // 리셋
  };

  // 전체 저장
  const handleSaveAll = async () => {
    const allRows = [];
    gridRef.current.api.forEachNode((node) => allRows.push(node.data));
    
    // 유효성 검증
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      if (!row.text.trim()) {
        alert(`${row.line_number}번: 영어 가사를 입력하세요.`);
        return;
      }
      if (row.end_time <= row.start_time) {
        alert(`${row.line_number}번: 종료 시간이 시작 시간보다 커야 합니다.`);
        return;
      }
      if (i > 0 && row.start_time < allRows[i - 1].end_time) {
        alert(`${row.line_number}번: 시작 시간이 이전 가사의 종료 시간보다 작습니다.`);
        return;
      }
    }

    try {
      // 기존 가사 삭제 후 재등록
      const lyricsData = allRows.map(row => ({
        line_number: row.line_number,
        text: row.text,
        translation: row.translation,
        start_time: row.start_time,
        end_time: row.end_time
      }));

      await axios.post(`${API_URL}/lyrics/batch`, {
        song_id: song.id,
        lyrics: lyricsData
      });

      alert('가사가 성공적으로 저장되었습니다!');
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="lyrics-grid-overlay">
      <div className="lyrics-grid-modal">
        {/* 헤더 */}
        <div className="grid-header">
          <div className="header-left">
            <h3>📝 가사 편집: {song.title}</h3>
            <div className="current-time-badge">
              🎬 {currentTime.toFixed(2)}초
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 재생 속도 컨트롤 */}
        <div className="playback-controls">
          <label>⚡ 재생 속도:</label>
          <div className="speed-buttons">
            {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
              <button
                key={speed}
                className={`speed-btn ${playbackRate === speed ? 'active' : ''}`}
                onClick={() => handleChangePlaybackRate(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* AG Grid */}
        <div className="ag-theme-alpine grid-container">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="single"
            onSelectionChanged={onSelectionChanged}
            onCellValueChanged={onCellValueChanged}
            domLayout="normal"
            suppressCellFocus={false}
          />
        </div>

        {/* 하단 컨트롤 바 */}
        <div className="grid-controls">
          <div className="control-section">
            <h4>📍 타임스탬프</h4>
            <button className="ctrl-btn btn-start" onClick={handleSetStartTime} disabled={!selectedRow}>
              ⏰ 시작 설정 ({currentTime.toFixed(2)}s)
            </button>
            <button className="ctrl-btn btn-end" onClick={handleSetEndTime} disabled={!selectedRow}>
              ⏱️ 종료 설정 ({currentTime.toFixed(2)}s)
            </button>
            <button className="ctrl-btn btn-seek" onClick={handleSeekToStart} disabled={!selectedRow}>
              ▶️ 시작 이동
            </button>
            <button className="ctrl-btn btn-seek" onClick={handleSeekToEnd} disabled={!selectedRow}>
              ▶️ 종료 이동
            </button>
          </div>

          <div className="control-section">
            <h4>✏️ 편집</h4>
            <button className="ctrl-btn btn-add" onClick={handleAddRow}>
              ➕ 행 추가
            </button>
            <button className="ctrl-btn btn-delete" onClick={handleDeleteRow} disabled={!selectedRow}>
              🗑️ 행 삭제
            </button>
          </div>

          <div className="control-section">
            <h4>📥 가져오기/내보내기</h4>
            <button className="ctrl-btn btn-download" onClick={handleDownloadTSV}>
              📥 TSV 다운로드
            </button>
            <label className="ctrl-btn btn-upload">
              📤 TSV 임포트
              <input
                type="file"
                accept=".tsv,.txt"
                onChange={handleImportTSV}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* 푸터 */}
        <div className="grid-footer">
          <div className="footer-info">
            총 <strong>{rowData.length}</strong>개 가사
            {selectedRow && ` | 선택: ${selectedRow.line_number}번`}
          </div>
          <div className="footer-buttons">
            <button className="btn btn-secondary" onClick={onClose}>
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

export default LyricsGridEditor;

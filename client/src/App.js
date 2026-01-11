import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import SongList from './components/SongList';
import LearningPlayer from './components/LearningPlayer';
import AddSongForm from './components/AddSongForm';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function App() {
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [currentUser] = useState(1); // 기본 사용자 ID
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/songs`);
      setSongs(response.data);
    } catch (error) {
      console.error('곡 목록 조회 실패:', error);
      alert('곡 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSong = (song) => {
    setSelectedSong(song);
    setShowAddForm(false);
  };

  const handleAddSong = async (songData) => {
    try {
      await axios.post(`${API_URL}/songs`, songData);
      alert('곡이 추가되었습니다!');
      fetchSongs();
      setShowAddForm(false);
    } catch (error) {
      console.error('곡 추가 실패:', error);
      alert('곡을 추가하는데 실패했습니다.');
    }
  };

  const handleBack = () => {
    setSelectedSong(null);
    fetchSongs(); // 진도 업데이트 반영을 위해 재조회
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎵 팝송 학습 앱</h1>
        <p>유튜브 영상과 가사로 팝송을 마스터하세요!</p>
      </header>

      <main className="App-main">
        {!selectedSong && !showAddForm && (
          <div className="main-menu">
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              ➕ 새 곡 추가
            </button>
          </div>
        )}

        {showAddForm && (
          <div className="section">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAddForm(false)}
            >
              ← 돌아가기
            </button>
            <AddSongForm onSubmit={handleAddSong} onCancel={() => setShowAddForm(false)} />
          </div>
        )}

        {!selectedSong && !showAddForm && (
          <SongList 
            songs={songs} 
            onSelectSong={handleSelectSong}
            loading={loading}
          />
        )}

        {selectedSong && (
          <LearningPlayer 
            song={selectedSong}
            userId={currentUser}
            onBack={handleBack}
          />
        )}
      </main>

      <footer className="App-footer">
        <p>© 2024 팝송 학습 앱 | Made with ❤️</p>
      </footer>
    </div>
  );
}

export default App;

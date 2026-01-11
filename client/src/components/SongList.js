import React from 'react';
import './SongList.css';

function SongList({ songs, onSelectSong, loading }) {
  if (loading) {
    return <div className="loading">곡 목록을 불러오는 중</div>;
  }

  if (songs.length === 0) {
    return (
      <div className="empty-state">
        <h3>📭 아직 등록된 곡이 없습니다</h3>
        <p>새 곡을 추가하여 학습을 시작하세요!</p>
      </div>
    );
  }

  return (
    <div className="song-list">
      <h2>🎼 곡 목록</h2>
      <div className="song-grid">
        {songs.map((song) => (
          <div 
            key={song.id} 
            className="song-card"
            onClick={() => onSelectSong(song)}
          >
            <div className="song-thumbnail">
              {song.thumbnail_url ? (
                <img src={song.thumbnail_url} alt={song.title} />
              ) : (
                <div className="thumbnail-placeholder">🎵</div>
              )}
            </div>
            <div className="song-info">
              <h3 className="song-title">{song.title}</h3>
              <p className="song-artist">{song.artist}</p>
              <div className="song-meta">
                <span className="badge">{song.difficulty_level || 'intermediate'}</span>
                {song.genre && <span className="badge">{song.genre}</span>}
              </div>
              {song.total_lyrics > 0 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${song.avg_progress || 0}%` }}
                  ></div>
                  <span className="progress-text">
                    {Math.round(song.avg_progress || 0)}% 학습 완료
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SongList;

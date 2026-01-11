import React, { useState } from 'react';
import './AddSongForm.css';

function AddSongForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    youtube_url: '',
    youtube_id: '',
    difficulty_level: 'intermediate',
    genre: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // YouTube URL에서 자동으로 ID 추출
    if (name === 'youtube_url') {
      const youtubeId = extractYouTubeId(value);
      if (youtubeId) {
        setFormData({
          ...formData,
          youtube_url: value,
          youtube_id: youtubeId,
        });
      }
    }
  };

  const extractYouTubeId = (url) => {
    // YouTube URL에서 비디오 ID 추출
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title || !formData.artist || !formData.youtube_url) {
      alert('제목, 아티스트, YouTube URL은 필수 항목입니다.');
      return;
    }

    if (!formData.youtube_id) {
      alert('올바른 YouTube URL을 입력해주세요.');
      return;
    }

    // 썸네일 URL 생성
    const thumbnail_url = `https://img.youtube.com/vi/${formData.youtube_id}/maxresdefault.jpg`;

    onSubmit({
      ...formData,
      thumbnail_url,
    });

    // 폼 초기화
    setFormData({
      title: '',
      artist: '',
      youtube_url: '',
      youtube_id: '',
      difficulty_level: 'intermediate',
      genre: '',
    });
  };

  return (
    <div className="add-song-form">
      <h2>🎵 새 곡 추가</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">곡 제목 *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="예: Imagine"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="artist">아티스트 *</label>
          <input
            type="text"
            id="artist"
            name="artist"
            value={formData.artist}
            onChange={handleChange}
            placeholder="예: John Lennon"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="youtube_url">YouTube URL *</label>
          <input
            type="text"
            id="youtube_url"
            name="youtube_url"
            value={formData.youtube_url}
            onChange={handleChange}
            placeholder="예: https://www.youtube.com/watch?v=YkgkThdzX-8"
            required
          />
          {formData.youtube_id && (
            <small className="form-hint success">
              ✅ YouTube ID: {formData.youtube_id}
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="difficulty_level">난이도</label>
          <select
            id="difficulty_level"
            name="difficulty_level"
            value={formData.difficulty_level}
            onChange={handleChange}
          >
            <option value="beginner">초급 (Beginner)</option>
            <option value="intermediate">중급 (Intermediate)</option>
            <option value="advanced">고급 (Advanced)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="genre">장르</label>
          <input
            type="text"
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            placeholder="예: Pop, Rock, R&B"
          />
        </div>

        {formData.youtube_id && (
          <div className="form-preview">
            <h4>미리보기</h4>
            <img
              src={`https://img.youtube.com/vi/${formData.youtube_id}/maxresdefault.jpg`}
              alt="YouTube Thumbnail"
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${formData.youtube_id}/hqdefault.jpg`;
              }}
            />
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            ✅ 곡 추가
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            ❌ 취소
          </button>
        </div>
      </form>

      <div className="form-instructions">
        <h4>💡 사용 방법</h4>
        <ol>
          <li>YouTube에서 학습하고 싶은 팝송을 찾습니다</li>
          <li>영상 URL을 복사하여 위 폼에 입력합니다</li>
          <li>곡 정보를 입력하고 추가 버튼을 클릭합니다</li>
          <li>곡이 추가되면 가사를 입력할 수 있습니다 (API 사용 또는 직접 입력)</li>
        </ol>
      </div>
    </div>
  );
}

export default AddSongForm;

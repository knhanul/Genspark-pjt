# 팝송 학습 웹 애플리케이션 🎵

유튜브 영상과 가사를 동기화하여 팝송을 효과적으로 학습할 수 있는 웹 애플리케이션입니다.

## 주요 기능

### 🎬 유튜브 영상 연동
- 팝송 유튜브 영상을 직접 임베드하여 재생
- 가사와 영상 동기화

### 📝 가사 학습 시스템
- 구절별 가사 표시 및 학습
- 구절 반복 재생 기능
- 가사 숨기기 모드 (암기 연습)

### 📊 학습 진도 관리
- 각 구절별 학습 진도 체크
- 마스터한 구절 표시
- 학습 통계 및 진행률

### 🔄 반복 학습
- 특정 구절 반복 재생
- 느린 속도 재생 옵션
- 구간 반복 기능

## 기술 스택

### Backend
- Node.js + Express
- PostgreSQL
- pg (PostgreSQL client)

### Frontend
- React
- YouTube IFrame API
- CSS3

### Database
- PostgreSQL 14+

## 설치 및 실행

### 1. 데이터베이스 설정

```bash
# PostgreSQL에 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE popsongs_db;

# 테이블 생성 (schema.sql 실행)
\c popsongs_db
\i database/schema.sql
```

### 2. 의존성 설치

```bash
# 루트 및 클라이언트 의존성 설치
npm run install-all
```

### 3. 환경 변수 설정

`.env` 파일을 확인하고 PostgreSQL 연결 정보를 수정하세요.

### 4. 애플리케이션 실행

```bash
# 개발 모드 (서버 + 클라이언트 동시 실행)
npm run dev

# 또는 서버만 실행
npm run server
```

서버는 `http://localhost:3000`에서 실행됩니다.

## 데이터베이스 스키마

### songs 테이블
- 팝송 정보 (제목, 아티스트, 유튜브 URL 등)

### lyrics 테이블
- 가사 정보 (구절별 텍스트, 타임스탬프)

### user_progress 테이블
- 사용자 학습 진도 (구절별 마스터 여부, 반복 횟수)

## API 엔드포인트

### Songs
- `GET /api/songs` - 모든 곡 목록 조회
- `GET /api/songs/:id` - 특정 곡 상세 조회
- `POST /api/songs` - 새 곡 추가
- `PUT /api/songs/:id` - 곡 정보 수정
- `DELETE /api/songs/:id` - 곡 삭제

### Lyrics
- `GET /api/songs/:songId/lyrics` - 특정 곡의 가사 조회
- `POST /api/lyrics` - 가사 추가
- `PUT /api/lyrics/:id` - 가사 수정

### Progress
- `GET /api/progress/:userId` - 사용자 학습 진도 조회
- `POST /api/progress` - 학습 진도 업데이트
- `PUT /api/progress/:id` - 학습 진도 수정

## 사용 방법

1. **곡 추가**: 새로운 팝송과 유튜브 URL 추가
2. **가사 입력**: 구절별로 가사 및 타임스탬프 입력
3. **학습 시작**: 영상을 보면서 가사 학습
4. **반복 연습**: 어려운 구절을 반복 재생하여 연습
5. **진도 체크**: 마스터한 구절 체크하여 학습 진행률 관리

## 향후 개발 계획

- [ ] 사용자 인증 시스템
- [ ] 발음 평가 기능 (음성 인식)
- [ ] 단어장 기능
- [ ] 학습 통계 대시보드
- [ ] 모바일 앱 버전

## 라이선스

MIT License

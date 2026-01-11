# 팝송 학습 앱 설치 가이드

## 📋 목차
1. [필수 요구사항](#필수-요구사항)
2. [데이터베이스 설정](#데이터베이스-설정)
3. [프로젝트 설정](#프로젝트-설정)
4. [애플리케이션 실행](#애플리케이션-실행)
5. [사용 방법](#사용-방법)
6. [문제 해결](#문제-해결)

## 필수 요구사항

- Node.js 16 이상
- PostgreSQL 14 이상
- npm 또는 yarn
- SSH 서버 접속 가능 (DB: postgres / 비밀번호: posid00)

## 데이터베이스 설정

### 방법 1: 자동 초기화 스크립트 (권장)

```bash
# 실행 권한 부여
chmod +x init-db.sh

# 스크립트 실행
./init-db.sh
```

### 방법 2: 수동 설정

SSH 서버에 접속하여:

```bash
# PostgreSQL 접속
psql -h localhost -U postgres

# 데이터베이스 생성
CREATE DATABASE popsongs_db;

# 연결 종료
\q

# 스키마 파일 실행
psql -h localhost -U postgres -d popsongs_db -f database/schema.sql
```

비밀번호 입력: `posid00`

## 프로젝트 설정

### 1. 의존성 설치

```bash
# 백엔드 의존성
npm install

# 프론트엔드 의존성
cd client
npm install
cd ..
```

### 2. 환경 변수 확인

`.env` 파일이 다음 내용을 포함하는지 확인:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=popsongs_db
DB_USER=postgres
DB_PASSWORD=posid00
PORT=3000
NODE_ENV=development
```

## 애플리케이션 실행

### 백엔드만 실행

```bash
npm start
# 또는
npm run server
```

서버: http://localhost:3000

### 프론트엔드만 실행 (별도 터미널)

```bash
cd client
npm start
```

React 앱: http://localhost:3001

### 동시 실행 (권장)

```bash
npm run dev
```

백엔드와 프론트엔드가 동시에 실행됩니다.

## 사용 방법

### 1. 브라우저 접속

http://localhost:3001 (React 개발 서버)

### 2. 곡 추가

1. "새 곡 추가" 버튼 클릭
2. YouTube URL 입력 (예: https://www.youtube.com/watch?v=YkgkThdzX-8)
3. 곡 제목, 아티스트, 난이도, 장르 입력
4. "곡 추가" 버튼 클릭

### 3. 가사 추가

API를 통해 가사를 추가할 수 있습니다:

```bash
# 단일 가사 추가
curl -X POST http://localhost:3000/api/lyrics \
  -H "Content-Type: application/json" \
  -d '{
    "song_id": 1,
    "line_number": 1,
    "text": "Imagine there'\''s no heaven",
    "start_time": 14.5,
    "end_time": 18.0,
    "translation": "천국이 없다고 상상해봐요"
  }'

# 여러 가사 한번에 추가
curl -X POST http://localhost:3000/api/lyrics/batch \
  -H "Content-Type: application/json" \
  -d '{
    "song_id": 1,
    "lyrics": [
      {
        "line_number": 1,
        "text": "First line",
        "start_time": 10.0,
        "end_time": 12.5,
        "translation": "첫 줄"
      }
    ]
  }'
```

### 4. 학습 시작

1. 메인 화면에서 학습할 곡 선택
2. YouTube 영상과 가사가 표시됩니다
3. 가사 구절을 클릭하면 해당 부분으로 이동
4. 🔁 버튼: 특정 구절 반복 재생
5. ⭐ 버튼: 마스터 완료 체크
6. 🙈 버튼: 가사 숨기기 (암기 모드)

## API 엔드포인트

### 곡 관리
- `GET /api/songs` - 모든 곡 조회
- `GET /api/songs/:id` - 특정 곡 조회
- `POST /api/songs` - 새 곡 추가
- `PUT /api/songs/:id` - 곡 수정
- `DELETE /api/songs/:id` - 곡 삭제

### 가사 관리
- `GET /api/lyrics/song/:songId` - 곡의 가사 조회
- `POST /api/lyrics` - 가사 추가
- `POST /api/lyrics/batch` - 여러 가사 한번에 추가
- `PUT /api/lyrics/:id` - 가사 수정
- `DELETE /api/lyrics/:id` - 가사 삭제

### 학습 진도
- `GET /api/progress/user/:userId` - 사용자 진도 조회
- `GET /api/progress/user/:userId/song/:songId` - 곡별 진도
- `POST /api/progress` - 진도 업데이트
- `PUT /api/progress/toggle-master` - 마스터 상태 토글
- `POST /api/progress/practice` - 연습 횟수 증가

### 사용자 관리
- `GET /api/users` - 모든 사용자 조회
- `POST /api/users` - 사용자 추가

## 문제 해결

### 데이터베이스 연결 오류

```bash
# PostgreSQL 서버 실행 확인
systemctl status postgresql
# 또는
pg_isready

# .env 파일의 DB 정보 확인
cat .env
```

### 포트 충돌

다른 애플리케이션이 포트를 사용 중인 경우:

```bash
# 포트 사용 확인
lsof -i :3000
lsof -i :3001

# .env에서 포트 변경
PORT=3002
```

### 의존성 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 프론트엔드도 동일
cd client
rm -rf node_modules package-lock.json
npm install
```

### 샘플 데이터 확인

데이터베이스에 샘플 데이터가 올바르게 로드되었는지 확인:

```bash
psql -h localhost -U postgres -d popsongs_db -c "SELECT COUNT(*) FROM songs;"
psql -h localhost -U postgres -d popsongs_db -c "SELECT title, artist FROM songs;"
```

## 주요 기능

✅ **YouTube 영상 통합**: 유튜브 영상을 직접 재생  
✅ **가사 동기화**: 영상 재생 시간에 맞춰 가사 하이라이트  
✅ **구절 클릭 재생**: 가사를 클릭하면 해당 부분으로 이동  
✅ **반복 모드**: 어려운 구절을 반복 재생  
✅ **가사 숨기기**: 암기 연습을 위한 가사 감추기  
✅ **마스터 체크**: 학습 완료한 구절 표시  
✅ **학습 통계**: 진행률과 연습 횟수 추적  
✅ **진도 관리**: 사용자별 학습 진도 저장  

## 프로덕션 배포

### 1. 프론트엔드 빌드

```bash
cd client
npm run build
```

빌드 파일은 `client/build/` 디렉토리에 생성됩니다.

### 2. 정적 파일 서빙

Express 서버에서 빌드된 React 앱을 서빙하도록 설정:

```javascript
// server/index.js에 추가
const path = require('path');

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../client/build')));

// React 라우팅 처리
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});
```

### 3. 프로덕션 모드 실행

```bash
NODE_ENV=production npm start
```

## 추가 리소스

- [README.md](./README.md) - 프로젝트 개요
- [database/schema.sql](./database/schema.sql) - 데이터베이스 스키마
- GitHub Issues - 버그 리포트 및 기능 요청

## 지원

문제가 발생하면:
1. 이 문서의 [문제 해결](#문제-해결) 섹션 확인
2. GitHub Issues에 문의
3. 로그 파일 확인 (`console.log` 출력)

## 🎵 팝송 학습 웹 애플리케이션

YouTube 영상과 가사를 동기화하여 팝송을 효과적으로 학습할 수 있는 풀스택 웹 애플리케이션입니다.

## 📋 주요 기능

### Backend (Node.js + Express + PostgreSQL)
- ✅ RESTful API 서버 구축
- ✅ 곡 관리 API (CRUD)
- ✅ 가사 관리 API (단일/배치 추가)
- ✅ 학습 진도 추적 API
- ✅ 사용자 관리 API
- ✅ PostgreSQL 데이터베이스 스키마
- ✅ 샘플 데이터 3곡 포함 (Imagine, Shape of You, Someone Like You)

### Frontend (React)
- ✅ YouTube IFrame API 통합
- ✅ 실시간 가사 동기화 (100ms 간격)
- ✅ 구절별 클릭 재생
- ✅ 반복 모드 (특정 구절 무한 반복)
- ✅ 가사 숨기기 모드 (암기 연습)
- ✅ 마스터 체크 시스템 (⭐ → ✅)
- ✅ 학습 통계 대시보드
- ✅ 반응형 디자인 (모바일/태블릿/데스크톱)

## 📂 파일 구조

```
/home/popsEnglish/webapp/
├── database/
│   └── schema.sql              # PostgreSQL 스키마 및 샘플 데이터
├── server/
│   ├── index.js                # Express 메인 서버
│   ├── db.js                   # PostgreSQL 연결
│   └── routes/                 # API 라우트 (songs, lyrics, progress, users)
├── client/
│   ├── public/
│   └── src/
│       ├── App.js              # 메인 컴포넌트
│       └── components/         # React 컴포넌트 (SongList, LearningPlayer, AddSongForm)
├── init-db.sh                  # DB 자동 초기화 스크립트
├── INSTALL.md                  # 상세 설치 가이드
├── PROJECT_SUMMARY.md          # 프로젝트 완료 보고서
└── package.json                # 의존성
```

## 🔧 기술 스택

- **Backend**: Node.js 16+, Express.js 4.18, PostgreSQL 14+
- **Frontend**: React 18, react-youtube, Axios
- **Database**: PostgreSQL (pg client)
- **Styling**: CSS3 (Gradient, Flexbox, Grid)

## 📊 통계

- **총 파일**: 26개
- **총 코드 라인**: 2,262줄
- **커밋**: 4개
- **API 엔드포인트**: 20개+

## 🚀 설치 및 실행

### 1. 데이터베이스 초기화

SSH 서버에서:

```bash
cd /home/popsEnglish/webapp
./init-db.sh
```

또는 수동:

```bash
psql -h localhost -U postgres -d popsongs_db -f database/schema.sql
```

(비밀번호: posid00)

### 2. 의존성 설치

```bash
# 백엔드
npm install

# 프론트엔드
cd client && npm install
```

### 3. 애플리케이션 실행

```bash
# 백엔드 + 프론트엔드 동시 실행
npm run dev
```

- 백엔드 API: http://localhost:3000
- 프론트엔드: http://localhost:3001

## 📝 커밋 히스토리

```
603ce6f docs: GitHub 푸시 가이드 추가
33006ec docs: 프로젝트 완료 보고서 추가
06b64b0 docs: 설치 가이드 및 DB 초기화 스크립트 추가
d4373f6 feat: 팝송 학습 웹 애플리케이션 초기 구현
```

## 📖 참고 문서

- `README.md` - 프로젝트 소개
- `INSTALL.md` - 상세 설치 가이드 (API 엔드포인트, 문제 해결)
- `PROJECT_SUMMARY.md` - 프로젝트 완료 보고서
- `GITHUB_PUSH_GUIDE.md` - GitHub 푸시 가이드

## 🎯 테스트 방법

1. 브라우저에서 http://localhost:3001 접속
2. "새 곡 추가" 버튼 클릭하여 YouTube URL 입력
3. 곡 선택하여 학습 플레이어 접속
4. 가사 구절 클릭하여 해당 부분 재생
5. 반복 모드, 가사 숨기기 모드 테스트
6. 마스터 체크 및 학습 통계 확인

## 💡 향후 개선 계획

- [ ] 사용자 인증 시스템
- [ ] 음성 인식을 통한 발음 평가
- [ ] 단어장 기능
- [ ] 모바일 앱 버전

## ✅ 체크리스트

- [x] 데이터베이스 스키마 설계
- [x] 백엔드 API 구현
- [x] 프론트엔드 UI 구현
- [x] YouTube 영상 통합
- [x] 가사 동기화 기능
- [x] 학습 진도 관리
- [x] 문서 작성
- [x] Git 커밋 및 푸시

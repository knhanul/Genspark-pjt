# GitHub 푸시 가이드

## 현재 상태

✅ 모든 코드 파일 생성 완료 (25개 파일)  
✅ Git 커밋 완료 (3개 커밋)  
✅ 브랜치: `genspark_ai_developer`  
❌ GitHub 푸시 대기 중

## 커밋 히스토리

```
* 33006ec docs: 프로젝트 완료 보고서 추가
* 06b64b0 docs: 설치 가이드 및 DB 초기화 스크립트 추가
* d4373f6 feat: 팝송 학습 웹 애플리케이션 초기 구현
```

## GitHub에 푸시하는 방법

### 방법 1: SSH 키 사용 (권장)

```bash
cd /home/popsEnglish/webapp

# 원격 저장소 URL을 SSH로 변경
git remote set-url origin git@github.com:knhanul/Genspark-pjt.git

# 푸시
git push -u origin genspark_ai_developer
```

### 방법 2: Personal Access Token 사용

GitHub에서 Personal Access Token 생성:
1. GitHub 로그인
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. "Generate new token" 클릭
4. 권한: `repo` 전체 선택
5. 토큰 복사

터미널에서:

```bash
cd /home/popsEnglish/webapp

# credential 파일에 토큰 저장
echo "https://<YOUR_TOKEN>@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

# 원격 URL 설정
git remote set-url origin https://github.com/knhanul/Genspark-pjt.git

# 푸시
git push -u origin genspark_ai_developer
```

### 방법 3: 수동으로 파일 업로드

GitHub 웹 인터페이스 사용:
1. https://github.com/knhanul/Genspark-pjt 접속
2. "Add file" → "Upload files" 클릭
3. 프로젝트 파일들을 드래그 앤 드롭
4. 커밋 메시지 작성
5. "Create new branch" 선택: `genspark_ai_developer`

## Pull Request 생성

푸시 완료 후:

1. GitHub 저장소 페이지 접속
2. "Compare & pull request" 버튼 클릭 (노란색 배너)
3. PR 정보 입력:
   - **Base**: `main`
   - **Compare**: `genspark_ai_developer`
   - **Title**: `feat: 팝송 학습 웹 애플리케이션 구현`
   - **Description**: 아래 템플릿 사용

### PR Description 템플릿

```markdown
## 🎵 팝송 학습 웹 애플리케이션

YouTube 영상과 가사를 동기화하여 팝송을 효과적으로 학습할 수 있는 풀스택 웹 애플리케이션

## 주요 기능

### Backend (Node.js + Express + PostgreSQL)
- RESTful API 서버
- 곡/가사/진도/사용자 관리 API
- PostgreSQL 데이터베이스 스키마
- 샘플 데이터 3곡 포함

### Frontend (React)
- YouTube IFrame API 통합
- 실시간 가사 동기화
- 구절별 클릭 재생
- 반복 모드 (특정 구절 반복)
- 가사 숨기기 모드 (암기 연습)
- 마스터 체크 시스템
- 학습 통계 대시보드

## 파일 구조

- `database/schema.sql` - DB 스키마
- `server/` - Express API 서버
- `client/` - React 프론트엔드
- `init-db.sh` - DB 자동 초기화 스크립트
- `INSTALL.md` - 상세 설치 가이드
- `PROJECT_SUMMARY.md` - 프로젝트 완료 보고서

## 설치 및 실행

```bash
# DB 초기화 (SSH 서버)
./init-db.sh

# 의존성 설치
npm install
cd client && npm install

# 실행
npm run dev
```

자세한 내용은 `INSTALL.md` 참조

## 커밋

- feat: 팝송 학습 웹 애플리케이션 초기 구현
- docs: 설치 가이드 및 DB 초기화 스크립트 추가
- docs: 프로젝트 완료 보고서 추가

## 통계

- 📂 25개 파일
- 📝 2,262 라인 코드
- 🔧 3개 커밋
```

4. "Create pull request" 클릭
5. PR URL 복사하여 공유

## 예상 PR URL

푸시 완료 후 PR이 생성되면 다음과 같은 URL을 받게 됩니다:

```
https://github.com/knhanul/Genspark-pjt/pull/<숫자>
```

## 문제 해결

### "Authentication failed" 오류

credential이 없거나 만료된 경우입니다. 방법 2의 Personal Access Token을 사용하세요.

### "Permission denied" 오류

SSH 키가 GitHub에 등록되지 않은 경우입니다. 방법 2의 HTTPS + Token을 사용하세요.

### "Repository not found" 오류

원격 저장소 URL을 확인하세요:

```bash
git remote -v
# 올바른 URL: https://github.com/knhanul/Genspark-pjt.git
```

## 지원

문제가 발생하면 `PROJECT_SUMMARY.md`를 참조하거나 GitHub Issues에 문의하세요.

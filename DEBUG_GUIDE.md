# 🔍 팝송 학습 앱 - 디버깅 가이드

## 실시간 가사 동기화 확인 방법

### 1. 브라우저 개발자 도구 열기

**Chrome / Edge / Brave:**
- Windows/Linux: `F12` 또는 `Ctrl + Shift + I`
- Mac: `Cmd + Option + I`

**Firefox:**
- Windows/Linux: `F12` 또는 `Ctrl + Shift + K`
- Mac: `Cmd + Option + K`

**Safari:**
- 먼저 개발자 메뉴 활성화: Safari > 환경설정 > 고급 > "메뉴 막대에서 개발자용 메뉴 보기" 체크
- `Cmd + Option + C`

---

## 2. 콘솔(Console) 탭 확인

### 정상 작동 시 표시되는 로그들:

#### ✅ 초기 로딩
```
📥 가사 데이터 요청: 곡 ID 1, 사용자 ID 1
✅ 가사 6개 로드 완료
가사 타임스탬프: ["1번: 14.5s-18s", "2번: 18s-21.5s", ...]
✅ YouTube Player 준비 완료
📊 총 6개의 가사 구절 로드됨
🎬 영상을 재생하면 가사가 자동으로 동기화됩니다!
```

#### ▶️ 재생 시작
```
🎬 YouTube 상태: 재생 중
▶️ 재생 시작: 실시간 가사 동기화 활성화
```

#### 🎵 가사 자동 하이라이트
```
🎵 14.50초 -> 가사 1번 활성화: "Imagine there's no heaven"
🎵 18.00초 -> 가사 2번 활성화: "It's easy if you try"
🎵 21.50초 -> 가사 3번 활성화: "No hell below us"
```

#### 👆 가사 클릭
```
👆 가사 클릭: 3번 "No hell below us" (21.5초)
📈 연습 횟수 증가: 가사 3
```

#### ⏸️ 일시정지
```
🎬 YouTube 상태: 일시정지
⏸️ 일시정지: 가사 동기화 비활성화
```

---

## 3. 문제 해결 시나리오

### ❌ 문제 1: 가사가 하이라이트되지 않음

**증상:**
- 영상은 재생되지만 가사에 보라색 하이라이트가 안 보임
- 콘솔에 `🎵` 로그가 나타나지 않음

**원인 체크:**
1. 콘솔에서 다음 로그 확인:
```
✅ YouTube Player 준비 완료  <- 있어야 함
▶️ 재생 시작: 실시간 가사 동기화 활성화  <- 있어야 함
```

2. 만약 이 로그들이 없다면:
   - 페이지 새로고침 (`F5` 또는 `Cmd + R`)
   - 브라우저 캐시 삭제 (`Ctrl + Shift + Delete`)

**해결 방법:**
```javascript
// 콘솔에서 직접 테스트
console.log(playerRef.current); // YouTube 플레이어 객체 확인
console.log(lyrics); // 가사 데이터 확인
```

---

### ❌ 문제 2: 타임스탬프가 맞지 않음

**증상:**
- 가사 하이라이트는 되지만 영상과 싱크가 안 맞음

**확인 방법:**
1. 콘솔에서 가사 타임스탬프 확인:
```
가사 타임스탬프: ["1번: 14.5s-18s", "2번: 18s-21.5s", ...]
```

2. 실제 영상과 비교

**해결 방법:**
- 데이터베이스에서 타임스탬프 수정 필요
- API로 가사 업데이트:
```bash
curl -X PUT http://knhanul.duckdns.org:3000/api/lyrics/1 \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": 14.5,
    "end_time": 18.0
  }'
```

---

### ❌ 문제 3: API 연결 오류

**증상:**
- 콘솔에 `❌ 가사 조회 실패` 또는 빨간색 에러 메시지

**확인 방법:**
```javascript
// 콘솔에서 API URL 확인
console.log(process.env.REACT_APP_API_URL);
// 출력: http://knhanul.duckdns.org:3000/api 또는 http://localhost:3000/api
```

**해결 방법:**
1. 백엔드 서버가 실행 중인지 확인:
```bash
curl http://knhanul.duckdns.org:3000/api/songs
```

2. `.env` 파일 확인:
```bash
cat /home/popsEnglish/webapp/client/.env
```

3. 서버 재시작:
```bash
cd /home/popsEnglish/webapp
./run-app-simple.sh
```

---

## 4. 고급 디버깅

### Network 탭에서 API 요청 확인

1. 개발자 도구 > **Network** 탭 선택
2. 필터에서 **XHR** 또는 **Fetch** 선택
3. 곡 선택 시 다음 요청 확인:
   - `GET /api/progress/user/1/song/1` (200 OK)

### React DevTools 사용

1. Chrome 확장 프로그램 설치: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
2. 개발자 도구 > **Components** 탭
3. `LearningPlayer` 컴포넌트 찾기
4. State 확인:
   - `lyrics`: 가사 배열 (6개)
   - `currentLyricIndex`: 현재 가사 인덱스 (0~5)
   - `isPlaying`: 재생 중 여부 (true/false)

---

## 5. 성능 모니터링

### 실시간 동기화 성능 확인

콘솔에서 다음 명령 실행:
```javascript
// 동기화 정확도 측정
let syncCount = 0;
const originalLog = console.log;
console.log = function(...args) {
  if (args[0]?.includes('🎵')) {
    syncCount++;
    originalLog(`[${syncCount}] 동기화 이벤트:`, ...args);
  }
  originalLog(...args);
};
```

**정상 범위:**
- 1분 재생 시 약 20~30회 동기화 이벤트 발생 (구절 수에 따라 다름)
- 100ms 간격으로 체크하므로 1초당 10회 체크

---

## 6. 자주 묻는 질문 (FAQ)

### Q: 가사가 깜빡거려요
**A:** 이는 정상입니다! `active` 클래스에 `pulse` 애니메이션이 적용되어 있어서 현재 재생 중인 구절이 강조됩니다.

### Q: 콘솔 로그가 너무 많아요
**A:** 프로덕션 빌드에서는 로그를 제거할 수 있습니다:
```javascript
// LearningPlayer.js 상단에 추가
const DEBUG = process.env.NODE_ENV === 'development';
const log = DEBUG ? console.log : () => {};
```

### Q: 자동 스크롤이 부드럽지 않아요
**A:** CSS `scroll-behavior` 설정을 조정하거나, `updateCurrentLyric` 함수의 `setTimeout` 딜레이를 조정해보세요.

---

## 7. 문제 보고

문제가 계속되면 다음 정보를 수집해주세요:

1. **브라우저 정보**: Chrome 120, Firefox 121 등
2. **콘솔 로그**: 전체 복사
3. **Network 탭**: API 요청/응답 스크린샷
4. **재현 단계**: 어떤 순서로 문제가 발생하는지

---

## 8. 참고 자료

- [React useEffect Hook](https://react.dev/reference/react/useEffect)
- [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference)
- [Chrome DevTools Guide](https://developer.chrome.com/docs/devtools/)

---

**마지막 업데이트**: 2026-01-11
**작성자**: GenSpark AI Developer

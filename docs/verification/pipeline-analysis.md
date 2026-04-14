# Pipeline Analysis (디버깅 가이드)

## 디버깅 원칙

### 1. 데이터 구조 확인 (가장 중요)
- **Backend → Frontend 필드명 매핑은 로그로 직접 확인** (추측 금지)
- API 응답 구조를 모른다면 console.log 또는 alert로 직접 확인
- Backend 코드(service, DAO, route)를 먼저 읽고 진행

### 2. CSS 우선순위
- `style.setProperty(..., 'important')` 또는 `!important` 사용
- 기존 CSS 클래스보다 우선순위를 줘야 할 때 적용

### 3. 캐시 문제
- Frontend 파일 변경 시 브라우저 캐시 고려
- Ctrl+Shift+R (강제 새로고침) 또는 시크릿 모드 사용
- 서버 재시작 필수

---

## 디버깅 체크리스트

- [ ] Backend API 응답을 로그로 확인했는가?
- [ ] Frontend가 수신한 데이터 구조를 확인했는가?
- [ ] CSS 우선순위 (!important)를 적용했는가?
- [ ] 브라우저 캐시를 삭제하고 테스트했는가?
- [ ] 서버를 재시작했는가?

---

## 00-core.md와 연계

- 기능 문제 분석/디버깅 시 반드시 먼저 읽을 문서
- Backend → Frontend 데이터 흐름 추적 시 참조
- 이 문서는 ** vivante 검증의 핵심 가이드 **

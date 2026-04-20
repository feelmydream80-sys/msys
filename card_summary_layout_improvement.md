# 카드 요약 페이지 레이아웃 개선 프로젝트

## 📋 프로젝트 개요

**목적**: 카드 요약 페이지(`/card_summary`)의 데이터 표시 문제 해결 및 레이아웃 개선

**주요 이슈**: 
- CD200 그룹에 156개 Job이 있어 `fit-content` 적용 시 그룹 카드가 **17,862px**로 비정상적으로 확장되는 문제
- 상태 카드들의 레이아웃 구조 개선 필요

**요구사항**:
1. ✅ 상태 카드의 내용물(Job 목록)은 **세로 배치**
2. ✅ 상태 카드들은 **가로 배치** (flex row)
3. ✅ 각 상태 카드의 내용은 **4개까지 표현**, 그 이상은 세로 스크롤 생성
4. ✅ 각 상태 카드는 자신의 내용물(12자 제한 적용된 Job 이름)에 따라 **독립적인 너비**를 가져야 함

---

## 🗓️ 진행 내역

### 1단계: 동적 구조 구현 (완료)

#### 변경 파일: `static/js/pages/card_summary.js`

**구현 내용**:
- `data.statuses` 순회하도록 JS 수정
- 그룹 헤더 색상: API 제공 색상(`group_bg_colr`, `group_txt_colr`) 적용
- 상태 카드 색상: 각 상태의 `bg_colr`, `txt_colr` 적용
- 12자 제한: JS에서 `substring(0, 12) + '...'` 적용
- 툴팁 기능: Job pill 마우스 오버 시 상세 정보 표시 (`createTooltipContent` 함수)
- 검색 디바운스: 300ms 디바운스 적용

**핵심 코드**:
```javascript
// 12자 제한 적용 (라인 ~260)
let displayName = getDisplayName(job);
const maxLength = 12;
if (displayName.length > maxLength) {
    displayName = displayName.substring(0, maxLength) + '...';
}
jobPill.textContent = displayName;
```

---

### 2단계: 레이아웃 구조 개선 (완료)

#### 변경 파일: `static/css/card_summary.css`

#### 2.1 Job 목록 세로 배치

**변경 전**:
```css
.status-jobs {
    display: flex;
    flex-wrap: wrap;  /* 가로로 배치 */
    gap: 5px;
    /* ... */
}
```

**변경 후**:
```css
.status-jobs {
    display: flex;
    flex-direction: column;  /* 세로로 배치 */
    flex-wrap: nowrap;
    gap: 5px;
    max-height: 120px;  /* 약 4개 Job 표시 후 스크롤 */
    overflow-y: auto;
    overflow-x: hidden;
    align-items: flex-start;
    /* ... */
}
```

#### 2.2 상태 카드 컨테이너 개선

**변경 전**:
```css
.status-cards-container {
    flex-wrap: nowrap;  /* 한 줄로 계속 늘어남 */
    overflow-x: auto;   /* 가로 스크롤 */
    /* ... */
}
```

**변경 후**:
```css
.status-cards-container {
    flex-wrap: wrap;    /* 상태 카드가 많으면 다음 줄로 */
    overflow-x: visible;
    overflow-y: visible;
    align-items: flex-start;
    /* ... */
}
```

#### 2.3 상태 카드 독립적 너비

**변경 전**:
```css
.status-card {
    width: fit-content;
    max-width: none;    /* 제한 없음 */
    height: 100%;
    /* ... */
}
```

**변경 후**:
```css
.status-card {
    width: fit-content;  /* 내용물에 따라 독립적 너비 */
    min-width: min-content;
    max-width: 300px;    /* 최대 너비 제한 */
    height: auto;        /* 내용물에 따라 높이 자동 */
    /* ... */
}
```

#### 2.4 그룹 카드 너비 제한

**변경 전**:
```css
.group-card {
    width: auto;
    min-width: min-content;
    max-width: max-content;  /* 무제한 확장 가능 */
    /* ... */
}
```

**변경 후**:
```css
.group-card {
    width: auto;
    min-width: 200px;    /* 최소 너비 */
    max-width: 100%;     /* 부모 컨테이너를 넘지 않도록 */
    /* ... */
}
```

#### 2.5 공 수량별 크기 클래스 단순화

**변경 전**:
```css
.status-card.ball-count-1 { width: fit-content; min-width: min-content; }
.status-card.ball-count-2 { width: fit-content; min-width: min-content; }
/* ... 개별 정의 */
```

**변경 후**:
```css
/* 모든 상태 카드는 내용물에 따라 독립적인 너비를 가짐 */
.status-card.ball-count-1,
.status-card.ball-count-2,
.status-card.ball-count-3,
.status-card.ball-count-4,
.status-card.ball-count-5,
.status-card.ball-count-6,
.status-card.ball-count-7,
.status-card.ball-count-8,
.status-card.ball-count-9,
.status-card.ball-count-10,
.status-card.ball-count-many {
    width: fit-content;
    min-width: min-content;
}
```

#### 2.6 반응형 디자인 개선

**모바일 대응** (`@media (max-width: 600px)`):
```css
.group-card {
    max-width: 100%;
    min-width: 150px;
}

.status-card {
    min-width: min-content;
    max-width: none;
    width: fit-content;
}

.status-jobs {
    max-height: 100px;  /* 모바일에서도 최대 4개 정도 */
    flex-direction: column;
    flex-wrap: nowrap;
}
```

---

## 📁 변경된 파일 목록

### 수정된 파일
1. **`static/css/card_summary.css`** - 레이아웃, 상태 카드, Job pill 스타일
2. **`static/js/pages/card_summary.js`** - 동적 렌더링 로직
3. **`templates/card_summary.html`** - 검색창, 라디오 버튼 레이아웃

### 백업 파일
- `static/js/pages/card_summary.js.physics_backup` - 물리 애니메이션 버전 백업
- `static/css/card_summary.css.physics_backup` - CSS 백업

### 테스트 파일
- `bean_mockup.html` - 토글 스위치, 두 가지 모드(목록/물리) 구현된 목업

---

## 🎯 최종 레이아웃 구조

```
┌────────────────────────────────────────────────────────────┐
│  검색창 [________]  라디오: (●) 코드  ( ) 이름  ( ) 둘 다    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │  CD100 그룹                    총 50건              │   │
│  ├────────────────────────────────────────────────────┤   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │  성공 30건   │  │  진행중 15건 │  │  실패 5건   │ │   │
│  │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │ │   │
│  │  │ │JobA...  │ │  │ │JobB...  │ │  │ │JobC...  │ │ │   │
│  │  │ │JobD...  │ │  │ │JobE...  │ │  │ │JobF...  │ │ │   │
│  │  │ │JobG...  │ │  │ │JobH...  │ │  │ │JobI...  │ │ │   │
│  │  │ │JobJ...  │ │  │ │JobK...  │ │  │ └─────────┘ │ │   │
│  │  │ │(스크롤)  │ │  │ │(스크롤)  │ │  └─────────────┘ │   │
│  │  │ └─────────┘ │  │ └─────────┘ │                   │   │
│  │  └─────────────┘  └─────────────┘                   │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │  CD200 그룹                    총 156건             │   │
│  ├────────────────────────────────────────────────────┤   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │  성공 100건  │  │  진행중 40건 │  │  실패 16건  │ │   │
│  │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │ │   │
│  │  │ │Job1...  │ │  │ │Job2...  │ │  │ │Job3...  │ │ │   │
│  │  │ │Job4...  │ │  │ │Job5...  │ │  │ │Job6...  │ │ │   │
│  │  │ │Job7...  │ │  │ │Job8...  │ │  │ │Job9...  │ │ │   │
│  │  │ │Job10... │ │  │ │Job11... │ │  │ │Job12... │ │ │   │
│  │  │ │(스크롤)  │ │  │ │(스크롤)  │ │  │ │(스크롤)  │ │ │   │
│  │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## ✅ 요구사항 충족 여부

| 요구사항 | 상태 | 설명 |
|---------|------|------|
| 상태 카드 내용물 세로 배치 | ✅ 완료 | `.status-jobs`에 `flex-direction: column` 적용 |
| 상태 카드 가로 배치 | ✅ 완료 | `.status-cards-container`에 `display: flex` 유지 |
| 4개까지 표시 후 스크롤 | ✅ 완료 | `.status-jobs`에 `max-height: 120px` 적용 |
| 독립적인 너비 | ✅ 완료 | `.status-card`에 `width: fit-content` 적용 |
| 17,862px 너비 문제 해결 | ✅ 완료 | `max-width: 100%` 및 `flex-wrap: wrap` 적용 |
| 12자 제한 | ✅ 완료 | JS에서 `substring(0, 12) + '...'` 적용 |
| 상태 색상 적용 | ✅ 완료 | API에서 받아온 `bg_colr`, `txt_colr` 사용 |
| 툴팁 기능 | ✅ 완료 | `createTooltipContent` 함수로 구현 |
| 검색 디바운스 | ✅ 완료 | 300ms 디바운스 적용 |

---

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **CSS Features**: Flexbox, Custom Properties, Media Queries
- **JS Features**: Fetch API, Template Literals, Event Delegation

---

## 📝 참고 사항

### 브라우저 캐시
변경사항이 바로 반영되지 않으면 **Ctrl+Shift+R** (또는 Ctrl+F5)로 강제 새로고침 필요

### 네이밍 규칙
- BEM (Block Element Modifier) 방법론 준수
- 클래스명: `.block__element--modifier`

### 호환성
- 최신 브라우저 (Chrome, Firefox, Safari, Edge)
- IE11 미지원 (Flexbox gap property 사용)

---

## 📅 마지막 업데이트

2025-04-17

---

## 👥 작성자

OpenCode Agent (AI Assistant)

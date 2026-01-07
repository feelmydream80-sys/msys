# MSYS UI 표준화 계획

## 문서 정보
- **작성일**: 2025-12-23
- **버전**: 1.0
- **작성자**: AI Assistant (Cline)
- **목적**: MSYS 시스템의 UI 컴포넌트 표준화를 통한 일관성 확보
- **배경**: 카드 너비 등 UI 요소들의 불일관성으로 인한 사용자 경험 저하

## 1. 현황 분석

### 1.1. 현재 UI 불일관성 문제점

#### 1.1.1. 카드 너비 차이
- **card_summary**: `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`
- **collection_schedule**: `grid-template-columns: repeat(7, 1fr)` (150px 고정)
- **dashboard**: `grid-cols-1 md:grid-cols-2` (2열 고정)
- **data_analysis**: `flex gap-4` (동일 너비)

#### 1.1.2. 레이아웃 패턴 불일치
- 각 메뉴가 독립적인 CSS와 HTML 구조 사용
- 공통 컴포넌트 부족
- 반응형 디자인 일관성 부족

#### 1.1.3. 스타일링 분산
- 인라인 스타일, 페이지별 CSS, 공통 CSS 혼재
- 색상 및 타이포그래피 표준 부재

### 1.2. 영향도
- **사용자 경험**: 메뉴 간 이동 시 레이아웃 차이로 인한 혼란
- **유지보수성**: 스타일 변경 시 다수 파일 수정 필요
- **확장성**: 신규 메뉴 추가 시 일관성 확보 어려움

## 2. 표준화 목표

### 2.1. 주요 목표
- **일관성 확보**: 모든 메뉴에서 동일한 시각적 패턴 적용
- **유지보수성 향상**: 중앙 집중식 스타일 관리
- **사용성 개선**: 예측 가능한 UI 경험 제공
- **확장성 확보**: 신규 컴포넌트 추가 용이

### 2.2. 성공 기준
- 모든 메뉴의 카드 컴포넌트가 동일한 스타일 적용
- 반응형 디자인 breakpoint 일치
- 공통 컴포넌트 라이브러리 구축
- CSS 클래스 재사용률 80% 이상

## 3. 표준화 범위

### 3.1. 컴포넌트 표준화

#### 3.1.1. 카드 컴포넌트
```html
<!-- 표준 카드 구조 -->
<div class="card card-collapsible">
    <div class="card-header">
        <h2 class="card-title">제목</h2>
        <span class="card-toggle">▼</span>
    </div>
    <div class="card-content">
        <!-- 내용 -->
    </div>
</div>
```

#### 3.1.2. 그리드 시스템
```css
/* 표준 그리드 클래스 */
.grid-cards-auto { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
.grid-cards-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cards-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cards-4 { grid-template-columns: repeat(4, 1fr); }
```

#### 3.1.3. 버튼 컴포넌트
```html
<!-- 표준 버튼 -->
<button class="btn btn-primary">기본 버튼</button>
<button class="btn btn-secondary">보조 버튼</button>
<button class="btn btn-success">성공 버튼</button>
```

### 3.2. 디자인 토큰

#### 3.2.1. 색상 팔레트
```css
:root {
    /* 기본 색상 */
    --color-primary: #3b82f6;
    --color-secondary: #6b7280;
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #ef4444;

    /* 배경색 */
    --bg-card: #ffffff;
    --bg-section: #f9fafb;
    --bg-hover: #f3f4f6;

    /* 텍스트 색상 */
    --text-primary: #111827;
    --text-secondary: #6b7280;
    --text-muted: #9ca3af;
}
```

#### 3.2.2. 타이포그래피 스케일
```css
/* 제목 */
.text-display { font-size: 2.25rem; font-weight: 700; }
.text-heading-1 { font-size: 1.875rem; font-weight: 600; }
.text-heading-2 { font-size: 1.5rem; font-weight: 600; }
.text-heading-3 { font-size: 1.25rem; font-weight: 600; }

/* 본문 */
.text-body-large { font-size: 1.125rem; line-height: 1.75; }
.text-body { font-size: 1rem; line-height: 1.5; }
.text-body-small { font-size: 0.875rem; line-height: 1.25; }
```

#### 3.2.3. 간격 시스템
```css
/* 패딩 */
.p-xs { padding: 0.25rem; }
.p-sm { padding: 0.5rem; }
.p-md { padding: 1rem; }
.p-lg { padding: 1.5rem; }
.p-xl { padding: 2rem; }

/* 마진 */
.m-xs { margin: 0.25rem; }
.m-sm { margin: 0.5rem; }
.m-md { margin: 1rem; }
.m-lg { margin: 1.5rem; }
.m-xl { margin: 2rem; }

/* 간격 */
.gap-xs { gap: 0.25rem; }
.gap-sm { gap: 0.5rem; }
.gap-md { gap: 1rem; }
.gap-lg { gap: 1.5rem; }
.gap-xl { gap: 2rem; }
```

### 3.3. 반응형 디자인 표준

#### 3.3.1. Breakpoint 정의
```css
/* 모바일 우선 */
.container { max-width: 100%; }

/* 태블릿 */
@media (min-width: 768px) {
    .container { max-width: 768px; }
    .grid-cards-auto { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
}

/* 데스크톱 */
@media (min-width: 1024px) {
    .container { max-width: 1024px; }
    .grid-cards-auto { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
}

/* 대형 화면 */
@media (min-width: 1280px) {
    .container { max-width: 1280px; }
    .grid-cards-auto { grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); }
}
```

## 4. 구현 계획

### Phase 1: 기반 구축 (1주)
- [ ] 디자인 토큰 CSS 변수 정의
- [ ] 공통 컴포넌트 CSS 클래스 생성
- [ ] Tailwind CSS 커스텀 유틸리티 추가
- [ ] 기존 컴포넌트 인벤토리 정리

### Phase 2: 카드 컴포넌트 표준화 (2주)
- [ ] collapsible-card 컴포넌트 표준화
- [ ] 카드 그리드 시스템 구현
- [ ] card_summary.html 리팩토링
- [ ] collection_schedule.html 리팩토링

### Phase 3: 메뉴 전반 적용 (3주)
- [ ] dashboard.html 표준화 적용
- [ ] data_analysis.html 표준화 적용
- [ ] jandi.html 표준화 적용
- [ ] data_spec.html 표준화 적용
- [ ] 기타 메뉴들 표준화 적용

### Phase 4: 고급 컴포넌트 및 검증 (2주)
- [ ] 버튼, 폼, 모달 컴포넌트 표준화
- [ ] JavaScript 컴포넌트 표준화
- [ ] 크로스 브라우저 테스트
- [ ] 접근성 검증

## 5. 구현 세부사항

### 5.1. CSS 아키텍처

#### 5.1.1. 파일 구조
```
static/css/
├── base.css          # CSS 변수 및 리셋
├── components.css    # 컴포넌트 스타일
├── utilities.css     # 유틸리티 클래스
├── themes.css        # 테마별 스타일
└── legacy.css        # 기존 호환성 유지
```

#### 5.1.2. CSS 변수 활용
```css
/* static/css/base.css */
:root {
    /* 색상 */
    --color-primary: #3b82f6;
    --color-surface: #ffffff;
    --color-surface-variant: #f9fafb;

    /* 타이포그래피 */
    --font-family: 'Inter', sans-serif;
    --font-size-heading-1: 1.5rem;
    --font-weight-heading: 600;

    /* 간격 */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;

    /* 그림자 */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

    /* 반경 */
    --radius-sm: 0.25rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
}
```

#### 5.1.3. 컴포넌트 스타일
```css
/* static/css/components.css */

/* 카드 컴포넌트 */
.card {
    background-color: var(--color-surface);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    overflow: hidden;
}

.card-header {
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-outline);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-title {
    font-size: var(--font-size-heading-2);
    font-weight: var(--font-weight-heading);
    color: var(--color-text-primary);
    margin: 0;
}

.card-content {
    padding: var(--space-lg);
}

/* 버튼 컴포넌트 */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    font-weight: 500;
    text-decoration: none;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-primary {
    background-color: var(--color-primary);
    color: white;
}

.btn-primary:hover {
    background-color: var(--color-primary-hover);
}

/* 그리드 시스템 */
.grid-cards {
    display: grid;
    gap: var(--space-md);
}

.grid-cards-auto {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-cards-2 {
    grid-template-columns: repeat(2, 1fr);
}

.grid-cards-3 {
    grid-template-columns: repeat(3, 1fr);
}
```

### 5.2. HTML 템플릿 표준화

#### 5.2.1. 카드 템플릿
```html
<!-- 표준 카드 템플릿 -->
<div class="card card-collapsible">
    <div class="card-header">
        <h2 class="card-title">{{ title }}</h2>
        <span class="card-toggle">▼</span>
    </div>
    <div class="card-content">
        {{ content }}
    </div>
</div>
```

#### 5.2.2. 그리드 컨테이너
```html
<!-- 표준 그리드 컨테이너 -->
<div class="grid-cards grid-cards-auto">
    <!-- 카드들 -->
</div>
```

### 5.3. JavaScript 표준화

#### 5.3.1. 컴포넌트 초기화
```javascript
// 표준 컴포넌트 초기화
class CardComponent {
    constructor(element) {
        this.element = element;
        this.header = element.querySelector('.card-header');
        this.content = element.querySelector('.card-content');
        this.toggle = element.querySelector('.card-toggle');
        this.init();
    }

    init() {
        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.toggleContent());
        }
    }

    toggleContent() {
        const isCollapsed = this.content.classList.contains('collapsed');
        if (isCollapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    expand() {
        this.content.classList.remove('collapsed');
        this.toggle.textContent = '▼';
    }

    collapse() {
        this.content.classList.add('collapsed');
        this.toggle.textContent = '▶';
    }
}

// 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.card-collapsible').forEach(card => {
        new CardComponent(card);
    });
});
```

## 6. 마이그레이션 전략

### 6.1. 점진적 적용
- 기존 코드를 유지하면서 새로운 표준 적용
- 메뉴 단위로 순차적 마이그레이션
- 롤백 계획 수립

### 6.2. 호환성 유지
- 기존 CSS 클래스 유지 (deprecated 표시)
- 새로운 클래스와 기존 클래스 공존
- 점진적 교체

### 6.3. 테스트 전략
- 시각적 회귀 테스트 도입
- 컴포넌트 단위 테스트
- 크로스 브라우저 테스트

## 7. 유지보수 계획

### 7.1. 디자인 시스템 관리
- 디자인 토큰 중앙 관리
- 컴포넌트 라이브러리 구축
- 변경 영향도 분석

### 7.2. 문서화
- 컴포넌트 사용 가이드
- 디자인 토큰 레퍼런스
- 변경 로그 관리

### 7.3. 모니터링
- UI 일관성 점검 자동화
- 사용자 피드백 수집
- 성능 영향 모니터링

## 8. 위험 요소 및 완화 전략

### 8.1. 기능 회귀 위험
- **완화**: 각 단계별 테스트 실행, 스크린샷 비교

### 8.2. 성능 저하 위험
- **완화**: CSS 번들 크기 모니터링, 최적화 적용

### 8.3. 개발 속도 저하 위험
- **완화**: 표준 컴포넌트 라이브러리 제공, 템플릿 활용

## 9. 성공 지표

### 9.1. 정량적 지표
- CSS 클래스 재사용률: 80% 이상
- 컴포넌트 표준화율: 95% 이상
- 페이지 로드 시간: 변화 없음 (±5%)

### 9.2. 정성적 지표
- 개발자 만족도 향상
- UI 일관성 사용자 피드백 개선
- 유지보수 비용 감소

## 10. 참고 자료

- `document/refactoring_plan.md`: 기존 리팩토링 계획
- `static/css/common.css`: 현재 공통 스타일
- `templates/base.html`: 기본 템플릿 구조
- 각 메뉴 HTML 파일들: 현재 구현 현황

---

*본 문서는 UI 표준화 진행 중 업데이트됩니다.*

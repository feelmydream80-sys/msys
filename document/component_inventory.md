# MSYS 컴포넌트 인벤토리

## 문서 정보
- **작성일**: 2025-12-23
- **버전**: 1.0
- **목적**: 기존 UI 컴포넌트 분석 및 표준화 대상 식별
- **범위**: templates/ 디렉토리의 모든 HTML 파일

## 1. 분석 대상 파일

### 1.1. 메인 메뉴 템플릿
- `card_summary.html` - 실시간 현황 대시보드
- `collection_schedule.html` - 데이터 수집 일정
- `dashboard.html` - 대시보드
- `data_analysis.html` - 데이터분석
- `jandi.html` - 잔디 모니터링
- `data_spec.html` - 데이터 명세서 관리

### 1.2. 서브 템플릿
- `base.html` - 기본 레이아웃
- `navbar.html` - 네비게이션 바
- `collapsible_controls.html` - 접을 수 있는 컨트롤

## 2. 컴포넌트 분석 결과

### 2.1. 카드 컴포넌트 패턴

#### 현재 사용 패턴
```html
<!-- collapsible-card 패턴 (대부분의 메뉴에서 사용) -->
<div class="collapsible-card bg-white rounded-lg shadow-md mb-6">
    <div class="card-header p-6 cursor-pointer flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-700">제목</h2>
        <span class="transform transition-transform duration-300">▼</span>
    </div>
    <div class="card-content px-6 pb-6">
        <!-- 내용 -->
    </div>
</div>
```

#### 인라인 스타일 패턴 (collection_schedule.html)
```html
<style>
    .heatmap-container { border: 1px solid #e5e7eb; border-radius: 8px; ... }
    .card-header { display: flex; justify-content: space-between; ... }
</style>
```

#### 페이지별 CSS 패턴 (card_summary.css)
```css
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2px;
}
```

### 2.2. 그리드 시스템 사용 현황

| 메뉴 | 그리드 타입 | 컬럼 수 | 특이사항 |
|------|-------------|---------|----------|
| card_summary | CSS Grid | auto-fit (320px) | 카드별로 개별 CSS |
| collection_schedule | CSS Grid | 7열 고정 | 달력 형태 |
| dashboard | CSS Grid | 2열 (md:2) | Tailwind 사용 |
| data_analysis | Flexbox | 3개 카드 | flex-1로 동일 너비 |
| jandi | CSS Grid | 1열 | 테이블 위주 |
| data_spec | CSS Grid | 1열 | 테이블 위주 |

### 2.3. 버튼 컴포넌트 패턴

#### 현재 사용 패턴
```html
<!-- 다양한 버튼 스타일 -->
<button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md">기본 버튼</button>
<button id="filter-button" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md">조회</button>
<button class="bg-green-600 text-white font-semibold py-2 px-5 rounded-md hover:bg-green-700">등록</button>
```

#### 인라인 스타일 버튼 (collection_schedule.html)
```html
<button style="background-color: #10b981; color: white; font-weight: bold; padding: 8px 16px; border-radius: 6px;">다운로드</button>
```

### 2.4. 폼 컴포넌트 패턴

#### 현재 사용 패턴
```html
<!-- 다양한 인풋 스타일 -->
<input type="date" class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
<select class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
<input type="text" id="jobInfoSearch" placeholder="검색..." class="p-1 border border-gray-300 rounded text-sm w-48">
```

### 2.5. 테이블 컴포넌트 패턴

#### 현재 사용 패턴
```html
<table class="min-w-full divide-y divide-gray-200">
<table class="min-w-full bg-white">
<table id="jobInfoTable" class="min-w-full text-sm text-left">
```

### 2.6. 모달 컴포넌트 패턴

#### 현재 사용 패턴 (data_spec.html)
```html
<div class="fixed inset-0 bg-black bg-opacity-50 hidden items-start justify-center p-4 pt-12 z-50">
    <div class="bg-white rounded-lg shadow-2xl w-full max-w-4xl">
        <!-- 모달 내용 -->
    </div>
</div>
```

## 3. 표준화 우선순위

### 3.1. 고우선순위 (Phase 2)
- **카드 컴포넌트**: 모든 메뉴에서 사용되는 핵심 컴포넌트
- **그리드 시스템**: 카드 배치를 위한 일관된 레이아웃
- **버튼 컴포넌트**: 사용자 인터랙션의 기본 요소

### 3.2. 중우선순위 (Phase 3)
- **폼 컴포넌트**: 입력 요소들의 일관성
- **테이블 컴포넌트**: 데이터 표시의 표준화
- **색상 및 타이포그래피**: 디자인 토큰 적용

### 3.3. 저우선순위 (Phase 4)
- **모달 컴포넌트**: 특수 케이스로 사용 빈도 낮음
- **아이콘 및 상태 표시**: 부가적인 시각 요소
- **고급 인터랙션**: 드롭다운, 툴팁 등

## 4. 마이그레이션 영향도 분석

### 4.1. 파일별 영향도

#### card_summary.html
- **영향도**: 높음
- **변경사항**: 그리드 시스템 표준화, 카드 컴포넌트 적용
- **예상 작업량**: 중간 (CSS 클래스 교체 중심)

#### collection_schedule.html
- **영향도**: 높음
- **변경사항**: 인라인 스타일 제거, 표준 컴포넌트 적용
- **예상 작업량**: 높음 (많은 인라인 스타일 존재)

#### dashboard.html
- **영향도**: 중간
- **변경사항**: Tailwind 클래스와 표준 클래스 통합
- **예상 작업량**: 중간

#### data_analysis.html
- **영향도**: 중간
- **변경사항**: 카드 컴포넌트 표준화
- **예상 작업량**: 낮음

#### jandi.html
- **영향도**: 중간
- **변경사항**: 카드 컴포넌트 및 버튼 표준화
- **예상 작업량**: 중간

#### data_spec.html
- **영향도**: 높음
- **변경사항**: 모달 컴포넌트 표준화, 버튼 통일
- **예상 작업량**: 높음

### 4.2. CSS 파일 영향도

#### static/css/card_summary.css
- **상태**: 유지 (메뉴 특화 스타일)
- **처리 방안**: 표준화 후 제거 또는 최소화

#### 인라인 스타일
- **위치**: collection_schedule.html, data_spec.html 등
- **처리 방안**: 표준 컴포넌트로 대체

## 5. 표준화 적용 가이드라인

### 5.1. 카드 컴포넌트 표준화

#### 변경 전
```html
<div class="collapsible-card bg-white rounded-lg shadow-md mb-6">
    <div class="card-header p-6 cursor-pointer flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-700">제목</h2>
        <span class="transform transition-transform duration-300">▼</span>
    </div>
    <div class="card-content px-6 pb-6">
        내용
    </div>
</div>
```

#### 변경 후
```html
<div class="card card-collapsible m-6">
    <div class="card-header">
        <h2 class="card-title">제목</h2>
        <span class="card-toggle">▼</span>
    </div>
    <div class="card-content">
        내용
    </div>
</div>
```

### 5.2. 그리드 시스템 표준화

#### 변경 전 (card_summary)
```css
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2px;
}
```

#### 변경 후
```html
<div class="grid-cards grid-cards-auto">
    <!-- 카드들 -->
</div>
```

### 5.3. 버튼 컴포넌트 표준화

#### 변경 전
```html
<button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md">버튼</button>
```

#### 변경 후
```html
<button class="btn btn-primary">버튼</button>
```

## 6. 테스트 및 검증 계획

### 6.1. 시각적 회귀 테스트
- 각 메뉴의 스크린샷 비교
- 주요 브레이크포인트별 확인 (모바일, 태블릿, 데스크톱)

### 6.2. 기능 테스트
- 카드 토글 기능
- 반응형 레이아웃
- 버튼 인터랙션

### 6.3. 성능 테스트
- CSS 번들 크기 확인
- 렌더링 성능 영향도 측정

## 7. 롤백 계획

### 7.1. 단계별 롤백
- CSS 파일 교체로 즉시 롤백 가능
- Git 커밋을 통한 버전별 복원

### 7.2. 부분 롤백
- 메뉴 단위로 독립적 롤백 가능
- 기능별로 분리된 변경사항

## 8. 결론 및 권장사항

### 8.1. 주요 발견사항
1. **카드 컴포넌트의 일관성 부족**: 각 메뉴마다 다른 클래스명과 스타일 사용
2. **인라인 스타일 과다 사용**: collection_schedule.html 등에서 유지보수 어려움
3. **Tailwind와 커스텀 CSS 혼재**: 표준화 필요성 대두

### 8.2. 표준화 전략 권장사항
1. **점진적 적용**: Phase별로 나누어 위험 최소화
2. **하향식 접근**: 공통 컴포넌트부터 시작하여 특화 컴포넌트로 확장
3. **테스트 우선**: 각 변경사항에 대한 철저한 테스트

### 8.3. 기대 효과
- **일관성 향상**: 모든 메뉴에서 동일한 시각적 경험
- **유지보수성 개선**: 중앙 집중식 스타일 관리
- **개발 생산성 향상**: 재사용 가능한 컴포넌트 라이브러리 구축

---

*본 문서는 UI 표준화 진행 중 업데이트됩니다.*

# 기술 부채 로그

## 1. 이벤트 로그 미출력 현상

### 원인

Flask 애플리케이션을 Gunicorn과 같은 프로덕션 WSGI 서버를 통해 실행할 때, `print()` 함수를 사용한 로그는 표준 출력(stdout)으로 직접 전달되지 않을 수 있습니다. 특히, 데몬화(daemonized)된 프로세스에서는 출력이 버려지거나 다른 곳으로 리디렉션될 수 있습니다. 이로 인해 `print()`를 사용하여 남긴 디버그 메시지가 터미널에 표시되지 않는 문제가 반복적으로 발생했습니다.

### 해결 방법

Flask의 내장 로거인 `current_app.logger`를 사용하는 것으로 표준화합니다. 이는 Flask 애플리케이션의 로깅 설정을 따르므로, 개발 환경(로컬 실행)과 프로덕션 환경(Gunicorn 등) 모두에서 일관되게 로그를 출력할 수 있습니다.

- **`print()` 대신 `current_app.logger.debug()`, `current_app.logger.info()` 등을 사용합니다.**
- 디버그 레벨의 로그를 확인하기 위해서는 Flask 앱의 로그 레벨을 `DEBUG`로 설정해야 합니다. (`app.logger.setLevel(logging.DEBUG)`)

---

## 2. 카드 요약 데이터 미표시 현상 (2025-11-12 해결)

### 문제 현황

'카드 요약' 페이지에서 백엔드 API는 정상적으로 데이터를 반환하지만, 프론트엔드 화면에 아무것도 렌더링되지 않는 문제가 발생.

### 잘못된 접근 (실수 기록)

- **백엔드 코드 성급한 수정:** 문제의 원인이 프론트엔드에 있었음에도 불구하고, 백엔드의 `service/card_summary_service.py`와 관련 SQL 쿼리를 불필요하게 수정하려 시도함. 이는 **"기존 데이터 조회 로직은 절대 변경하지 않는다"** 는 기본 원칙을 위배한 명백한 실수였음.
- **프론트엔드 파일 손상:** 문제 해결 과정에서 `static/js/pages/card_summary.js` 파일의 내용을 비워버려, 페이지 로딩 자체를 불가능하게 만드는 더 큰 문제를 유발함.

### 근본 원인

- **프론트엔드 렌더링 로직 부재:** `static/js/pages/card_summary.js` 파일의 내용이 비어있어, API로부터 데이터를 성공적으로 수신했음에도 불구하고 이를 화면에 그려주는 렌더링 코드가 존재하지 않았음.

### 해결 방법

- **백업 파일로 원상 복구:** 손상된 `static/js/pages/card_summary.js` 파일을 프로젝트 백업(`msys_251111-01.zip`)에서 추출하여 원본으로 덮어쓰는 방식으로 해결함.
- **교훈:** 문제 발생 시, `card_summary_issue_prompt.md`와 같은 기존 분석 문서의 절차를 철저히 따르고, 데이터 흐름의 각 단계를 로그로 확인하기 전까지 코드를 성급하게 수정하지 말아야 함.

---

## 3. 프론트엔드 시간 처리 비표준화로 인한 시간대 왜곡 (2025-11-13 해결)

### 원인

- **데이터 흐름:** 백엔드 API는 DB의 UTC 시간을 한국 시간(KST)으로 올바르게 변환하여 **문자열(String)** 형태로 프론트엔드에 전달하고 있었음.
- **프론트엔드 문제:** `static/js/modules/data_analysis/ui.js`에서 데이터를 테이블에 렌더링할 때, 백엔드에서 받은 KST 시간 문자열을 불필요하게 `new Date()` 생성자로 다시 JavaScript `Date` 객체로 변환함.
- **시간대 왜곡:** 이 과정에서 시간대 정보가 없는 문자열을 브라우저가 UTC 또는 시스템 기본값으로 해석하면서, 원래의 KST 시간이 왜곡되어 화면에 잘못 표시되는 문제가 발생함.

### 해결 방법

- **시간 처리 책임 표준화:** 데이터 시간 변환은 **백엔드에서만 책임**지고, 프론트엔드는 **전달받은 문자열을 그대로 표시**하는 것으로 역할을 명확히 분리함.
- **코드 수정:** `static/js/modules/data_analysis/ui.js` 파일에서 `new Date()`를 사용하여 날짜 객체를 재생성하는 모든 로직을 제거하고, 백엔드에서 받은 `row.start_dt` 문자열 값을 직접 출력하도록 수정함.
- **기대 효과:** 이 표준화를 통해 향후 유사한 시간대 관련 버그의 재발 가능성을 원천적으로 차단함.

---

## 4. SPA 환경에서의 프론트엔드 렌더링 타이밍 문제 (2025-11-13 해결)

### 원인

`router.js`를 통해 페이지 콘텐츠를 동적으로 주입하는 SPA(Single Page Application) 환경에서, CSS 파일이 완전히 로드 및 적용되기 전에 JavaScript가 먼저 실행되는 **타이밍 문제(Race Condition)** 가 반복적으로 발생함.

이로 인해 다음과 같은 두 가지 문제가 발생함:

1.  **카드 요약 페이지:** 데이터가 없을 때, `.no-data` 메시지를 중앙 정렬하는 기준이 되는 부모 컨테이너(`#cardContainer`)의 `min-height` CSS 속성이 적용되지 않아 레이아웃이 깨짐.
2.  **차트 분석 페이지:** Chart.js 라이브러리가 차트 크기를 계산하는 시점에, 부모 컨테이너(`.chart-container`)의 `min-height`가 적용되지 않아 차트가 의도보다 작은 크기(`150px`)로 렌더링됨.

### 해결 방법

각 문제의 특성에 맞는 JavaScript 기반의 해결책을 적용하여, CSS 로딩 시점과 관계없이 안정적인 렌더링을 보장하도록 수정함.

1.  **카드 요약 페이지 (직접 스타일 주입):**
    -   **파일:** `static/js/pages/card_summary.js`
    -   **로직:** 콘텐츠를 렌더링하기 직전에, JavaScript로 부모 컨테이너(`#cardContainer`)에 `style.minHeight = '100px'`를 직접 설정함. 이를 통해 `position: absolute`인 자식 요소가 항상 올바른 높이를 기준으로 중앙 정렬되도록 보장함.

2.  **차트 분석 페이지 (`ResizeObserver` 사용):**
    -   **파일:** `static/js/modules/chart_analysis/ui.js`
    -   **로직:** Chart.js로 차트를 생성한 후, 웹 표준 API인 `ResizeObserver`를 사용해 부모 컨테이너의 크기 변경을 감시함. 컨테이너가 CSS에 의해 올바른 높이(`300px`)로 렌더링되는 시점을 정확히 감지하여, `chart.resize()`를 호출해 차트 크기를 동적으로 맞추도록 함. 이 방식은 `setTimeout`과 같은 불안정한 기법을 사용하지 않는 가장 현대적이고 안정적인 해결책임.

---

## 5. SPA 라우터의 페이지별 CSS 미처리 및 레이아웃 중앙 정렬 문제 (2025-11-14 해결)

### 원인

두 가지 문제가 복합적으로 작용하여 '카드 요약' 페이지의 레이아웃이 깨지는 현상이 발생함.

1.  **SPA 라우터의 CSS 처리 누락:** `static/js/router.js`는 페이지를 동적으로 전환할 때, 새로 불러온 HTML에서 `#main-content` 영역만 추출하여 교체하고 `<head>` 영역은 무시함. 이로 인해 `card_summary.html`의 `{% block head %}`에 정의된 페이지별 스타일시트(`card_summary.css`)가 DOM에 추가되지 않아 전혀 적용되지 않음.
2.  **전역 CSS의 중앙 정렬 누락:** `card_summary.html`의 최상위 레이아웃을 잡는 `.container` 클래스가 `static/css/common.css`에 정의되어 있었으나, `max-width` 속성만 있고 `margin: auto` 속성이 없어 중앙 정렬이 되지 않고 우측으로 쏠리는 현상이 발생함.

### 해결 방법

각 원인에 맞춰 시스템을 구조적으로 개선하는 방향으로 해결함.

1.  **SPA 라우터 기능 개선:**
    -   **파일:** `static/js/router.js`, `templates/card_summary.html`
    -   **로직:**
        -   `card_summary.html`의 페이지별 `<link>` 태그에 `id="page-specific-style"`를 부여하여 식별 가능하게 만듦.
        -   `router.js`에 `handlePageSpecificStyles` 함수를 추가하여, 페이지 전환 시 기존 `id`를 가진 스타일은 DOM에서 제거하고, 새로 불러온 페이지에 해당 `id`를 가진 스타일이 있으면 `<head>`에 동적으로 추가하도록 수정함.
    -   **기대 효과:** 이 개선을 통해 앞으로 모든 페이지가 자신만의 CSS 파일을 가질 수 있는 확장성 있는 구조를 갖추게 됨.

2.  **전역 CSS 수정:**
    -   **파일:** `static/css/common.css`
    -   **로직:** `.container` 클래스에 `margin-left: auto;`와 `margin-right: auto;` 속성을 추가하여, 이 클래스를 사용하는 모든 콘텐츠가 뷰포트 중앙에 위치하도록 수정함.

---

## 6. 인증 및 사용자 관리 기능의 구조적 문제 (2025-11-17 해결)

### 원인

인증 및 사용자 관리 기능 전반에 걸쳐 여러 구조적인 문제가 복합적으로 존재하여 데이터 불일치, 비정상적인 세션 동작, 추적의 어려움 등 다양한 버그를 유발함.

1.  **부적절한 트랜잭션 관리:** `UserDao`의 각 메서드(`save`, `update` 등) 내부에서 개별적으로 `conn.commit()`을 호출하여, 여러 DB 작업을 하나의 논리적 단위로 묶는 것이 불가능했음. 이로 인해 회원가입 과정에서 사용자 정보 저장 후 이벤트 로그 저장에 실패할 경우, 사용자 데이터만 저장되고 롤백되지 않는 데이터 정합성 문제가 발생함.
2.  **IP 주소 로깅 누락:** 모든 로그에 요청 IP가 기록되지 않아, 보안 감사나 비정상적인 접근을 추적하는 데 어려움이 있었음.
3.  **사용자 승인 시 비밀번호 강제 초기화:** 관리자가 사용자를 승인할 때, 가입 시 입력한 비밀번호가 사용자 ID와 동일하게 강제로 초기화되는 로직이 포함되어 있어 사용자에게 큰 혼란을 유발함.
4.  **전역 설정을 이용한 잘못된 세션 관리:** `login` 함수에서 사용자 유형(관리자/일반)에 따라 애플리케이션의 전역 세션 설정(`current_app.permanent_session_lifetime`)을 동적으로 변경함. 이로 인해 한 명의 관리자가 로그인하면, 그 이후에 접속하는 모든 일반 사용자의 세션 유지 시간이 비정상적으로 길어지는 문제가 발생함.

### 해결 방법

각 문제의 원인을 해결하기 위해 시스템 구조를 개선하는 방향으로 수정함.

1.  **트랜잭션 관리 책임 이전:**
    -   **파일:** `dao/user_dao.py`, `routes/auth_routes.py`
    -   **로직:** `UserDao` 내의 모든 `conn.commit()` 호출을 제거하고, 실제 비즈니스 로직이 처리되는 `routes/auth_routes.py`의 각 함수(`register`, `change_password` 등)에서 모든 DB 작업이 끝난 후 `conn.commit()`을, 오류 발생 시 `conn.rollback()`을 호출하도록 수정하여 트랜잭션의 원자성을 보장함.

2.  **전역 IP 주소 로깅 추가:**
    -   **파일:** `msys_app.py`
    -   **로직:** `logging.Filter`를 상속하는 `RequestContextFilter` 클래스를 구현하여, 모든 요청의 IP 주소(`request.remote_addr`)를 로그 레코드에 주입하도록 함. 로그 포맷터에 `%(remote_addr)s`를 추가하여 모든 로그에 IP가 자동으로 기록되도록 개선함.

3.  **승인 시 비밀번호 초기화 기능 제거:**
    -   **파일:** `service/user_service.py`
    -   **로직:** `approve_user` 메서드에서 비밀번호를 해싱하고 업데이트하는 코드를 제거(주석 처리)함. 이제 사용자 승인 시 계정 상태만 변경되고, 사용자가 가입 시 설정한 비밀번호는 그대로 유지됨.

4.  **사용자별 세션 만료 시간 설정:**
    -   **파일:** `routes/auth_routes.py`
    -   **로직:** `login` 함수에서 위험한 전역 설정 변경 코드를 제거함. 대신, 사용자 ID를 확인하여 관리자인 경우 `timedelta(days=365)`를, 일반 사용자인 경우 `current_app.config['PERMANENT_SESSION_LIFETIME']`을 `lifetime`이라는 지역 변수에 할당하고, 이 변수를 사용하여 각 사용자의 세션 만료 시간(`session['expiry_time']`)을 개별적으로 설정하도록 수정함.

---

## 7. CSS 로딩 순서 문제로 인한 모달 자동 열림 (2025-12-24 해결)

### 원인

CSS 파일 로딩 순서가 잘못되어 `modal-backdrop`의 `display: flex` 스타일이 `hidden` 클래스의 `display: none`보다 우선 적용되는 CSS 우선순위 문제가 발생함.

**문제의 CSS 로딩 순서:**
```html
<!-- 잘못된 순서 -->
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/components.css">  ← modal-backdrop 스타일
<link rel="stylesheet" href="css/utilities.css">   ← hidden 클래스
```

**CSS 우선순위 규칙 위반:**
- CSS는 나중에 로드된 파일이 우선 적용됨
- `components.css`의 `modal-backdrop { display: flex }`가 `utilities.css`의 `.hidden { display: none }`보다 우선 적용됨
- 결과적으로 `hidden` 클래스가 있어도 모달이 보이게 됨

### 해결 방법

**CSS 로딩 순서를 올바르게 수정:**
```html
<!-- 올바른 순서 -->
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/utilities.css">   ← hidden 클래스 먼저 로드
<link rel="stylesheet" href="css/components.css">  ← modal-backdrop 스타일 나중에 로드
```

**파일 변경:**
- `templates/base.html`: CSS 로딩 순서 변경
- `static/css/components.css`: 임시 우선순위 강제 코드 제거

### 기대 효과

- 모달 숨김 상태가 정상적으로 적용됨
- CSS 우선순위 규칙 준수로 유사 문제 재발 방지
- 모든 페이지에 적용되는 공통 모듈(base.html) 수정으로 일관성 확보

---

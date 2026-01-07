# MSYS 데이터 호출 흐름 디버깅 가이드

이 가이드는 각 메뉴 페이지의 카드(컴포넌트)를 기준으로 데이터 호출 과정을 TB→DAO→Service→Route→HTML 역순으로 추적하여 설명합니다.

## 메뉴 페이지별 카드 컴포넌트 데이터 호출 가이드

### 1. 대시보드 페이지

#### 1.1 요약 카드 컴포넌트 (dashboard_data)
**HTML (templates/dashboard.html)에서 요약 카드에 표시되는 `dashboard_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <!-- dashboard.html -->
   {% for item in dashboard_data %}
     <div>Job: {{ item.cd_nm }}, 성공률: {{ item.success_rate }}%</div>
   {% endfor %}
   ```
   → `dashboard_data` 리스트의 각 항목에 `cd_nm`(Job 이름), `success_rate`(성공률) 등이 필요

2. **JavaScript API 호출:**
   ```javascript
   // static/js/modules/dashboard/dashboard.js
   const response = await fetch('/api/dashboard/summary?start_date=2025-12-01&end_date=2025-12-31');
   const data = await response.json(); // data 변수에 API 결과 저장
   ```
   → `loadDashboardData()` 함수가 `/api/dashboard/summary` API를 호출하여 `data` 변수에 저장

3. **권한 검증 및 에러 처리:**
   ```javascript
   // 권한 부족 시 처리
   if (response.status === 403) {
       alert('대시보드 접근 권한이 없습니다.');
       return;
   }
   if (response.status === 401) {
       alert('로그인이 필요합니다.');
       window.location.href = '/login';
       return;
   }
   ```

4. **Route 레벨 처리:**
   ```python
   # routes/api/dashboard_api.py
   @dashboard_bp.route('/summary')
   def summary():
       # 권한 미들웨어 적용
       if not current_user.is_authenticated:
           return jsonify({'error': '로그인 필요'}), 401

       if 'dashboard' not in current_user.permissions:
           return jsonify({'error': '대시보드 접근 권한 없음'}), 403

       start_date = request.args.get('start_date')
       end_date = request.args.get('end_date')
       user = get_current_user()

       try:
           result = dashboard_service.get_summary(start_date, end_date, user)  # result 변수에 Service 결과 저장
           return jsonify(result)
       except Exception as e:
           logger.error(f"대시보드 데이터 조회 실패: {e}")
           return jsonify({'error': '데이터 조회 실패'}), 500
   ```
   → `summary()` 함수가 `result` 변수에 `dashboard_service.get_summary()` 결과를 저장

5. **Service 레벨 처리:**
   ```python
   # service/dashboard_service.py
   def get_summary(self, start_date, end_date, user):
       try:
           # 1. 권한 검증 및 허용 Job ID 필터링
           allowed_job_ids = self._get_allowed_job_ids(user)
           if allowed_job_ids is not None and not allowed_job_ids:
               logger.warning(f"사용자 {user.id}: 접근 가능한 Job 없음")
               return []  # 빈 배열 반환

           # 2. 관리자 설정 로드
           settings_map = self._fetch_manager_settings_with_icons()

           # 3. DAO 호출
           raw_data = self.dashboard_mapper.get_summary(start_date, end_date, False, allowed_job_ids)

           # 4. 비즈니스 로직 처리
           processed_data = []  # processed_data 변수에 최종 가공 데이터 저장
           for item in raw_data:
               job_id = item['job_id']

               # Job 이름 조회
               job_info = self._get_job_info(job_id)

               # 연속 실패 계산
               fail_streak = self._calculate_fail_streak(job_id)

               # 상태 결정 (설정 임계값 기반)
               job_settings = settings_map.get(job_id, DEFAULT_ADMIN_SETTINGS)
               threshold = job_settings.get('dly_sucs_rt_thrs_val', 80)

               if item['success_rate'] >= threshold:
                   status = 'normal'
               else:
                   status = 'warning'

               processed_item = {
                   'job_id': job_id,
                   'cd_nm': job_info.get('cd_nm', job_id),
                   'success_rate': item['success_rate'],
                   'total_count': item['total_count'],
                   'status': status,
                   'fail_streak': fail_streak
               }
               processed_data.append(processed_item)

           logger.info(f"대시보드 데이터 처리 완료: {len(processed_data)}개 Job")
           return processed_data  # 최종 결과 반환

       except Exception as e:
           logger.error(f"대시보드 데이터 처리 실패: {e}")
           raise
   ```
   → `get_summary()` 함수가 `processed_data` 리스트를 반환

6. **DAO 레벨 처리:**
   ```python
   # mapper/dashboard_mapper.py
   def get_summary(self, start_date, end_date, all_data, job_ids):
       try:
           query = """
               SELECT
                   job_id,
                   COUNT(*) as total_count,
                   SUM(CASE WHEN status = 'CD901' THEN 1 ELSE 0 END) as success_count,
                   ROUND(
                       (SUM(CASE WHEN status = 'CD901' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)), 2
                   ) as success_rate
               FROM tb_con_hist
               WHERE start_dt >= %s AND start_dt <= %s
               {job_filter}
               GROUP BY job_id
               ORDER BY job_id
           """

           params = [start_date, end_date]
           job_filter = ""
           if job_ids and len(job_ids) > 0:
               job_filter = "AND job_id IN ({})".format(','.join(['%s'] * len(job_ids)))
               params.extend(job_ids)

           results = self._execute_query(query, params)  # results 변수에 DB 결과 저장

           logger.debug(f"DAO 조회 결과: {len(results)}개 Job 데이터")
           return results

       except Exception as e:
           logger.error(f"대시보드 DAO 조회 실패: {e}")
           raise
   ```
   → `get_summary()` 함수가 `results` 리스트 반환 (각 Job별 통계 데이터)

7. **DB 레벨 처리:**
   ```sql
   -- tb_con_hist 테이블에서 데이터 조회 (tb_mngr_sett와 조인)
   SELECT
       h.job_id,
       COUNT(*) as total_count,
       SUM(CASE WHEN h.status = 'CD901' THEN 1 ELSE 0 END) as success_count,
       ROUND(
           (SUM(CASE WHEN h.status = 'CD901' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
       ) as success_rate
   FROM tb_con_hist h
   LEFT JOIN tb_mngr_sett s ON h.job_id = s.cd
   WHERE h.start_dt >= '2025-12-01' AND h.start_dt <= '2025-12-31'
   AND h.job_id IN ('CD101', 'CD102')  -- 권한에 따른 필터링
   GROUP BY h.job_id
   ORDER BY h.job_id;

   -- 결과 예시:
   -- job_id: 'CD101', total_count: 3, success_count: 2, success_rate: 66.67
   -- job_id: 'CD102', total_count: 1, success_count: 1, success_rate: 100.0
   ```
   → `tb_con_hist` 테이블에서 Job별 통계 계산, `tb_mngr_sett`와 조인하여 설정값 적용

### 최종 데이터 흐름 요약:
```
HTML (dashboard_data)
    ↓ JavaScript fetch() 호출
data (API 응답 - 권한 에러 가능)
    ↓ Route summary() 함수 - 권한 체크
result (JSON 응답 - 에러 응답 가능)
    ↓ Service get_summary() 함수 - 비즈니스 로직
processed_data (가공된 데이터 - 빈 배열 가능)
    ↓ DAO get_summary() 함수 - SQL 실행
results (DB 조회 결과 - 빈 결과 가능)
    ↓ DB SQL 실행
tb_con_hist + tb_mngr_sett 테이블 데이터
```

### 권한 문제 및 에러 케이스:

#### 케이스 1: 로그인하지 않은 사용자
- **발생 지점:** Route 레벨 권한 체크
- **에러 코드:** 401 Unauthorized
- **처리 결과:** 로그인 페이지로 리디렉션
- **로그 메시지:** "사용자 인증 필요"

#### 케이스 2: 대시보드 접근 권한 없음
- **발생 지점:** Route 레벨 메뉴 권한 체크
- **에러 코드:** 403 Forbidden
- **처리 결과:** 권한 없음 메시지 표시
- **로그 메시지:** "dashboard 권한 없음: user_id"

#### 케이스 3: 데이터 접근 권한 없음
- **발생 지점:** Service 레벨 Job ID 필터링
- **처리 결과:** 빈 배열 반환
- **로그 메시지:** "접근 가능한 Job 없음: user_id"
- **UI 표시:** "표시할 데이터가 없습니다"

#### 케이스 4: DB 연결 실패
- **발생 지점:** DAO 레벨 쿼리 실행
- **에러 코드:** 500 Internal Server Error
- **처리 결과:** 에러 메시지 표시
- **로그 메시지:** "DB 연결 실패"

#### 1.2 상세 테이블 카드 컴포넌트 (dashboard_table_data)
**HTML (templates/dashboard.html)에서 상세 테이블에 표시되는 `dashboard_table_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <!-- dashboard.html -->
   <table>
   {% for item in dashboard_table_data %}
     <tr>
       <td>{{ item.job_id }}</td>
       <td>{{ item.cd_nm }}</td>
       <td>{{ item.success_rate }}%</td>
       <td>{{ item.fail_streak }}</td>
     </tr>
   {% endfor %}
   </table>
   ```
   → `dashboard_table_data` 리스트의 각 항목에 상세 정보 표시

2. **JavaScript API 호출:**
   ```javascript
   // 동일한 loadDashboardData() 함수에서 dashboard_data와 함께 처리
   const { data } = await loadDashboardData();
   // data는 dashboard_data와 동일한 배열
   ```

3. **권한 검증 및 에러 처리:** (요약 카드와 동일)

4. **Route/Service/DAO/DB:** (요약 카드와 동일한 데이터 소스 사용)

### 데이터 흐름 요약:
```
HTML (dashboard_table_data - 동일한 dashboard_data 사용)
    ↓ JavaScript 동일 API 호출
data (동일한 API 응답)
    ↓ 동일한 Route/Service/DAO/DB 처리
```

---

### 2. 데이터 분석 페이지

#### 2.1 요약 통계 카드 컴포넌트 (summary_data)
**HTML (templates/data_analysis.html)에서 요약 통계 카드에 표시되는 `summary_data` 호출:**

**HTML (templates/data_analysis.html)에서 `summary_data`라는 데이터를 호출할 경우:**

1. **HTML 템플릿 요구사항:**
   ```html
   <!-- data_analysis.html -->
   <div>총 데이터 건수: {{ summary_data.total_count }}</div>
   <div>평균 성공률: {{ summary_data.avg_success_rate }}%</div>
   ```
   → `summary_data` 객체에 `total_count`(총 건수), `avg_success_rate`(평균 성공률) 등이 필요

2. **JavaScript API 호출:**
   ```javascript
   // static/js/modules/data_analysis/data.js
   const response = await fetch('/api/analysis/summary?start_date=2025-12-01&end_date=2025-12-07');
   const summaryData = await response.json(); // summaryData 변수에 API 결과 저장
   ```
   → `fetchSummaryData()` 함수가 `/api/analysis/summary` API를 호출하여 `summaryData` 변수에 저장

3. **권한 검증 및 에러 처리:**
   ```javascript
   // 권한 부족 시 처리
   if (response.status === 403) {
       alert('데이터 분석 접근 권한이 없습니다.');
       return;
   }
   ```

4. **Route 레벨 처리:**
   ```python
   # routes/api/analysis_api.py
   @analysis_bp.route('/summary')
   def get_summary():
       if 'data_analysis' not in current_user.permissions:
           return jsonify({'error': '데이터 분석 권한 없음'}), 403

       start_date = request.args.get('start_date')
       end_date = request.args.get('end_date')
       job_ids = request.args.getlist('job_ids')

       try:
           result = analysis_service.get_summary_data(start_date, end_date, job_ids, current_user)
           return jsonify(result)
       except Exception as e:
           logger.error(f"데이터 분석 요약 조회 실패: {e}")
           return jsonify({'error': '요약 데이터 조회 실패'}), 500
   ```

5. **Service 레벨 처리:**
   ```python
   # service/analysis_service.py
   def get_summary_data(self, start_date, end_date, job_ids, user):
       # 권한에 따른 데이터 필터링
       allowed_job_ids = self._get_allowed_job_ids_for_analysis(user, job_ids)

       # DAO 호출
       raw_summary = self.analysis_mapper.get_summary_stats(start_date, end_date, allowed_job_ids)

       # 데이터 가공
       summary_data = {
           'total_count': raw_summary['total_count'],
           'avg_success_rate': round(raw_summary['avg_success_rate'], 2),
           'period_days': raw_summary['period_days']
       }

       return summary_data
   ```

6. **DAO 레벨 처리:**
   ```python
   # dao/analytics_dao.py
   def get_summary_stats(self, start_date, end_date, job_ids):
       query = """
           SELECT
               COUNT(*) as total_count,
               AVG(CASE WHEN status = 'CD901' THEN 100 ELSE 0 END) as avg_success_rate,
               EXTRACT(DAY FROM AGE(%s::timestamp, %s::timestamp)) + 1 as period_days
           FROM tb_con_hist
           WHERE start_dt BETWEEN %s AND %s
           AND (%s IS NULL OR job_id = ANY(%s))
       """

       params = [end_date, start_date, start_date, end_date, job_ids, job_ids]
       result = self._execute_single_row_query(query, params)

       return result
   ```

7. **DB 레벨 처리:**
   ```sql
   -- tb_con_hist 테이블에서 요약 통계 계산
   SELECT
       COUNT(*) as total_count,
       AVG(CASE WHEN status = 'CD901' THEN 100 ELSE 0 END) as avg_success_rate,
       EXTRACT(DAY FROM AGE('2025-12-07'::timestamp, '2025-12-01'::timestamp)) + 1 as period_days
   FROM tb_con_hist
   WHERE start_dt BETWEEN '2025-12-01' AND '2025-12-07'
   AND job_id = ANY(ARRAY['CD101', 'CD102']);

   -- 결과 예시:
   -- total_count: 45, avg_success_rate: 87.5, period_days: 7
   ```

#### 2.2 추이 차트 카드 컴포넌트 (trend_data)
**HTML (templates/data_analysis.html)에서 추이 차트에 표시되는 `trend_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <!-- data_analysis.html -->
   <canvas id="trendChart"></canvas>
   <!-- trend_data를 사용한 차트 렌더링 -->
   ```

2. **JavaScript API 호출:**
   ```javascript
   // static/js/modules/data_analysis/data.js
   const response = await fetch('/api/analysis/trend?start_date=2025-12-01&end_date=2025-12-07');
   const trendData = await response.json();
   ```

3. **Route/Service/DAO/DB:** (요약 통계와 유사한 구조)

#### 2.3 원천 데이터 테이블 카드 컴포넌트 (raw_data)
**HTML (templates/data_analysis.html)에서 원천 데이터 테이블에 표시되는 `raw_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <!-- data_analysis.html -->
   <table>
   {% for item in raw_data %}
     <tr>
       <td>{{ item.job_id }}</td>
       <td>{{ item.start_dt }}</td>
       <td>{{ item.status }}</td>
     </tr>
   {% endfor %}
   </table>
   ```

2. **JavaScript API 호출:**
   ```javascript
   const response = await fetch('/api/analysis/raw?start_date=2025-12-01&end_date=2025-12-07');
   const rawData = await response.json();
   ```

---

### 3. 차트 분석 페이지

#### 3.1 성공률 추이 차트 카드 (chart_trend_data)
**HTML (templates/chart_analysis.html)에서 성공률 추이 차트에 표시되는 `chart_trend_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <canvas id="successRateChart"></canvas>
   ```

2. **JavaScript API 호출:**
   ```javascript
   // static/js/modules/chart_analysis/chart.js
   const response = await fetch('/api/chart/trend?start_date=2025-12-01&end_date=2025-12-31');
   const chartData = await response.json();
   ```

#### 3.2 장애 코드 현황 차트 카드 (error_stats_data)
**HTML (templates/chart_analysis.html)에서 장애 코드 현황 차트에 표시되는 `error_stats_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <canvas id="errorStatsChart"></canvas>
   ```

2. **JavaScript API 호출:**
   ```javascript
   const response = await fetch('/api/chart/errors?start_date=2025-12-01&end_date=2025-12-31');
   const errorData = await response.json();
   ```

---

### 4. 카드 요약 페이지

#### 4.1 그룹별 요약 카드 컴포넌트 (card_summary_data)
**HTML (templates/card_summary.html)에서 그룹별 카드에 표시되는 `card_summary_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   {% for group in card_summary_data %}
   <div class="summary-card">
     <h3>{{ group.group_name }}</h3>
     <div>총 {{ group.total_count }}건</div>
     <div>성공 {{ group.success_count }}건</div>
   </div>
   {% endfor %}
   ```

2. **JavaScript API 호출:**
   ```javascript
   // static/js/pages/card_summary.js
   const response = await fetch('/api/card/summary');
   const cardData = await response.json();
   ```

---

### 5. 관리자 설정 페이지

#### 5.1 기본 설정 탭 카드 (admin_basic_data)
**HTML (templates/mngr_sett.html)에서 기본 설정 탭에 표시되는 `admin_basic_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <table id="basicSettingsTable">
   {% for item in admin_basic_data %}
     <tr>
       <td>{{ item.cd }}</td>
       <td>{{ item.cnn_failr_thrs_val }}</td>
       <td>{{ item.dly_sucs_rt_thrs_val }}</td>
     </tr>
   {% endfor %}
   </table>
   ```

2. **JavaScript API 호출:**
   ```javascript
   // static/js/pages/mngr_sett.js
   const response = await fetch('/api/admin/basic');
   const basicData = await response.json();
   ```

#### 5.2 수집 스케줄 설정 탭 카드 (admin_schedule_data)
**HTML (templates/mngr_sett.html)에서 수집 스케줄 설정 탭에 표시되는 `admin_schedule_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <div id="scheduleSettings">
   <label>그룹 최소 개수: <input type="number" id="grpMinCnt" value="{{ admin_schedule_data.grp_min_cnt }}"></label>
   <label>그룹 외곽선: <select id="grpBorderStyle">{{ admin_schedule_data.grp_brdr_styl_options }}</select></label>
   </div>
   ```

2. **JavaScript API 호출:**
   ```javascript
   const response = await fetch('/api/admin/schedule');
   const scheduleData = await response.json();
   ```

#### 5.3 아이콘 관리 탭 카드 (admin_icon_data)
**HTML (templates/mngr_sett.html)에서 아이콘 관리 탭에 표시되는 `admin_icon_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <table id="iconTable">
   {% for icon in admin_icon_data %}
     <tr>
       <td>{{ icon.icon_cd }}</td>
       <td>{{ icon.icon_nm }}</td>
       <td>{{ icon.icon_dsp_yn }}</td>
     </tr>
   {% endfor %}
   </table>
   ```

2. **JavaScript API 호출:**
   ```javascript
   const response = await fetch('/api/admin/icons');
   const iconData = await response.json();
   ```

#### 5.4 차트/시각화 설정 탭 카드 (admin_chart_data)
**HTML (templates/mngr_sett.html)에서 차트 설정 탭에 표시되는 `admin_chart_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <table id="chartSettingsTable">
   {% for item in admin_chart_data %}
     <tr>
       <td>{{ item.cd }}</td>
       <td><input type="color" value="{{ item.chrt_colr }}"></td>
       <td><input type="color" value="{{ item.grass_chrt_min_colr }}"></td>
     </tr>
   {% endfor %}
   </table>
   ```

2. **JavaScript API 호출:**
   ```javascript
   const response = await fetch('/api/admin/chart');
   const chartData = await response.json();
   ```

#### 5.5 사용자 관리 탭 카드 (admin_user_data)
**HTML (templates/mngr_sett.html)에서 사용자 관리 탭에 표시되는 `admin_user_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <table id="userTable">
   {% for user in admin_user_data %}
     <tr>
       <td>{{ user.user_id }}</td>
       <td>{{ user.acc_sts }}</td>
       <td>{{ user.permissions | join(', ') }}</td>
     </tr>
   {% endfor %}
   </table>
   ```

2. **JavaScript API 호출:**
   ```javascript
   const response = await fetch('/api/admin/users');
   const userData = await response.json();
   ```

#### 5.6 데이터 접근 권한 탭 카드 (admin_permission_data)
**HTML (templates/mngr_sett.html)에서 데이터 접근 권한 탭에 표시되는 `admin_permission_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <div id="permissionSettings">
   <div id="unassignedJobs">{{ admin_permission_data.unassigned_jobs }}</div>
   <div id="assignedJobs">{{ admin_permission_data.assigned_jobs }}</div>
   </div>
   ```

2. **JavaScript API 호출:**
   ```javascript
   const response = await fetch('/api/admin/permissions');
   const permissionData = await response.json();
   ```

#### 5.7 통계 탭 카드 (admin_stats_data)
**HTML (templates/mngr_sett.html)에서 통계 탭에 표시되는 `admin_stats_data` 호출:**

1. **HTML 템플릿 요구사항:**
   ```html
   <div id="statsContainer">
   <div id="dailyStats">{{ admin_stats_data.daily }}</div>
   <div id="weeklyStats">{{ admin_stats_data.weekly }}</div>
   <div id="comparisonStats">{{ admin_stats_data.comparison }}</div>
   </div>
   ```

2. **JavaScript API 호출:**
   ```javascript
   const response = await fetch('/api/admin/stats');
   const statsData = await response.json();
   ```

---

### 예시: 사용자 권한 정보 호출

**HTML (templates/base.html)에서 `current_user` 데이터를 호출할 경우:**

1. **HTML 템플릿 요구사항:**
   ```html
   <!-- base.html -->
   {% if current_user.is_admin %}
     <div>관리자 모드</div>
   {% endif %}
   <div>사용자: {{ current_user.username }}</div>
   ```
   → `current_user` 객체에 권한 정보와 사용자 정보 필요

2. **JavaScript API 호출:**
   ```javascript
   // 권한 정보는 페이지 로드 시 서버 사이드에서 주입됨
   const userPermissions = {{ current_user.permissions | tojson }};
   ```

3. **Route 레벨 (미들웨어):**
   ```python
   # utils/auth_middleware.py
   def get_current_user():
       if 'user_id' not in session:
           return None

       user_id = session['user_id']
       user = user_service.get_user_by_id(user_id)

       if not user:
           return None

       # 권한 정보 조회
       permissions = user_service.get_user_permissions(user_id)
       data_permissions = user_service.get_user_data_permissions(user_id)

       return {
           'id': user.user_id,
           'username': user.user_id,  # username 필드 없음
           'is_admin': 'mngr_sett' in permissions,
           'permissions': permissions,
           'data_permissions': data_permissions
       }
   ```

4. **Service 레벨:**
   ```python
   # service/user_service.py
   def get_user_permissions(self, user_id):
       return self.user_mapper.get_user_menu_permissions(user_id)

   def get_user_data_permissions(self, user_id):
       return self.user_mapper.get_user_data_permissions(user_id)
   ```

5. **DAO 레벨:**
   ```python
   # dao/user_dao.py
   def get_user_menu_permissions(self, user_id):
       query = """
           SELECT menu_id
           FROM tb_user_auth_ctrl
           WHERE user_id = %s AND auth_yn = true
       """
       results = self._execute_query(query, [user_id])
       return [row['menu_id'] for row in results]

   def get_user_data_permissions(self, user_id):
       query = """
           SELECT job_id
           FROM tb_user_data_perm_auth_ctrl
           WHERE user_id = %s AND perm_yn = true
       """
       results = self._execute_query(query, [user_id])
       return [row['job_id'] for row in results]
   ```

6. **DB 레벨:**
   ```sql
   -- tb_user_auth_ctrl에서 메뉴 권한 조회
   SELECT menu_id
   FROM tb_user_auth_ctrl
   WHERE user_id = 'admin' AND auth_yn = true;

   -- tb_user_data_perm_auth_ctrl에서 데이터 권한 조회
   SELECT job_id
   FROM tb_user_data_perm_auth_ctrl
   WHERE user_id = 'admin' AND perm_yn = true;
   ```

---

### 6. 인증 시스템

#### 6.1 회원가입 프로세스 (register_process)
**HTML (templates/login.html)에서 회원가입 폼을 통해 `register_process`를 실행할 경우:**

1. **HTML 템플릿 요구사항:**
   ```html
   <!-- login.html - 회원가입 탭 -->
   <form id="registerForm">
     <input type="text" id="userId" placeholder="사용자 ID">
     <input type="password" id="password" placeholder="비밀번호">
     <input type="password" id="confirmPassword" placeholder="비밀번호 확인">
     <button type="submit">가입 신청</button>
   </form>
   ```

2. **JavaScript API 호출:**
   ```javascript
   // static/js/pages/login.js
   const registerForm = document.getElementById('registerForm');
   registerForm.addEventListener('submit', async (e) => {
       e.preventDefault();
       const userId = document.getElementById('userId').value;
       const password = document.getElementById('password').value;

       const response = await fetch('/api/auth/register', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ user_id: userId, password: password })
       });

       const result = await response.json();
       if (response.ok) {
           alert('회원가입 신청이 완료되었습니다. 관리자 승인을 기다려주세요.');
       } else {
           alert(result.error || '회원가입 실패');
       }
   });
   ```

3. **권한 검증 및 에러 처리:**
   ```javascript
   // 회원가입은 별도 권한 검증 없음 (누구나 가능)
   // 비밀번호 정책 검증은 클라이언트 사이드에서 수행
   ```

4. **Route 레벨 처리:**
   ```python
   # routes/auth_routes.py
   @auth_bp.route('/register', methods=['POST'])
   def register():
       data = request.get_json()
       user_id = data.get('user_id')
       password = data.get('password')

       # 비밀번호 정책 검증
       if not validate_password_policy(password):
           return jsonify({'error': '비밀번호가 정책에 맞지 않습니다'}), 400

       # 사용자 ID 중복 체크
       if user_service.get_user_by_id(user_id):
           return jsonify({'error': '이미 존재하는 사용자 ID입니다'}), 400

       try:
           # 비밀번호 해싱
           hashed_password = hash_password(password)

           # 사용자 생성 (PENDING 상태)
           user_service.create_user(user_id, hashed_password)

           # 관리자에게 알림 (실제 구현에서는 이메일 등)
           notify_admin_new_registration(user_id)

           return jsonify({'message': '회원가입 신청 완료'}), 201

       except Exception as e:
           logger.error(f"회원가입 실패: {e}")
           return jsonify({'error': '회원가입 처리 중 오류 발생'}), 500
   ```

5. **Service 레벨 처리:**
   ```python
   # service/user_service.py
   def create_user(self, user_id, hashed_password):
       # 사용자 ID 중복 최종 검증
       if self.user_mapper.get_user_by_id(user_id):
           raise ValueError("사용자 ID가 이미 존재합니다")

       # 사용자 생성
       self.user_mapper.create_user(user_id, hashed_password)

       # 기본 권한 설정 (승인 대기 상태)
       # 실제 권한은 관리자 승인 후 부여됨

       logger.info(f"신규 사용자 생성: {user_id} (PENDING 상태)")

   def validate_password_policy(self, password):
       # 비밀번호 정책 검증 로직
       return (
           len(password) >= 8 and
           any(c.isupper() for c in password) and
           any(c.islower() for c in password) and
           any(c.isdigit() for c in password) and
           any(not c.isalnum() for c in password)
       )
   ```

6. **DAO 레벨 처리:**
   ```python
   # dao/user_dao.py
   def create_user(self, user_id, hashed_password):
       query = """
           INSERT INTO tb_user (user_id, user_pwd, acc_sts, acc_cre_dt)
           VALUES (%s, %s, 'PENDING', CURRENT_TIMESTAMP)
       """
       self._execute_query(query, [user_id, hashed_password])

   def get_user_by_id(self, user_id):
       query = "SELECT * FROM tb_user WHERE user_id = %s"
       result = self._execute_single_row_query(query, [user_id])
       return result
   ```

7. **DB 레벨 처리:**
   ```sql
   -- tb_user 테이블에 사용자 정보 삽입
   INSERT INTO tb_user (user_id, user_pwd, acc_sts, acc_cre_dt)
   VALUES ('newuser', 'hashed_password_here', 'PENDING', CURRENT_TIMESTAMP);

   -- 사용자 ID 중복 체크
   SELECT * FROM tb_user WHERE user_id = 'newuser';
   ```

#### 6.2 로그인 프로세스 (login_process)
**HTML (templates/login.html)에서 로그인 폼을 통해 `login_process`를 실행할 경우:**

1. **HTML 템플릿 요구사항:**
   ```html
   <!-- login.html - 로그인 탭 -->
   <form id="loginForm">
     <input type="text" id="loginUserId" placeholder="사용자 ID">
     <input type="password" id="loginPassword" placeholder="비밀번호">
     <button type="submit">로그인</button>
   </form>
   ```

2. **JavaScript API 호출:**
   ```javascript
   // static/js/pages/login.js
   const loginForm = document.getElementById('loginForm');
   loginForm.addEventListener('submit', async (e) => {
       e.preventDefault();
       const userId = document.getElementById('loginUserId').value;
       const password = document.getElementById('loginPassword').value;

       const response = await fetch('/api/auth/login', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ user_id: userId, password: password })
       });

       const result = await response.json();
       if (response.ok) {
           window.location.href = '/dashboard'; // 로그인 성공 시 리디렉션
       } else {
           alert(result.error || '로그인 실패');
       }
   });
   ```

3. **Route 레벨 처리:**
   ```python
   # routes/auth_routes.py
   @auth_bp.route('/login', methods=['POST'])
   def login():
       data = request.get_json()
       user_id = data.get('user_id')
       password = data.get('password')

       user = user_service.authenticate_user(user_id, password)
       if not user:
           return jsonify({'error': '아이디 또는 비밀번호가 올바르지 않습니다'}), 401

       # 계정 상태 검증
       if user['acc_sts'] == 'PENDING':
           return jsonify({'error': '관리자 승인을 기다리고 있습니다'}), 403
       elif user['acc_sts'] == 'REJECTED':
           return jsonify({'error': '회원가입이 거부되었습니다'}), 403
       elif user['acc_sts'] == 'SUSPENDED':
           return jsonify({'error': '계정이 정지되었습니다'}), 403

       # 세션 생성
       session['user_id'] = user_id
       session.permanent = True

       logger.info(f"사용자 로그인: {user_id}")
       return jsonify({'message': '로그인 성공', 'redirect': '/dashboard'}), 200
   ```

4. **Service 레벨 처리:**
   ```python
   # service/user_service.py
   def authenticate_user(self, user_id, password):
       user = self.user_mapper.get_user_by_id(user_id)
       if not user:
           return None

       # 비밀번호 검증
       if not verify_password(password, user['user_pwd']):
           return None

       return user
   ```

5. **DAO 레벨 처리:**
   ```python
   # dao/user_dao.py
   def get_user_by_id(self, user_id):
       query = """
           SELECT user_id, user_pwd, acc_sts, acc_cre_dt, acc_apr_dt
           FROM tb_user
           WHERE user_id = %s
       """
       result = self._execute_single_row_query(query, [user_id])
       return result
   ```

6. **DB 레벨 처리:**
   ```sql
   -- 사용자 정보 조회
   SELECT user_id, user_pwd, acc_sts, acc_cre_dt, acc_apr_dt
   FROM tb_user
   WHERE user_id = 'admin';
   ```

#### 6.3 비밀번호 변경 프로세스 (password_change_process)
**HTML (templates/change_password.html)에서 비밀번호 변경 폼을 통해 `password_change_process`를 실행할 경우:**

1. **HTML 템플릿 요구사항:**
   ```html
   <!-- change_password.html -->
   <form id="changePasswordForm">
     <input type="password" id="currentPassword" placeholder="현재 비밀번호">
     <input type="password" id="newPassword" placeholder="새 비밀번호">
     <input type="password" id="confirmNewPassword" placeholder="새 비밀번호 확인">
     <button type="submit">비밀번호 변경</button>
   </form>
   ```

2. **JavaScript API 호출:**
   ```javascript
   // static/js/pages/change_password.js
   const changePasswordForm = document.getElementById('changePasswordForm');
   changePasswordForm.addEventListener('submit', async (e) => {
       e.preventDefault();
       const currentPassword = document.getElementById('currentPassword').value;
       const newPassword = document.getElementById('newPassword').value;

       const response = await fetch('/api/auth/change_password', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
               current_password: currentPassword,
               new_password: newPassword
           })
       });

       const result = await response.json();
       if (response.ok) {
           alert('비밀번호가 성공적으로 변경되었습니다.');
           window.location.href = '/dashboard';
       } else {
           alert(result.error || '비밀번호 변경 실패');
       }
   });
   ```

3. **Route 레벨 처리:**
   ```python
   # routes/auth_routes.py
   @auth_bp.route('/change_password', methods=['POST'])
   @login_required
   def change_password():
       data = request.get_json()
       current_password = data.get('current_password')
       new_password = data.get('new_password')

       user_id = session.get('user_id')

       # 현재 비밀번호 검증
       user = user_service.authenticate_user(user_id, current_password)
       if not user:
           return jsonify({'error': '현재 비밀번호가 올바르지 않습니다'}), 400

       # 새 비밀번호 정책 검증
       if not user_service.validate_password_policy(new_password):
           return jsonify({'error': '새 비밀번호가 정책에 맞지 않습니다'}), 400

       try:
           # 비밀번호 변경
           hashed_new_password = hash_password(new_password)
           user_service.update_user_password(user_id, hashed_new_password)

           # 세션 갱신 (보안)
           session.clear()
           session['user_id'] = user_id

           logger.info(f"비밀번호 변경: {user_id}")
           return jsonify({'message': '비밀번호 변경 성공'}), 200

       except Exception as e:
           logger.error(f"비밀번호 변경 실패: {e}")
           return jsonify({'error': '비밀번호 변경 중 오류 발생'}), 500
   ```

4. **Service 레벨 처리:**
   ```python
   # service/user_service.py
   def update_user_password(self, user_id, hashed_new_password):
       self.user_mapper.update_user_password(user_id, hashed_new_password)
       logger.info(f"사용자 비밀번호 업데이트: {user_id}")
   ```

5. **DAO 레벨 처리:**
   ```python
   # dao/user_dao.py
   def update_user_password(self, user_id, hashed_new_password):
       query = "UPDATE tb_user SET user_pwd = %s WHERE user_id = %s"
       self._execute_query(query, [hashed_new_password, user_id])
   ```

6. **DB 레벨 처리:**
   ```sql
   -- 비밀번호 업데이트
   UPDATE tb_user SET user_pwd = 'new_hashed_password' WHERE user_id = 'admin';
   ```

#### 6.4 권한 인증 및 검증 프로세스 (permission_check_process)
**모든 보호된 페이지/API에서 `permission_check_process`를 통해 권한을 검증할 경우:**

1. **미들웨어 적용 (모든 요청):**
   ```python
   # utils/auth_middleware.py
   @app.before_request
   def check_permissions():
       # 공개 경로 제외
       if request.path in ['/login', '/register', '/static']:
           return

       # 로그인 상태 검증
       if 'user_id' not in session:
           return redirect('/login')

       user_id = session['user_id']
       user = user_service.get_user_by_id(user_id)

       if not user:
           session.clear()
           return redirect('/login')

       # 계정 상태 검증
       if user['acc_sts'] != 'APPROVED':
           session.clear()
           flash('계정이 승인되지 않았습니다.')
           return redirect('/login')

       # 메뉴 권한 검증 (필요시)
       if request.path.startswith('/admin') and 'mngr_sett' not in user_permissions:
           flash('관리자 권한이 필요합니다.')
           return redirect('/dashboard')

       # 사용자 정보를 g 객체에 저장
       g.user = user
       g.permissions = user_service.get_user_permissions(user_id)
       g.data_permissions = user_service.get_user_data_permissions(user_id)
   ```

2. **API 레벨 권한 체크:**
   ```python
   # routes/api/dashboard_api.py
   @dashboard_bp.route('/summary')
   @login_required
   def summary():
       # 사용자 권한 확인
       if 'dashboard' not in g.permissions:
           return jsonify({'error': '대시보드 접근 권한 없음'}), 403

       # 데이터 접근 권한 확인
       allowed_job_ids = g.data_permissions
       if not allowed_job_ids:
           return jsonify([]), 200  # 빈 결과 반환

       # 이후 로직...
   ```

3. **데이터 필터링:**
   ```python
   # service/dashboard_service.py
   def get_summary(self, start_date, end_date, user):
       # 권한에 따른 Job ID 필터링
       allowed_job_ids = user.get('data_permissions', [])

       # 허용된 Job만 조회
       raw_data = self.dashboard_mapper.get_summary(
           start_date, end_date, False, allowed_job_ids
       )

       # 결과 반환...
   ```

---

## 디버깅 가이드

### 1. 데이터가 표시되지 않는 경우:
1. **브라우저 개발자 도구**에서 Network 탭 확인
2. API 호출이 403/401 에러인지 확인
3. 로그 파일에서 권한 관련 메시지 확인

### 2. 권한 문제 해결:
1. 사용자 관리 메뉴에서 권한 설정 확인
2. 데이터 접근 권한 탭에서 Job ID 권한 확인
3. 로그에서 "권한 없음" 메시지 확인

### 3. 데이터 이상 시:
1. 해당 DAO 메소드의 SQL 쿼리 확인
2. DB에서 직접 쿼리 실행하여 결과 확인
3. Service 레벨의 데이터 가공 로직 검증

이 가이드를 따라 각 데이터의 호출 경로를 추적하면 문제를 신속하게 해결할 수 있습니다.

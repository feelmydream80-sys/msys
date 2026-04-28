import logging
from mapper.analysis_mapper import AnalysisMapper
from utils.logging_config import log_operation

from typing import Optional, Dict, List

class AnalysisService:
    def __init__(self, db_connection):
        self.conn = db_connection
        self.mapper = AnalysisMapper(db_connection)
        self.logger = logging.getLogger(self.__class__.__name__)

    def get_dynamic_chart_data(self, params: dict, user: Optional[Dict] = None) -> list[dict]:
        """
        요청 파라미터를 기반으로 동적 차트 데이터를 조회합니다.
        사용자 권한에 따라 조회 가능한 job_id를 필터링합니다.
        """
        try:
            user_id = user.get('user_id') if user else 'None'
            log_operation("분석", "차트 데이터", "요청 처리", f"사용자: {user_id}")

            allowed_job_ids = self._get_allowed_job_ids(user, params.get('job_ids'))
            if allowed_job_ids is not None and not allowed_job_ids:
                log_operation("분석", "차트 데이터", "권한 필터링", f"{len(allowed_job_ids)}개 Job ID 허용", "WARNING")
                return []

            params['job_ids'] = allowed_job_ids

            data = self.mapper.get_dynamic_chart_data(params)
            log_operation("분석", "차트 데이터", "데이터 조회", f"{len(data)}건 반환")
            return data
        except ValueError as ve:
            log_operation("분석", "차트 데이터", "파라미터 검증", f"유효하지 않음: {str(ve)}", "ERROR")
            raise
        except Exception as e:
            log_operation("분석", "차트 데이터", "데이터 조회", f"실패: {type(e).__name__}", "ERROR")
            raise

    def _get_allowed_job_ids(self, user: Optional[Dict], requested_job_ids: Optional[List[str]] = None) -> Optional[List[str]]:
        if not user or 'mngr_sett' in user.get('permissions', []):
            return requested_job_ids

        user_permissions = set(user.get('data_permissions', []))
        if not user_permissions:
            return []

        if requested_job_ids:
            allowed = list(user_permissions.intersection(set(requested_job_ids)))
            logging.info(f"User requested {requested_job_ids}, allowed: {allowed}")
            return allowed
        
        return list(user_permissions)

    # ==========================================
    # 사용자접속정보 탭용 메서드
    # ==========================================

    def get_user_list_with_stats(self, page: int = 1, page_size: int = 10, search_term: str = None, mode: str = 'all') -> Dict:
        """
        사용자 목록과 접속 통계를 조회합니다 (사용자접속정보 탭용).
        
        Args:
            page: 페이지 번호
            page_size: 페이지당 항목 수
            search_term: 검색어
            mode: 'all' (중복 포함, 기본값) 또는 'distinct' (1일 1접속)
        """
        from dao.analytics_dao import AnalyticsDAO
        
        try:
            dao = AnalyticsDAO(self.conn)
            result = dao.get_user_list_with_stats(page, page_size, search_term, mode)
            
            # 사용자 데이터 가공
            for user in result['items']:
                # 상태 계산
                user['status_info'] = self._calculate_user_status(user)
                # 이니셜 생성
                user['initials'] = self._get_initials(user['user_id'])
                # monthly_counts가 없으면 기본값 설정
                if 'monthly_counts' not in user:
                    user['monthly_counts'] = [0, 0, 0, 0, 0, 0]
                
            log_operation("분석", "사용자 목록", "조회", f"{len(result['items'])}건 반환 (mode={mode})")
            return result
        except Exception as e:
            log_operation("분석", "사용자 목록", "조회 실패", f"{type(e).__name__}: {str(e)}", "ERROR")
            raise

    def get_user_detail_stats(self, user_id: str, mode: str = 'all') -> Dict:
        """
        특정 사용자의 상세 통계를 조회합니다 (히트맵, 차트 데이터 포함).
        
        Args:
            user_id: 사용자 ID
            mode: 'all' (중복 포함, 기본값) 또는 'distinct' (1일 1접속)
        """
        from dao.analytics_dao import AnalyticsDAO
        
        try:
            dao = AnalyticsDAO(self.conn)
            
            # 기본 사용자 정보 (mode 전달)
            user_list = dao.get_user_list_with_stats(page=1, page_size=1, search_term=user_id, mode=mode)
            if not user_list['items']:
                raise ValueError(f"User not found: {user_id}")
            
            user = user_list['items'][0]
            
            # 히트맵 데이터 (최근 6개월 주차별)
            distinct_mode = (mode == 'distinct')
            heatmap = dao.get_user_weekly_heatmap(user_id, distinct_mode)
            
            # 시간대별 분포
            hourly = dao.get_user_hourly_distribution(user_id)
            
            # 최근 접속 로그
            logs = dao.get_user_recent_logs(user_id, limit=10)
            
            # 월별 추이 데이터 (실제 월별 데이터 조회)
            monthly_data = dao.get_user_monthly_heatmap(user_id, distinct_mode)
            
            # 연속 접속일 계산
            streak = self._calculate_streak(logs)
            
            # 지난 주/달 비교 데이터 (mode 전달)
            weekly_prev = self._get_previous_period_count(user_id, 'week', distinct_mode)
            monthly_prev = self._get_previous_period_count(user_id, 'month', distinct_mode)
            
            # monthly_counts에서 이번 달 값 추출 (첫 번째 요소)
            monthly_counts = user.get('monthly_counts', [0, 0, 0, 0, 0, 0])
            current_monthly = monthly_counts[0] if monthly_counts else 0
            
            # 주간 데이터에서 이번 주 값 추출 (마지막 요소가 최신)
            current_weekly = heatmap[-2] if len(heatmap) >= 2 and heatmap[-2] is not None else 0
            
            result = {
                'user_id': user['user_id'],
                'acc_sts': user['acc_sts'],
                'initials': self._get_initials(user['user_id']),
                'monthly': current_monthly,
                'weekly': current_weekly,
                'total': user['total_acs_cnt'],
                'streak': streak,
                'last_acs_dt': user['last_acs_dt'],
                'hm': heatmap,
                'monthlyData': monthly_data,
                'hourData': hourly,
                'logs': logs,
                'weeklyPrev': weekly_prev,
                'monthlyPrev': monthly_prev,
                'status_info': self._calculate_user_status(user),
                'mode': mode
            }
            
            log_operation("분석", "사용자 상세", "조회", f"{user_id} 조회 완료 (mode={mode})")
            return result
        except Exception as e:
            log_operation("분석", "사용자 상세", "조회 실패", f"{user_id}: {type(e).__name__}", "ERROR")
            raise

    def _get_thresholds_from_db(self) -> Dict:
        """
        TB_CON_MST에서 CD991, CD992, CD993 임계값을 조회합니다.
        """
        default_thresholds = {
            'cd991': 30,   # 최근 접속 기준 (일)
            'cd992': 7,    # 활성 사용자 기준 (일)
            'cd993': 90    # 휴 면 전환 기준 (일)
        }
        
        try:
            with self.conn.cursor() as cur:
                query = """
                    SELECT cd, item1
                    FROM tb_con_mst
                    WHERE cd IN ('CD991', 'CD992', 'CD993')
                """
                cur.execute(query)
                rows = cur.fetchall()
                
                thresholds = default_thresholds.copy()
                for cd, item1 in rows:
                    if item1:
                        try:
                            value = int(item1)
                            if cd == 'CD991':
                                thresholds['cd991'] = value
                            elif cd == 'CD992':
                                thresholds['cd992'] = value
                            elif cd == 'CD993':
                                thresholds['cd993'] = value
                        except (ValueError, TypeError):
                            continue
                
                return thresholds
        except:
            return default_thresholds

    def _calculate_user_status(self, user: Dict) -> Dict:
        """
        사용자의 접속 상태를 계산합니다.
        TB_CON_MST의 CD991, CD992, CD993 값을 기준으로 계산합니다.
        """
        from datetime import datetime, timedelta
        
        if not user.get('last_acs_dt'):
            return {'label': '미접속', 'cls': 'b-gray'}
        
        try:
            # DB에서 임계값 조회
            thresholds = self._get_thresholds_from_db()
            cd991 = thresholds['cd991']  # 최근 접속 기준
            cd992 = thresholds['cd992']  # 활성 사용자 기준
            cd993 = thresholds['cd993']  # 휴 면 전환 기준
            
            last_access = datetime.strptime(user['last_acs_dt'].split()[0], '%Y-%m-%d')
            today = datetime.now()
            days_diff = (today - last_access).days
            
            if days_diff <= cd992:
                return {'label': '활성', 'cls': 'b-green'}
            elif days_diff <= cd991:
                return {'label': '최근', 'cls': 'b-amber'}
            elif days_diff <= cd993:
                return {'label': '저조', 'cls': 'b-gray'}
            else:
                return {'label': '휴 면', 'cls': 'b-red'}
        except:
            return {'label': '알 수 없음', 'cls': 'b-gray'}

    def _get_initials(self, user_id: str) -> str:
        """
        사용자 ID에서 이니셜을 생성합니다.
        """
        # user_id에서 알파벳만 추출하거나 기본값 반환
        import re
        letters = re.findall(r'[a-zA-Z]', user_id)
        if letters:
            return ''.join(letters[:2]).upper()
        return user_id[:2].upper() if user_id else '??'

    def _calculate_streak(self, logs: List[Dict]) -> int:
        """
        연속 접속일을 계산합니다.
        """
        from datetime import datetime, timedelta
        
        if not logs:
            return 0
        
        streak = 0
        today = datetime.now().date()
        
        for i, log in enumerate(logs):
            log_date = datetime.strptime(log['d'], '%Y-%m-%d').date()
            expected_date = today - timedelta(days=i)
            
            if log_date == expected_date:
                streak += 1
            else:
                break
        
        return streak

    def _get_previous_period_count(self, user_id: str, period: str = 'week', distinct_mode: bool = False) -> int:
        """
        이전 기간(주/월)의 접속 횟수를 조회합니다.
        
        Args:
            distinct_mode: True인 경우 1일 1접속으로 계산 (COUNT DISTINCT DATE)
        """
        try:
            # COUNT 표현식 결정
            count_expr = "COUNT(DISTINCT DATE(acs_dt))" if distinct_mode else "COUNT(*)"
            
            if period == 'week':
                query = f"""
                    SELECT {count_expr} as cnt FROM tb_user_acs_log
                    WHERE user_id = %s
                        AND acs_dt >= DATE_TRUNC('week', CURRENT_TIMESTAMP - INTERVAL '1 week')
                        AND acs_dt < DATE_TRUNC('week', CURRENT_TIMESTAMP)
                """
            else:  # month
                query = f"""
                    SELECT {count_expr} as cnt FROM tb_user_acs_log
                    WHERE user_id = %s
                        AND acs_dt >= DATE_TRUNC('month', CURRENT_TIMESTAMP - INTERVAL '1 month')
                        AND acs_dt < DATE_TRUNC('month', CURRENT_TIMESTAMP)
                """
            
            with self.conn.cursor() as cur:
                cur.execute(query, [user_id])
                result = cur.fetchone()
                return result[0] if result else 0
        except:
            return 0

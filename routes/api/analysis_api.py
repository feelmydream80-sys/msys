from flask import Blueprint, request, jsonify, session, current_app
import logging
from datetime import datetime
from functools import wraps
import pytz
import psycopg2.extras

from msys.database import get_db_connection
from utils.datetime_utils import convert_datetime_fields_to_kst_str
from utils.logging_config import log_operation
from dao.analytics_dao import AnalyticsDAO
from service.dashboard_service import DashboardService
from service.mst_service import ConMstService
from service.analysis_service import AnalysisService
from service.status_code_service import get_status_codes
from routes.auth_routes import login_required, check_password_change_required, analysis_required, data_analysis_required

analysis_api_bp = Blueprint('analysis_api', __name__, url_prefix='/api/analytics')

@analysis_api_bp.route('/success_rate_trend', methods=['GET'])
@login_required
@check_password_change_required
def get_analytics_success_rate_trend_api():
    """
    [분석 차트용] 기간별 Job ID별 수집 성공률 추이 데이터를 제공하는 API.
    """
    log_operation("분석", "성공률 추이", "API 요청", "수신됨")
    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')
            job_ids = request.args.getlist('job_ids')
            user = session.get('user')

            if not start_date_str or not end_date_str:
                log_operation("분석", "성공률 추이", "파라미터 검증", "날짜 누락", "WARNING")
                return jsonify({"message": "시작 및 종료 날짜가 필요합니다."}), 400
            try:
                start_date_obj = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date_obj = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                if start_date_obj > end_date_obj:
                    log_operation("분석", "성공률 추이", "파라미터 검증", "날짜 범위 오류", "WARNING")
                    return jsonify({"message": "시작 날짜는 종료 날짜보다 빠를 수 없습니다."}), 400
            except ValueError:
                log_operation("분석", "성공률 추이", "파라미터 검증", "날짜 형식 오류", "WARNING")
                return jsonify({"message": "날짜 형식이 유효하지 않습니다.YYYY-MM-DD 형식을 사용해주세요."}), 400

            trend_data = dashboard_service.get_analytics_success_rate_trend(start_date_str, end_date_str, job_ids, user=user)
            log_operation("분석", "성공률 추이", "응답 생성", f"{len(trend_data)}건 전송")
            return jsonify(trend_data), 200
    except Exception as e:
        log_operation("분석", "성공률 추이", "데이터 조회", f"실패: {type(e).__name__}", "ERROR")
        return jsonify({"message": "분석 성공률 추이 데이터 조회 중 오류가 발생했습니다."}), 500

@analysis_api_bp.route('/trouble_by_code', methods=['GET'])
@login_required
@check_password_change_required
def get_analytics_trouble_by_code_api():
    """
    [분석 차트용] 장애 코드별 비율 데이터를 제공하는 API.
    CD901(정상), CD904(계측중)를 제외한 실제 장애 코드들의 cd_nm을 표시합니다.
    """
    logging.info("▶ API: /api/analytics/trouble_by_code 요청 수신")
    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            mst_service = ConMstService(conn)
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')
            job_ids = request.args.getlist('job_ids')
            user = session.get('user')

            if not start_date_str or not end_date_str:
                return jsonify({"message": "시작 및 종료 날짜가 필요합니다."}), 400
            try:
                start_date_obj = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date_obj = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                if start_date_obj > end_date_obj:
                    return jsonify({"message": "시작 날짜는 종료 날짜보다 빠를 수 없습니다."}), 400
            except ValueError:
                return jsonify({"message": "날짜 형식이 유효하지 않습니다.YYYY-MM-DD 형식을 사용해주세요."}), 400

            trouble_data = dashboard_service.get_trouble_by_code(start_date_str, end_date_str, job_ids, user=user)

            # TB_STS_CD_MST에서 코드 정보(명칭+색상) 조회 - 일관성 확보
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("""
                SELECT CD, NM, BG_COLR, TXT_COLR 
                FROM TB_STS_CD_MST
            """)
            sts_cd_map = {row['cd']: row for row in cur.fetchall()}

            # 각 장애 코드에 명칭과 색상 정보 추가
            for item in trouble_data:
                error_code = item.get('error_code')
                if error_code in sts_cd_map:
                    code_info = sts_cd_map[error_code]
                    item['error_name'] = code_info['nm']
                    item['bg_color'] = code_info['bg_colr']
                    item['txt_color'] = code_info['txt_colr']
                else:
                    # TB_STS_CD_MST에 없는 경우 코드 그대로 사용
                    item['error_name'] = error_code
                    item['bg_color'] = '#a3a3a3'  # 기본 회색
                    item['txt_color'] = '#374151'

            return jsonify(trouble_data), 200
    except Exception as e:
        logging.error(f"❌ API: 분석 장애 데이터 조회 중 오류 발생: {e}", exc_info=True)
        return jsonify({"message": "분석 장애 데이터 조회 중 오류이 발생했습니다."}), 500

@analysis_api_bp.route('/summary', methods=['GET'])
@login_required
@check_password_change_required
def api_analysis_summary():
    """
    [공통화] 대시보드와 데이터 구조/필터링 방식이 완전히 동일하므로,
    중복 방지를 위해 대시보드 summary API를 그대로 재사용함.
    """
    # Re-implementing the logic from get_dashboard_summary to avoid direct call
    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')
            all_data_str = request.args.get('all_data', 'false')
            all_data = all_data_str.lower() == 'true'
            user = session.get('user')

            if not all_data:
                if not start_date_str or not end_date_str:
                    return jsonify({"message": "시작 및 종료 날짜가 필요합니다."}), 400

            summary_data = dashboard_service.get_summary(start_date_str, end_date_str, all_data, user=user)

            # Convert datetime objects to KST strings before jsonify
            convert_datetime_fields_to_kst_str(summary_data)
            # None 값을 빈 문자열로 변환
            for item in summary_data:
                for key, value in item.items():
                    if value is None:
                        item[key] = ''

            return jsonify(summary_data), 200
    except Exception as e:
        logging.error(f"❌ API: 분석 요약 데이터 조회 실패: {e}", exc_info=True)
        return jsonify({"message": "데이터 조회 중 오류가 발생했습니다."}), 500

@analysis_api_bp.route('/trend', methods=['GET'])
@login_required
@check_password_change_required
def api_analysis_trend():
    """
    데이터분석 추이/경향 데이터를 제공하는 API.
    """
    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            job_ids_str = request.args.get('job_ids')
            job_ids = job_ids_str.split(',') if job_ids_str else None
            user = session.get('user')
            data = dashboard_service.get_analytics_success_rate_trend(start_date, end_date, job_ids, user=user)

            # Convert datetime objects to KST strings before jsonify
            convert_datetime_fields_to_kst_str(data)
            # None 값을 빈 문자열로 변환
            for item in data:
                for key, value in item.items():
                    if value is None:
                        item[key] = ''

            return jsonify(data), 200
    except Exception as e:
        return jsonify({'message': f'추이 데이터 조회 실패: {e}'}), 500

@analysis_api_bp.route('/raw_data', methods=['GET'])
@login_required
@check_password_change_required
def api_analysis_raw_data():
    """
    데이터분석 원천데이터(상세 로그) API.
    """
    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            job_ids_str = request.args.get('job_ids')
            job_ids = job_ids_str.split(',') if job_ids_str else None
            user = session.get('user')

            # 권한 확인 로깅 추가
            user_id = user.get('user_id', 'Unknown') if user else 'NoUser'
            data_permissions = user.get('data_permissions', []) if user else []
            is_admin = user and 'mngr_sett' in user.get('permissions', [])
            current_app.logger.warning(f"[ANALYSIS_RAW_DATA] User: {user_id}, Admin: {is_admin}, Requested: {job_ids}, DataPerms: {data_permissions}")

            rows = dashboard_service.get_raw_data(start_date, end_date, job_ids, all_data=False, user=user)

            # Convert datetime objects to KST strings before jsonify
            convert_datetime_fields_to_kst_str(rows)
            # None 값을 빈 문자열로 변환
            for item in rows:
                for key, value in item.items():
                    if value is None:
                        item[key] = ''

            return jsonify(rows), 200
    except Exception as e:
        return jsonify({'message': f'원천데이터 조회 실패: {e}'}), 500

@analysis_api_bp.route('/job_ids', methods=['GET'])
@login_required
@check_password_change_required
def api_analysis_job_ids():
    """
    tb_con_hist에 실제로 존재하는 job_id만 중복 없이 반환하는 API.
    """
    log_operation("분석", "Job ID 목록", "API 요청", "수신됨")
    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            user = session.get('user')
            job_ids = dashboard_service.get_distinct_job_ids(user=user)
            result = [{"job_id": job_id} for job_id in job_ids if job_id]
            log_operation("분석", "Job ID 목록", "응답 생성", f"{len(result)}건 전송")
            return jsonify(result), 200
    except Exception as e:
        log_operation("분석", "Job ID 목록", "데이터 조회", f"실패: {type(e).__name__}", "ERROR")
        return jsonify({'message': f'Job ID 목록 조회 실패: {e}'}), 500

@analysis_api_bp.route('/error_codes', methods=['GET'])
def api_analysis_error_codes():
    """
    tb_con_hist에서 실제 존재하는 장애코드(status) 목록을 반환하는 API.
    """
    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            all_data_str = request.args.get('all_data', 'false')
            all_data = all_data_str.lower() == 'true'

            # dashboard_service를 통해 데이터 조회
            user = session.get('user')
            error_codes = dashboard_service.get_distinct_error_codes(start_date, end_date, all_data, user=user)

            # Get status codes dynamically
            status_codes = get_status_codes()

            # Create dynamic status name mapping
            status_names = {}
            for code, desc in status_codes.items():
                if 'FINISHED' in desc.upper():
                    status_names[code] = '정상(성공)'
                elif 'FAIL' in desc.upper():
                    status_names[code] = '실패'
                elif 'NO_DATA' in desc.upper():
                    status_names[code] = '미수집'
                elif 'PROGRESS' in desc.upper():
                    status_names[code] = '계측중'
                else:
                    status_names[code] = desc  # Use description as fallback

            result = [{"code": code, "name": status_names.get(code, code)} for code in error_codes]
            return jsonify(result), 200
    except Exception as e:
        logging.error(f"❌ API: 장애코드 목록 조회 실패: {e}", exc_info=True)
        return jsonify({'message': f'장애코드 목록 조회 실패: {e}'}), 500

@analysis_api_bp.route('/error_code_map', methods=['GET'])
@login_required
@check_password_change_required
def api_analysis_error_code_map():
    """
    tb_con_mst에서 cd_cl='CD900'인 장애코드와 item1(영문명) 매핑만 반환
    """
    try:
        with get_db_connection() as conn:
            mst_service = ConMstService(conn)
            rows = mst_service.get_error_code_map()
            code_map = {row['cd']: row['cd_nm'] for row in rows}
            return jsonify(code_map), 200
    except Exception as e:
        return jsonify({'message': f'장애코드 매핑 조회 실패: {e}'}), 500

@analysis_api_bp.route('/dynamic-chart', methods=['GET'])
@login_required
@check_password_change_required
def get_dynamic_chart_data():
    """
    사용자 정의 파라미터를 기반으로 동적 차트 데이터를 제공하는 API.
    ---
    parameters:
      - name: x_axis
        in: query
        type: string
        required: true
        description: '차트의 X축으로 사용할 차원 (예: date, job_id, status)'
        enum: ['date', 'job_id', 'status']
      - name: y_axis
        in: query
        type: string
        required: true
        description: '차트의 Y축으로 사용할 측정 항목 (예: success_count, fail_count, total_count, success_rate)'
        enum: ['success_count', 'fail_count', 'no_data_count', 'total_count', 'success_rate']
      - name: group_by
        in: query
        type: string
        required: false
        description: '데이터를 그룹화할 추가 차원 (예: job_id, status)'
        enum: ['job_id', 'status']
      - name: start_date
        in: query
        type: string
        required: true
        description: '조회 시작 날짜 (YYYY-MM-DD)'
      - name: end_date
        in: query
        type: string
        required: true
        description: '조회 종료 날짜 (YYYY-MM-DD)'
      - name: job_ids
        in: query
        type: array
        items:
          type: string
        required: false
        description: '필터링할 Job ID 목록'
    responses:
      200:
        description: '동적 차트 데이터 조회 성공'
        schema:
          type: array
          items:
            type: object
      400:
        description: '필수 파라미터 누락 또는 유효하지 않은 파라미터'
      500:
        description: '서버 내부 오류'
    """
    logging.info("▶ API: /api/analysis/dynamic-chart 요청 수신")
    try:
        with get_db_connection() as conn:
            analysis_service = AnalysisService(conn)
            params = {
                'x_axis': request.args.get('x_axis'),
                'y_axis': request.args.get('y_axis'),
                'group_by': request.args.get('group_by'),
                'start_date': request.args.get('start_date'),
                'end_date': request.args.get('end_date'),
                'job_ids': request.args.getlist('job_ids')
            }

            # 필수 파라미터 검증
            if not all([params['x_axis'], params['y_axis'], params['start_date'], params['end_date']]):
                return jsonify({"message": "x_axis, y_axis, start_date, end_date는 필수 파라미터입니다."}), 400

            user = session.get('user')
            chart_data = analysis_service.get_dynamic_chart_data(params, user=user)
            return jsonify(chart_data), 200
    except ValueError as ve:
        logging.error(f"❌ API: 유효하지 않은 파라미터: {ve}", exc_info=True)
        return jsonify({"message": str(ve)}), 400
    except Exception as e:
        logging.error(f"❌ API: 동적 차트 데이터 조회 실패: {e}", exc_info=True)
        return jsonify({"message": "동적 차트 데이터 조회 중 오류가 발생했습니다."}), 500


# ==========================================
# 사용자접속정보 탭용 API
# ==========================================

@analysis_api_bp.route('/statistics/user-list', methods=['GET'])
@login_required
def get_user_list_api():
    """
    사용자 목록과 접속 통계를 조회하는 API (사용자접속정보 탭용).
    
    Query Parameters:
        mode: 'all' (중복 포함, 기본값) 또는 'distinct' (1일 1접속)
    """
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 10, type=int)
        search = request.args.get('search', '')
        mode = request.args.get('mode', 'all')
        if mode not in ['all', 'distinct']:
            mode = 'all'
        
        with get_db_connection() as conn:
            analysis_service = AnalysisService(conn)
            result = analysis_service.get_user_list_with_stats(
                page=page,
                page_size=page_size,
                search_term=search if search else None,
                mode=mode
            )
            return jsonify(result), 200
    except Exception as e:
        logging.error(f"❌ API: 사용자 목록 조회 실패: {e}", exc_info=True)
        return jsonify({"message": "사용자 목록 조회 중 오류가 발생했습니다."}), 500

@analysis_api_bp.route('/statistics/user-detail/<user_id>', methods=['GET'])
@login_required
def get_user_detail_api(user_id: str):
    """
    특정 사용자의 상세 통계를 조회하는 API (히트맵, 차트 데이터 포함).
    
    Query Parameters:
        mode: 'all' (중복 포함, 기본값) 또는 'distinct' (1일 1접속)
    """
    try:
        # 쿼리 파라미터에서 모드 추출
        mode = request.args.get('mode', 'all')
        if mode not in ['all', 'distinct']:
            mode = 'all'
        
        with get_db_connection() as conn:
            analysis_service = AnalysisService(conn)
            result = analysis_service.get_user_detail_stats(user_id, mode=mode)
            return jsonify(result), 200
    except ValueError as ve:
        return jsonify({"message": str(ve)}), 404
    except Exception as e:
        logging.error(f"❌ API: 사용자 상세 조회 실패: {e}", exc_info=True)
        return jsonify({"message": "사용자 상세 조회 중 오류가 발생했습니다."}), 500


@analysis_api_bp.route('/settings/thresholds', methods=['GET'])
@login_required
def get_thresholds_api():
    """
    사용자 접속 상태 판정 기준 임계값을 조회하는 API.
    TB_CON_MST 테이블에서 CD991(최근), CD992(활성), CD993(휴 면)의 item1 값을 조회.
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                query = """
                    SELECT cd, item1
                    FROM tb_con_mst
                    WHERE cd IN ('CD991', 'CD992', 'CD993')
                    ORDER BY cd
                """
                cur.execute(query)
                rows = cur.fetchall()
                
                # 기본값 설정
                thresholds = {
                    'cd991': 30,  # 최근 접속 기준 (일)
                    'cd992': 7,   # 활성 사용자 기준 (일)
                    'cd993': 90   # 휴 면 전환 기준 (일)
                }
                
                # DB 값으로 업데이트
                for row in rows:
                    cd, item1 = row
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
                            logging.warning(f"Invalid threshold value for {cd}: {item1}")
                
                return jsonify(thresholds), 200
    except Exception as e:
        logging.error(f"❌ API: 임계값 조회 실패: {e}", exc_info=True)
        # 오류 시 기본값 반환
        return jsonify({
            'cd991': 30,
            'cd992': 7,
            'cd993': 90
        }), 200

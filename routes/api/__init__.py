from flask import Blueprint, request, jsonify, render_template
import logging
import json
import requests
import os
from dotenv import load_dotenv
import csv
import re
from datetime import datetime
import pytz

from service.mst_service import ConMstService
from service.url_analyzer_service import UrlAnalyzerService
from service.status_code_service import get_status_codes
from typing import Optional, Dict, List
from flask import session
from service.dashboard_service import DashboardService
from msys.database import get_db_connection
from utils.datetime_utils import convert_datetime_fields_to_kst_str
from dao.analytics_dao import AnalyticsDAO
import psycopg2.extras
from routes.auth_routes import login_required, check_password_change_required

load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

api_bp = Blueprint('api', __name__)

def _get_allowed_job_ids(user: Optional[Dict], requested_job_ids: Optional[List[str]] = None) -> Optional[List[str]]:
   """
   사용자 권한에 따라 허용된 Job ID 목록을 반환하는 헬퍼 함수.
   """
   if not user or 'mngr_sett' in user.get('permissions', []):
       return requested_job_ids

   user_permissions = set(user.get('data_permissions', []))
   if not user_permissions:
       return []

   if requested_job_ids:
       allowed = list(user_permissions.intersection(set(requested_job_ids)))
       logging.info(f"[Auth] User requested {len(requested_job_ids)} jobs, allowed: {len(allowed)}")
       return allowed
   
   return list(user_permissions)

@api_bp.route('/raw_data')
def raw_data_page():
    return render_template('raw_data.html')

@api_bp.route('/api/min-max-dates', methods=['GET'])
def get_min_max_dates():
    """
    tb_con_hist 테이블에서 데이터의 min, max 날짜를 반환하는 공통 API
    """
    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            dates = dashboard_service.get_min_max_dates()
            return jsonify(dates), 200
    except Exception as e:
        logging.error(f"❌ API: Min/max dates 조회 실패: {e}", exc_info=True)
        return jsonify({'message': f'Min/max dates 조회 실패: {e}'}), 500

@api_bp.route('/api/detail')
def api_detail():
    """
    [수정됨] tb_con_hist 테이블에서 특정 기간의 상세 데이터를 조회하는 API
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    all_data_str = request.args.get('all_data', 'false')
    all_data = all_data_str.lower() == 'true'
    job_ids_str = request.args.get('job_ids')
    requested_job_ids = job_ids_str.split(',') if job_ids_str else None
    user = session.get('user')

    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)
            
            allowed_job_ids = _get_allowed_job_ids(user, requested_job_ids)
            if allowed_job_ids is not None and not allowed_job_ids:
                return jsonify([]), 200

            rows = dashboard_service.get_raw_data(start_date, end_date, job_ids=allowed_job_ids, all_data=all_data)

            # 날짜 객체를 KST 'YYYY-MM-DD HH:MI:SS' 형식의 문자열로 변환
            convert_datetime_fields_to_kst_str(rows)
            # None 값을 빈 문자열로 변환
            for row in rows:
                for key, value in row.items():
                    if value is None:
                        row[key] = ''

            return jsonify(rows)
    except Exception as e:
        logging.error(f"❌ API: 상세 데이터 조회 실패: {e}", exc_info=True)
        return jsonify({'message': f'상세 데이터 조회 실패: {e}'}), 500

@api_bp.route('/api/mst_list', methods=['GET'])
def get_mst_list_api():
    """
    모든 마스터 목록 데이터를 제공하는 API.
    """
    try:
        with get_db_connection() as conn:
            mst_service = ConMstService(conn)
            data = mst_service.fetch_mst_list()
            result = []
            for job in data:
                result.append({
                    'job_id': job['cd'],
                    'cd_nm': job.get('cd_nm', '-'),
                    'item2': job.get('item2', '-'),
                    'use_yn': job.get('use_yn', 'Y'),  # use_yn 필드 추가
                })
            return jsonify(result), 200
    except Exception as e:
        logging.error(f"❌ API: 마스터 목록 조회 실패: {e}", exc_info=True)
        return jsonify({"message": "MST 목록 조회 중 오류가 발생했습니다."}), 500

@api_bp.route('/api/job_mst_info', methods=['GET'])
def api_job_mst_info():
    """
    job_id 리스트를 받아 tb_con_mst에서 상세정보를 반환하는 API
    """
    job_ids_str = request.args.get('job_ids')
    job_ids = job_ids_str.split(',') if job_ids_str else []
    try:
        with get_db_connection() as conn:
            mst_service = ConMstService(conn)
            result = mst_service.get_job_mst_info(job_ids)
            return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': f'job_mst_info 조회 실패: {e}'}), 500


@api_bp.route('/api/raw_data', methods=['GET'])
def api_raw_data():
    """
    tb_con_hist 테이블에서 특정 기간의 모든 원본 데이터를 조회하는 API
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    all_data_str = request.args.get('all_data', 'false')
    all_data = all_data_str.lower() == 'true'
    job_ids_str = request.args.get('job_ids')
    requested_job_ids = job_ids_str.split(',') if job_ids_str else None
    user = session.get('user')

    try:
        with get_db_connection() as conn:
            dashboard_service = DashboardService(conn)

            # CRITICAL FIX: Raw Data API에서는 반드시 job_ids 파라미터를 지정해야 함
            # job_ids가 없으면 사용자의 모든 허용 데이터를 반환하는데, 이는 보안 위험
            if not requested_job_ids:
                logging.warning(f"[RAW_DATA_API] job_ids parameter not specified - returning empty result for security")
                return jsonify([]), 200

            allowed_job_ids = _get_allowed_job_ids(user, requested_job_ids)
            if allowed_job_ids is not None and not allowed_job_ids:
                logging.warning(f"[RAW_DATA_API] User has no permissions for requested jobs, returning empty result")
                return jsonify([]), 200

            # 권한 확인 로깅 추가
            user_id = user.get('user_id', 'Unknown') if user else 'NoUser'
            data_permissions = user.get('data_permissions', []) if user else []
            is_admin = user and 'mngr_sett' in user.get('permissions', [])
            logging.warning(f"[RAW_DATA_API] User: {user_id}, Admin: {is_admin}, Requested: {requested_job_ids}, DataPerms: {data_permissions}, Allowed: {allowed_job_ids}")

            rows = dashboard_service.get_raw_data(start_date=start_date, end_date=end_date, all_data=all_data, job_ids=allowed_job_ids, user=user)

            # 날짜 객체를 KST 'YYYY-MM-DD HH:MI:SS' 형식의 문자열로 변환
            convert_datetime_fields_to_kst_str(rows)
            # None 값을 빈 문자열로 변환
            for row in rows:
                for key, value in row.items():
                    if value is None:
                        row[key] = ''

            return jsonify(rows), 200
    except Exception as e:
        logging.error(f"❌ API: 원본 데이터 조회 실패: {e}", exc_info=True)
        return jsonify({'message': f'원본 데이터 조회 실패: {e}'}), 500

@api_bp.route('/api/gemini', methods=['POST'])
def gemini_proxy():
    # 폐쇄망 환경으로 외부 API 호출 비활성화
    return jsonify({'error': '외부 API 호출이 비활성화되었습니다.'}), 503
    # data = request.json
    # headers = {
    #     'Content-Type': 'application/json',
    #     'x-goog-api-key': GEMINI_API_KEY
    # }
    # url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent'
    # try:
    #     resp = requests.post(url, headers=headers, json=data, verify=False)
    #     resp.raise_for_status()
    #     return jsonify(resp.json())
    # except Exception as e:
    #     return jsonify({'error': str(e), 'text': resp.text if 'resp' in locals() else ''}), 500

@api_bp.route('/api_test')
def api_test():
    return render_template('api_test.html')

@api_bp.route('/api_test_call', methods=['POST'])
def api_test_call():
    try:
        server_ip = request.form.get('server_ip', 'http://localhost:5000')
        endpoint = request.form.get('endpoint')
        method = request.form.get('method', 'GET')
        data = request.form.get('data', '{}')
        
        if not endpoint.startswith('/'):
            endpoint = '/' + endpoint
            
        if method == 'GET':
            import urllib.parse
            params = json.loads(data)
            query_string = urllib.parse.urlencode(params)
            if query_string:
                endpoint = f"{endpoint}?{query_string}"
                
        url = f"{server_ip.rstrip('/')}{endpoint}"
        
        logging.info(f"Calling API: {url}")
        
        if method == 'GET':
            response = requests.get(url)
        else:
            response = requests.post(url, json=json.loads(data))
            
        return jsonify({
            'status': 'success',
            'response': response.json() if response.status_code == 200 else response.text,
            'status_code': response.status_code,
            'full_url': url
        })
    except Exception as e:
        logging.error(f"API call error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        })

@api_bp.route('/api/analyze-url', methods=['POST'])
def analyze_pasted_content():
    """
    붙여넣기된 HTML 또는 텍스트 콘텐츠를 분석하여 명세서 후보 데이터를 추출하는 API
    """
    try:
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'message': '분석할 콘텐츠가 없습니다.'}), 400

        content = data['content']
        
        analyzer = UrlAnalyzerService()
        analysis_result = analyzer.analyze(content)
        
        return jsonify(analysis_result), 200

    except ValueError as ve:
        logging.error(f"❌ API: 콘텐츠 분석 중 값 오류 발생: {ve}", exc_info=True)
        return jsonify({'message': str(ve)}), 400
    except Exception as e:
        logging.error(f"❌ API: 콘텐츠 분석 실패: {e}", exc_info=True)
        return jsonify({'message': f'콘텐츠 분석 중 서버 오류가 발생했습니다: {e}'}), 500

@api_bp.route('/api/statistics/config', methods=['GET'])
@login_required
@check_password_change_required
def get_statistics_config():
    """
    통계 설정 데이터를 가져오는 API (메뉴 목록, 연도 목록, 아이콘 데이터)
    """
    try:
        with get_db_connection() as conn:
            analytics_dao = AnalyticsDAO(conn)
            
            # 메뉴 목록 가져오기 (TB_MENU 테이블)
            query = "SELECT MENU_ID, MENU_NM FROM TB_MENU ORDER BY MENU_ID;"
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(query)
                menus = [dict(row) for row in cur.fetchall()]
            
            # 연도 목록 가져오기 (TB_USER_ACS_LOG 테이블의 데이터가 있는 연도)
            query = "SELECT DISTINCT EXTRACT(YEAR FROM ACS_DT)::integer as year FROM TB_USER_ACS_LOG ORDER BY year DESC;"
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(query)
                years = [row['year'] for row in cur.fetchall()]
            
            # 아이콘 데이터 가져오기 (TB_ICON 테이블)
            query = "SELECT ICON_ID, ICON_CD, ICON_NM, ICON_EXPL FROM TB_ICON WHERE ICON_DSP_YN = 'Y' ORDER BY ICON_ID;"
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(query)
                icons = [dict(row) for row in cur.fetchall()]
            
            return jsonify({
                'menus': menus,
                'years': years,
                'icons': icons
            }), 200
    except Exception as e:
        logging.error(f"❌ API: 통계 설정 조회 실패: {e}", exc_info=True)
        return jsonify({'message': f'통계 설정 조회 실패: {e}'}), 500

@api_bp.route('/api/statistics', methods=['GET'])
@login_required
@check_password_change_required
def get_statistics_data():
    """
    통계 데이터를 가져오는 API (일별, 주별/월별, 연도별 비교)
    """
    try:
        view_type = request.args.get('view_type', 'daily')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        year = request.args.get('year')
        menu_nm = request.args.get('menu_nm', 'all')
        
        with get_db_connection() as conn:
            analytics_dao = AnalyticsDAO(conn)
            
            if view_type == 'daily':
                # 일별 통계
                if not start_date or not end_date:
                    start_date = end_date = datetime.now().strftime('%Y-%m-%d')
                
                menu_access_stats = analytics_dao.get_menu_access_stats(
                    view_type='daily', 
                    start_date=start_date, 
                    end_date=end_date
                )
                
                total_access_stats = analytics_dao.get_total_access_stats(
                    view_type='daily', 
                    start_date=start_date, 
                    end_date=end_date
                )
                
                return jsonify({
                    'menu_access_stats': menu_access_stats,
                    'total_access_stats': total_access_stats
                }), 200
                
            elif view_type == 'weekly_monthly':
                # 주별/월별 통계
                if not year:
                    year = str(datetime.now().year)
                
                weekly_stats = analytics_dao.get_menu_access_stats_weekly(year, menu_nm)
                yearly_total = analytics_dao.get_yearly_total_stats(year, menu_nm)
                
                # 주별 통계 데이터 구조화
                structured_weekly_stats = []
                monthly_data = {}
                
                for stat in weekly_stats:
                    month = stat['month']
                    week = stat['week_of_month']
                    menu = stat['menu_nm']
                    
                    if month not in monthly_data:
                        monthly_data[month] = {}
                    
                    if week not in monthly_data[month]:
                        monthly_data[month][week] = {
                            'month': month,
                            'week': week,
                            'menus': [],
                            'site_unique_user_count': 0
                        }
                    
                    monthly_data[month][week]['menus'].append({
                        'menu_nm': menu,
                        'total_access_count': stat['total_access_count'],
                        'unique_user_count': stat['unique_user_count']
                    })
                
                # site_unique_user_count 추가 (주별 전체 순 방문자 수)
                weekly_site_unique = analytics_dao.get_total_unique_users_by_week(year)
                for month, weeks in monthly_data.items():
                    for week, week_data in weeks.items():
                        if (month, week) in weekly_site_unique:
                            week_data['site_unique_user_count'] = weekly_site_unique[(month, week)]
                
                # 구조화된 데이터를 리스트로 변환
                for month in sorted(monthly_data.keys()):
                    for week in sorted(monthly_data[month].keys()):
                        structured_weekly_stats.append(monthly_data[month][week])
                
                return jsonify({
                    'weekly_stats': structured_weekly_stats,
                    'yearly_total': yearly_total
                }), 200
                
            elif view_type == 'comparison':
                # 연도별 비교 통계
                if not year:
                    year = str(datetime.now().year)
                
                this_year = year
                last_year = str(int(year) - 1)
                
                this_year_stats = analytics_dao.get_menu_access_stats_weekly(this_year, menu_nm)
                last_year_stats = analytics_dao.get_menu_access_stats_weekly(last_year, menu_nm)
                
                this_year_total = analytics_dao.get_yearly_total_stats(this_year, menu_nm)
                last_year_total = analytics_dao.get_yearly_total_stats(last_year, menu_nm)
                
                # 주별 통계 데이터 구조화 (이번 년도)
                structured_this_year_stats = []
                monthly_data = {}
                
                for stat in this_year_stats:
                    month = stat['month']
                    week = stat['week_of_month']
                    menu = stat['menu_nm']
                    
                    if month not in monthly_data:
                        monthly_data[month] = {}
                    
                    if week not in monthly_data[month]:
                        monthly_data[month][week] = {
                            'month': month,
                            'week': week,
                            'menus': [],
                            'site_unique_user_count': 0
                        }
                    
                    monthly_data[month][week]['menus'].append({
                        'menu_nm': menu,
                        'total_access_count': stat['total_access_count'],
                        'unique_user_count': stat['unique_user_count']
                    })
                
                weekly_site_unique = analytics_dao.get_total_unique_users_by_week(this_year)
                for month, weeks in monthly_data.items():
                    for week, week_data in weeks.items():
                        if (month, week) in weekly_site_unique:
                            week_data['site_unique_user_count'] = weekly_site_unique[(month, week)]
                
                for month in sorted(monthly_data.keys()):
                    for week in sorted(monthly_data[month].keys()):
                        structured_this_year_stats.append(monthly_data[month][week])
                
                # 주별 통계 데이터 구조화 (작년)
                structured_last_year_stats = []
                monthly_data = {}
                
                for stat in last_year_stats:
                    month = stat['month']
                    week = stat['week_of_month']
                    menu = stat['menu_nm']
                    
                    if month not in monthly_data:
                        monthly_data[month] = {}
                    
                    if week not in monthly_data[month]:
                        monthly_data[month][week] = {
                            'month': month,
                            'week': week,
                            'menus': [],
                            'site_unique_user_count': 0
                        }
                    
                    monthly_data[month][week]['menus'].append({
                        'menu_nm': menu,
                        'total_access_count': stat['total_access_count'],
                        'unique_user_count': stat['unique_user_count']
                    })
                
                weekly_site_unique = analytics_dao.get_total_unique_users_by_week(last_year)
                for month, weeks in monthly_data.items():
                    for week, week_data in weeks.items():
                        if (month, week) in weekly_site_unique:
                            week_data['site_unique_user_count'] = weekly_site_unique[(month, week)]
                
                for month in sorted(monthly_data.keys()):
                    for week in sorted(monthly_data[month].keys()):
                        structured_last_year_stats.append(monthly_data[month][week])
                
                return jsonify({
                    'this_year_stats': structured_this_year_stats,
                    'last_year_stats': structured_last_year_stats,
                    'yearly_total': {
                        'this_year': this_year_total,
                        'last_year': last_year_total
                    }
                }), 200
                
            else:
                return jsonify({'message': 'Invalid view type'}), 400
                
    except Exception as e:
        logging.error(f"❌ API: 통계 데이터 조회 실패: {e}", exc_info=True)
        return jsonify({'message': f'통계 데이터 조회 실패: {e}'}), 500

@api_bp.route('/api/statistics/download', methods=['GET'])
@login_required
@check_password_change_required
def download_statistics():
    """
    통계 데이터를 엑셀 파일로 다운로드하는 API
    """
    try:
        view_type = request.args.get('view_type', 'daily')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        year = request.args.get('year')
        menu_nm = request.args.get('menu_nm', 'all')
        
        with get_db_connection() as conn:
            analytics_dao = AnalyticsDAO(conn)
            
            if view_type == 'daily':
                if not start_date or not end_date:
                    start_date = end_date = datetime.now().strftime('%Y-%m-%d')
                
                menu_access_stats = analytics_dao.get_menu_access_stats(
                    view_type='daily', 
                    start_date=start_date, 
                    end_date=end_date
                )
                
                return jsonify({
                    'menu_access_stats': menu_access_stats
                }), 200
                
            elif view_type == 'weekly_monthly':
                if not year:
                    year = str(datetime.now().year)
                
                weekly_stats = analytics_dao.get_menu_access_stats_weekly(year, menu_nm)
                yearly_total = analytics_dao.get_yearly_total_stats(year, menu_nm)
                
                return jsonify({
                    'weekly_stats': weekly_stats,
                    'yearly_total': yearly_total
                }), 200
                
            elif view_type == 'comparison':
                if not year:
                    year = str(datetime.now().year)
                
                this_year = year
                last_year = str(int(year) - 1)
                
                this_year_stats = analytics_dao.get_menu_access_stats_weekly(this_year, menu_nm)
                last_year_stats = analytics_dao.get_menu_access_stats_weekly(last_year, menu_nm)
                
                this_year_total = analytics_dao.get_yearly_total_stats(this_year, menu_nm)
                last_year_total = analytics_dao.get_yearly_total_stats(last_year, menu_nm)
                
                return jsonify({
                    'this_year_stats': this_year_stats,
                    'last_year_stats': last_year_stats,
                    'yearly_total': {
                        'this_year': this_year_total,
                        'last_year': last_year_total
                    }
                }), 200
                
            else:
                return jsonify({'message': 'Invalid view type'}), 400
                
    except Exception as e:
        logging.error(f"❌ API: 통계 데이터 다운로드 실패: {e}", exc_info=True)
        return jsonify({'message': f'통계 데이터 다운로드 실패: {e}'}), 500

@api_bp.route('/api/save-event-log', methods=['POST'])
def save_event_log():
    """
    클라이언트로부터 받은 이벤트 로그(JSON)를 텍스트 형식으로 변환하여 txt 파일로 저장하는 API
    """
    try:
        log_items = request.json
        if not log_items:
            return jsonify({'error': 'No data received'}), 400

        # log 디렉토리 생성 (없는 경우)
        log_dir = 'log'
        os.makedirs(log_dir, exist_ok=True)

        # 파일명에 타임스탬프 추가
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_path = os.path.join(log_dir, f'event_log_{timestamp}.txt')

        # 텍스트 파일로 저장
        with open(file_path, 'w', encoding='utf-8') as f:
            for item in log_items:
                row = item.get('changed_row', {})
                job_id = row.get('job_id', '')
                status = row.get('status', '')
                
                # Get status codes dynamically
                status_codes = get_status_codes()

                # Create dynamic icon mapping
                icon_map = {}
                for code, desc in status_codes.items():
                    if desc.upper() == 'SUCCESS':
                        icon_map[code] = '🟢'
                    elif desc.upper() == 'FAIL':
                        icon_map[code] = '🔴'
                    elif desc.upper() == 'NO_DATA':
                        icon_map[code] = '🟠'
                    elif desc.upper() == 'IN_PROGRESS':
                        icon_map[code] = '🔵'
                    else:
                        icon_map[code] = '🔔'  # Default icon

                icon = icon_map.get(status, '🔔')

                dt_str = row.get('end_dt') or row.get('start_dt')
                main_time = dt_str if dt_str else 'N/A'

                success, total, percent = 0, 0, 0
                rqs_info = row.get('rqs_info')
                if rqs_info:
                    match = re.search(r'총 요청 수: (\d+), 실패: (\d+)', rqs_info)
                    if match:
                        total = int(match.group(1))
                        fail = int(match.group(2))
                        success = total - fail
                        percent = round((success / total) * 100) if total > 0 else 0

                # Create dynamic status mapping
                status_map = {}
                for code, desc in status_codes.items():
                    if desc.upper() == 'SUCCESS':
                        status_map[code] = {'msg': '정상 수집', 'desc': '수집완료'}
                    elif desc.upper() == 'FAIL':
                        status_map[code] = {'msg': '장애 발생', 'desc': '실패'}
                    elif desc.upper() == 'NO_DATA':
                        status_map[code] = {'msg': '미수집', 'desc': '미수집'}
                    elif desc.upper() == 'IN_PROGRESS':
                        status_map[code] = {'msg': '수집중', 'desc': '진행중'}
                    else:
                        status_map[code] = {'msg': desc, 'desc': desc}

                status_info = status_map.get(status, {'msg': status, 'desc': status})

                duration_hr_str = ''
                start_dt_str = row.get('start_dt')
                end_dt_str = row.get('end_dt')
                if start_dt_str and end_dt_str:
                    try:
                        start_dt = datetime.strptime(start_dt_str, '%Y-%m-%d %H:%M:%S')
                        end_dt = datetime.strptime(end_dt_str, '%Y-%m-%d %H:%M:%S')
                        duration_sec = (end_dt - start_dt).total_seconds()
                        duration_hr = duration_sec / 3600
                        duration_hr_str = f'수집시간: {duration_hr:.1f}hr'
                    except (ValueError, TypeError):
                        pass

                duration_display = f'({duration_hr_str})' if status != 'CD904' and duration_hr_str else duration_hr_str
                
                message = f"{status_info['msg']}, {f'{success:,}'}/{f'{total:,}'}({percent}%) {status_info['desc']} {duration_display}"
                
                log_line = f"{main_time} {icon} {job_id}: {message}"
                f.write(log_line + '\n')

        return jsonify({'message': 'Event log saved successfully', 'file_path': file_path}), 200

    except Exception as e:
        logging.error(f"❌ API: 이벤트 로그 저장 실패: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
